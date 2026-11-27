-- =====================================================================
-- SIRIUS CRM — Polices IARD (auto, voyage, santé…) : commission par police
-- À exécuter APRÈS 08_product_catalog.sql (idempotent).
--
--  - payroll_products.commission_mode : 'per_payment' (vie : chaque versement,
--    règle des N mois) ou 'per_policy' (IARD : une seule fois, à l'émission).
--  - commission_agreements.accessory_share : part des accessoires qui revient
--    au cabinet (0 = aucune, 0.5 = la moitié, 1 = tout), par convention.
--  - payroll_policies : une ligne par police émise (prime nette, FGA, taxes,
--    accessoires, TTC) rattachée au commercial qui l'a vendue.
--
-- Commission du cabinet = base x taux + accessoires x part des accessoires.
-- Le commercial reçoit sa rétrocession (barème) sur cette commission, le mois
-- de la date d'effet de la police.
-- =====================================================================

do $$ begin create type product_commission_mode as enum ('per_payment','per_policy'); exception when duplicate_object then null; end $$;

alter table public.payroll_products
  add column if not exists commission_mode product_commission_mode not null default 'per_payment';

alter table public.commission_agreements
  add column if not exists accessory_share numeric not null default 0
  check (accessory_share >= 0 and accessory_share <= 1);

-- ----------------------------------------------------------------------
-- Polices IARD
-- ----------------------------------------------------------------------
create table if not exists public.payroll_policies (
  id             uuid primary key default gen_random_uuid(),
  commercial_id  uuid not null references public.profiles(id),
  product_id     uuid not null references public.payroll_products(id),
  prospect_id    uuid references public.prospects(id) on delete set null,
  client_name    text not null,
  reference      text,
  effective_date date not null,
  expiry_date    date,
  prime_nette    numeric not null check (prime_nette >= 0),
  fga            numeric not null default 0 check (fga >= 0),
  taxes          numeric not null default 0 check (taxes >= 0),
  accessories    numeric not null default 0 check (accessories >= 0),
  prime_ttc      numeric not null default 0 check (prime_ttc >= 0),
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  check (expiry_date is null or expiry_date >= effective_date)
);
create index if not exists idx_payroll_policies_commercial
  on public.payroll_policies(commercial_id, effective_date);

alter table public.payroll_policies enable row level security;

drop policy if exists payroll_policies_select on public.payroll_policies;
create policy payroll_policies_select on public.payroll_policies for select
  using (public.can_see_user(commercial_id));

drop policy if exists payroll_policies_insert on public.payroll_policies;
create policy payroll_policies_insert on public.payroll_policies for insert
  with check (public.is_manager_or_admin() and public.can_see_user(commercial_id));

drop policy if exists payroll_policies_update on public.payroll_policies;
create policy payroll_policies_update on public.payroll_policies for update
  using (public.is_manager_or_admin() and public.can_see_user(commercial_id))
  with check (public.is_manager_or_admin() and public.can_see_user(commercial_id));

drop policy if exists payroll_policies_delete on public.payroll_policies;
create policy payroll_policies_delete on public.payroll_policies for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------
-- Produits auto des trois compagnies partenaires (commission par police)
-- ----------------------------------------------------------------------
insert into public.payroll_products
  (code, label, insurer_id, segment, product_type, default_subscription, min_payment,
   assiette_type, frequency, commission_mode)
values
  ('AUTO_AXA',   'Auto AXA',   'ins-axa',   'individuel', 'auto', 0, 0, 'VARIABLE', 'annuelle', 'per_policy'),
  ('AUTO_NSIA',  'Auto NSIA',  'ins-nsia',  'individuel', 'auto', 0, 0, 'VARIABLE', 'annuelle', 'per_policy'),
  ('AUTO_ASKIA', 'Auto ASKIA', 'ins-askia', 'individuel', 'auto', 0, 0, 'VARIABLE', 'annuelle', 'per_policy')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------
-- Taux de départ (prime nette ; part des accessoires revenant au cabinet)
--   AXA   : 20 %, accessoires 0 %
--   NSIA  : 20 %, accessoires 50 %
--   ASKIA : 25 %, accessoires 100 %
-- Les autres branches (voyage, santé…) s'ajoutent depuis « Conventions & taux ».
-- ----------------------------------------------------------------------
insert into public.commission_agreements
  (insurer_id, product_id, rate, base, accessory_share, effective_from, note)
select p.insurer_id, p.id, v.rate, 'prime_nette', v.share, date '2000-01-01', v.note
from (values
  ('AUTO_AXA',   0.20, 0.0, 'Auto AXA : 20 % de la prime nette, accessoires non commissionnés'),
  ('AUTO_NSIA',  0.20, 0.5, 'Auto NSIA : 20 % de la prime nette + la moitié des accessoires'),
  ('AUTO_ASKIA', 0.25, 1.0, 'Auto ASKIA : 25 % de la prime nette + tous les accessoires')
) as v(code, rate, share, note)
join public.payroll_products p on p.code = v.code
on conflict do nothing;

-- ----------------------------------------------------------------------
-- RLS : un commercial voit aussi les conventions qui touchent ses polices.
-- ----------------------------------------------------------------------
drop policy if exists commission_agreements_select on public.commission_agreements;
create policy commission_agreements_select on public.commission_agreements for select
  using (
    public.is_manager_or_admin()
    or exists (
      select 1
      from public.payroll_contracts c
      join public.payroll_products p on p.id = c.product_id
      where c.insurer_id = commission_agreements.insurer_id
        and (commission_agreements.product_id is null
             or commission_agreements.product_id = c.product_id)
        and (commission_agreements.product_type is null
             or commission_agreements.product_type = p.product_type)
    )
    or exists (
      select 1
      from public.payroll_policies q
      join public.payroll_products p on p.id = q.product_id
      where p.insurer_id = commission_agreements.insurer_id
        and (commission_agreements.product_id is null
             or commission_agreements.product_id = q.product_id)
        and (commission_agreements.product_type is null
             or commission_agreements.product_type = p.product_type)
    )
  );
