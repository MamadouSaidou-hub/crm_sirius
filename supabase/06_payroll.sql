-- =====================================================================
-- SIRIUS CRM — Rémunération des commerciaux (paie)
-- À exécuter APRÈS 02_rls.sql (idempotent).
--
-- Tables : payroll_products, payroll_contracts, payroll_payments.
-- Droits : admin = tout ; manager = son équipe ; commercial = lecture de
-- ses propres lignes uniquement. Écriture : admin / manager (sur leur périmètre).
-- =====================================================================

do $$ begin create type payroll_assiette as enum ('FIGEE','VARIABLE'); exception when duplicate_object then null; end $$;
do $$ begin create type payroll_frequence as enum ('mensuelle','annuelle'); exception when duplicate_object then null; end $$;
do $$ begin create type payroll_contract_status as enum ('actif','resilie'); exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------
-- Catalogue produits vie / retraite
-- ----------------------------------------------------------------------
create table if not exists public.payroll_products (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  label               text not null,
  default_subscription numeric not null default 0,
  min_payment         numeric not null default 0,
  assiette_type       payroll_assiette not null,
  frequency           payroll_frequence not null,
  min_duration_months int not null default 120
);

insert into public.payroll_products
  (code, label, default_subscription, min_payment, assiette_type, frequency)
values
  ('RETRAITE_SIMPLE',   'Retraite simple',   0,      0,      'FIGEE',    'mensuelle'),
  ('LIBRE_RETRAITE',    'Libre retraite',    100000, 50000,  'VARIABLE', 'mensuelle'),
  ('RETRAITE_PRESTIGE', 'Retraite prestige', 500000, 100000, 'VARIABLE', 'mensuelle'),
  ('PREVOYANCE_DECES',  'Prévoyance décès',  0,      0,      'FIGEE',    'annuelle')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------
-- Contrats
-- ----------------------------------------------------------------------
create table if not exists public.payroll_contracts (
  id                  uuid primary key default gen_random_uuid(),
  commercial_id       uuid not null references public.profiles(id),
  product_id          uuid not null references public.payroll_products(id),
  prospect_id         uuid references public.prospects(id) on delete set null,
  client_name         text not null,
  signature_date      date not null,
  subscription_amount numeric not null default 0 check (subscription_amount >= 0),
  reference_premium   numeric not null check (reference_premium >= 0),
  duration_months     int not null default 120 check (duration_months > 0),
  status              payroll_contract_status not null default 'actif',
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now()
);
create index if not exists idx_payroll_contracts_commercial
  on public.payroll_contracts(commercial_id, signature_date);

-- ----------------------------------------------------------------------
-- Versements
-- ----------------------------------------------------------------------
create table if not exists public.payroll_payments (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid not null references public.payroll_contracts(id) on delete cascade,
  period          text not null check (period ~ '^\d{4}-\d{2}$'),
  amount          numeric not null check (amount > 0),
  is_subscription boolean not null default false,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index if not exists idx_payroll_payments_contract
  on public.payroll_payments(contract_id, period);

-- ----------------------------------------------------------------------
-- Helper : le current user peut-il voir ce contrat ? (SECURITY DEFINER pour
-- éviter la récursion RLS entre contrats et versements)
-- ----------------------------------------------------------------------
create or replace function public.can_see_payroll_contract(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.payroll_contracts c
    where c.id = target and public.can_see_user(c.commercial_id)
  );
$$;

alter table public.payroll_products  enable row level security;
alter table public.payroll_contracts enable row level security;
alter table public.payroll_payments  enable row level security;

drop policy if exists payroll_products_select on public.payroll_products;
create policy payroll_products_select on public.payroll_products for select
  using (auth.uid() is not null);

drop policy if exists payroll_products_write on public.payroll_products;
create policy payroll_products_write on public.payroll_products for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists payroll_contracts_select on public.payroll_contracts;
create policy payroll_contracts_select on public.payroll_contracts for select
  using (public.can_see_user(commercial_id));

drop policy if exists payroll_contracts_insert on public.payroll_contracts;
create policy payroll_contracts_insert on public.payroll_contracts for insert
  with check (public.is_manager_or_admin() and public.can_see_user(commercial_id));

drop policy if exists payroll_contracts_update on public.payroll_contracts;
create policy payroll_contracts_update on public.payroll_contracts for update
  using (public.is_manager_or_admin() and public.can_see_user(commercial_id))
  with check (public.is_manager_or_admin() and public.can_see_user(commercial_id));

drop policy if exists payroll_contracts_delete on public.payroll_contracts;
create policy payroll_contracts_delete on public.payroll_contracts for delete
  using (public.is_admin());

drop policy if exists payroll_payments_select on public.payroll_payments;
create policy payroll_payments_select on public.payroll_payments for select
  using (public.can_see_payroll_contract(contract_id));

drop policy if exists payroll_payments_insert on public.payroll_payments;
create policy payroll_payments_insert on public.payroll_payments for insert
  with check (public.is_manager_or_admin() and public.can_see_payroll_contract(contract_id));

drop policy if exists payroll_payments_delete on public.payroll_payments;
create policy payroll_payments_delete on public.payroll_payments for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------
-- RPC atomique : contrat + versements du mois 1 (SECURITY INVOKER → la RLS
-- s'applique : un manager ne peut créer que pour son équipe).
-- ----------------------------------------------------------------------
create or replace function public.create_payroll_contract(
  p_commercial   uuid,
  p_product      uuid,
  p_client       text,
  p_date         date,
  p_subscription numeric,
  p_premium      numeric,
  p_duration     int,
  p_prospect     uuid default null
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id     uuid;
  v_period text := to_char(p_date, 'YYYY-MM');
begin
  insert into public.payroll_contracts
    (commercial_id, product_id, prospect_id, client_name, signature_date,
     subscription_amount, reference_premium, duration_months, created_by)
  values
    (p_commercial, p_product, p_prospect, p_client, p_date,
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
