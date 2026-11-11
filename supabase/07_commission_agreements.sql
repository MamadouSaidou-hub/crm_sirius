-- =====================================================================
-- SIRIUS CRM — Conventions de commission et barèmes de rémunération
-- À exécuter APRÈS 06_payroll.sql (idempotent).
--
-- Principe : les taux sont des DONNÉES versionnées dans le temps.
--  - commission_agreements : taux du cabinet par compagnie (et produit).
--  - remuneration_plans    : barème de rémunération des commerciaux.
-- Append-only : on n'édite jamais une ligne, on en ajoute une avec une
-- nouvelle date d'effet. L'historique est donc conservé.
-- Lecture : admin/manager (tout) ; commercial (seulement ce qui touche ses contrats). Écriture : admin uniquement.
-- =====================================================================

do $$ begin create type commission_base as enum ('ttc','ht','prime_nette'); exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------
-- Rattachement des contrats de paie à une compagnie et à une ligne de produit
-- ----------------------------------------------------------------------
alter table public.payroll_products
  add column if not exists product_type product_type not null default 'vie';

alter table public.payroll_contracts
  add column if not exists insurer_id text not null default 'ins-nsia'
  references public.insurers(id);

-- ----------------------------------------------------------------------
-- Conventions de commission (cabinet <- compagnie)
-- product_type NULL = toutes les lignes de produit de la compagnie.
-- Une convention reste valable jusqu'à la suivante (même portée).
-- ----------------------------------------------------------------------
create table if not exists public.commission_agreements (
  id             uuid primary key default gen_random_uuid(),
  insurer_id     text not null references public.insurers(id),
  product_type   product_type,
  rate           numeric not null check (rate >= 0 and rate <= 1),
  base           commission_base not null default 'ttc',
  effective_from date not null,
  note           text,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

-- Un seul taux par (compagnie, produit, date d'effet). Deux index partiels
-- car NULL n'est jamais égal à NULL dans un index unique classique.
create unique index if not exists uq_commission_agreements_product
  on public.commission_agreements (insurer_id, product_type, effective_from)
  where product_type is not null;

create unique index if not exists uq_commission_agreements_insurer_wide
  on public.commission_agreements (insurer_id, effective_from)
  where product_type is null;

-- ----------------------------------------------------------------------
-- Barèmes de rémunération des commerciaux
-- ----------------------------------------------------------------------
create table if not exists public.remuneration_plans (
  id                uuid primary key default gen_random_uuid(),
  base_fixe         numeric not null check (base_fixe >= 0),
  performance_rate  numeric not null check (performance_rate >= 0 and performance_rate <= 1),
  retrocession_rate numeric not null check (retrocession_rate >= 0 and retrocession_rate <= 1),
  duration_months   int not null check (duration_months > 0),
  effective_from    date not null unique,
  note              text,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------
-- Valeurs actuelles (reprises à l'identique des constantes précédentes)
-- ----------------------------------------------------------------------
insert into public.commission_agreements
  (insurer_id, product_type, rate, base, effective_from, note)
values
  ('ins-nsia', 'vie', 0.03, 'ttc', '2000-01-01', 'Convention NSIA vie — 3 % taxes comprises')
on conflict do nothing;

insert into public.remuneration_plans
  (base_fixe, performance_rate, retrocession_rate, duration_months, effective_from, note)
values
  (15000, 0.06, 0.10, 3, '2000-01-01', 'Barème initial')
on conflict (effective_from) do nothing;

-- ----------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------
alter table public.commission_agreements enable row level security;
alter table public.remuneration_plans    enable row level security;

drop policy if exists commission_agreements_select on public.commission_agreements;
-- Admin/manager : toutes les conventions. Commercial : uniquement celles qui
-- s'appliquent à ses propres contrats (il en a besoin pour sa fiche de paie).
create policy commission_agreements_select on public.commission_agreements for select
  using (
    public.is_manager_or_admin()
    or exists (
      select 1
      from public.payroll_contracts c
      join public.payroll_products p on p.id = c.product_id
      where c.insurer_id = commission_agreements.insurer_id
        and (commission_agreements.product_type is null
             or commission_agreements.product_type = p.product_type)
    )
  );

-- Pas de rétroactivité : la date d'effet ne peut pas précéder le mois courant.
drop policy if exists commission_agreements_insert on public.commission_agreements;
create policy commission_agreements_insert on public.commission_agreements for insert
  with check (
    public.is_admin()
    and effective_from >= date_trunc('month', current_date)::date
  );

drop policy if exists remuneration_plans_select on public.remuneration_plans;
-- Barème global : lisible par tout utilisateur connecté (le commercial connaît déjà ses règles).
create policy remuneration_plans_select on public.remuneration_plans for select
  using (auth.uid() is not null);

drop policy if exists remuneration_plans_insert on public.remuneration_plans;
create policy remuneration_plans_insert on public.remuneration_plans for insert
  with check (
    public.is_admin()
    and effective_from >= date_trunc('month', current_date)::date
  );

-- Volontairement aucune policy update / delete : les lignes sont immuables.

-- ----------------------------------------------------------------------
-- RPC de création de contrat : ajout de la compagnie (remplace la version 06).
-- SECURITY INVOKER → la RLS s'applique toujours.
-- ----------------------------------------------------------------------
drop function if exists public.create_payroll_contract(uuid, uuid, text, date, numeric, numeric, int, uuid);

create or replace function public.create_payroll_contract(
  p_commercial   uuid,
  p_product      uuid,
  p_client       text,
  p_date         date,
  p_subscription numeric,
  p_premium      numeric,
  p_duration     int,
  p_prospect     uuid default null,
  p_insurer      text default 'ins-nsia'
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id     uuid;
  v_period text := to_char(p_date, 'YYYY-MM');
begin
  insert into public.payroll_contracts
    (commercial_id, product_id, insurer_id, prospect_id, client_name, signature_date,
     subscription_amount, reference_premium, duration_months, created_by)
  values
    (p_commercial, p_product, p_insurer, p_prospect, p_client, p_date,
     p_subscription, p_premium, p_duration, auth.uid())
  returning id into v_id;

  if p_subscription > 0 then
    insert into public.payroll_payments (contract_id, period, amount, is_subscription, created_by)
    values (v_id, v_period, p_subscription, true, auth.uid());
  end if;
  if p_premium > 0 then
    insert into public.payroll_payments (contract_id, period, amount, is_subscription, created_by)
    values (v_id, v_period, p_premium, false, auth.uid());
  end if;

  return v_id;
end;
$$;
