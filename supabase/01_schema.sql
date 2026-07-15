-- =====================================================================
-- SIRIUS CRM — Schéma de base de données (Supabase / PostgreSQL)
-- À exécuter EN PREMIER dans le SQL Editor de Supabase.
-- =====================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------
-- Enums (idempotents)
-- ----------------------------------------------------------------------
do $$ begin create type user_role as enum ('admin','manager','commercial'); exception when duplicate_object then null; end $$;
do $$ begin create type product_type as enum ('auto','mrh','sante','vie','iard'); exception when duplicate_object then null; end $$;
do $$ begin create type stage as enum ('lead','qualified','quoted','won','lost'); exception when duplicate_object then null; end $$;
do $$ begin create type interaction_type as enum ('call','visit','note','whatsapp','sms'); exception when duplicate_object then null; end $$;
do $$ begin create type task_type as enum ('call','visit','follow_up','quote','other'); exception when duplicate_object then null; end $$;
do $$ begin create type task_status as enum ('pending','done','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type integration_mode as enum ('api','portal'); exception when duplicate_object then null; end $$;
do $$ begin create type auto_formula as enum ('rc','tiers_plus','tous_risques'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_method as enum ('wave','orange_money','cash','card'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status as enum ('pending','paid'); exception when duplicate_object then null; end $$;
do $$ begin create type contract_status as enum ('active','pending_submission','rejected','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type realization_status as enum ('pending','validated','rejected'); exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------
-- profiles (1-1 avec auth.users) — porte le rôle, le manager, l'agence
-- ----------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  email        text not null,
  phone        text,
  role         user_role not null default 'commercial',
  manager_id   uuid references public.profiles(id) on delete set null,
  agency       text,
  active       boolean not null default true,
  last_login_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_profiles_manager on public.profiles(manager_id);

-- ----------------------------------------------------------------------
-- insurers (compagnies partenaires) — id texte stable ("ins-askia"…)
-- ----------------------------------------------------------------------
create table if not exists public.insurers (
  id               text primary key,
  name             text not null,
  short_name       text not null,
  products         product_type[] not null default '{}',
  integration_mode integration_mode not null default 'portal',
  commission_rate  numeric not null default 0.1,
  active           boolean not null default true,
  subscription_url text,
  dashboard_url    text,
  created_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------
-- prospects
-- ----------------------------------------------------------------------
create table if not exists public.prospects (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text,
  email             text,
  cni               text,
  address           text,
  city              text,
  products          product_type[] not null default '{}',
  estimated_premium numeric not null default 0,
  stage             stage not null default 'lead',
  assigned_to       uuid not null references public.profiles(id),
  notes             text,
  lost_reason       text,
  created_at        timestamptz not null default now(),
  last_activity_at  timestamptz not null default now()
);
create index if not exists idx_prospects_assigned on public.prospects(assigned_to);
create index if not exists idx_prospects_stage on public.prospects(stage);

-- ----------------------------------------------------------------------
-- interactions
-- ----------------------------------------------------------------------
create table if not exists public.interactions (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.prospects(id) on delete cascade,
  type         interaction_type not null,
  summary      text not null,
  duration_min integer,
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz not null default now()
);
create index if not exists idx_interactions_prospect on public.interactions(prospect_id);

-- ----------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  type        task_type not null default 'other',
  status      task_status not null default 'pending',
  due_date    timestamptz not null,
  prospect_id uuid references public.prospects(id) on delete set null,
  assigned_to uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_tasks_prospect on public.tasks(prospect_id);
create index if not exists idx_tasks_due on public.tasks(due_date);

-- ----------------------------------------------------------------------
-- stage_history
-- ----------------------------------------------------------------------
create table if not exists public.stage_history (
  id          uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  from_stage  stage,
  to_stage    stage not null,
  changed_by  uuid not null references public.profiles(id),
  changed_at  timestamptz not null default now()
);
create index if not exists idx_stage_history_prospect on public.stage_history(prospect_id);

-- ----------------------------------------------------------------------
-- contracts (souscriptions)
-- ----------------------------------------------------------------------
create table if not exists public.contracts (
  id                 uuid primary key default gen_random_uuid(),
  quote_id           text,
  prospect_id        uuid not null references public.prospects(id) on delete cascade,
  insurer_id         text not null references public.insurers(id),
  formula            auto_formula not null,
  total_premium      numeric not null,
  effective_date     date not null,
  expiry_date        date not null,
  status             contract_status not null default 'pending_submission',
  payment_method     payment_method not null,
  payment_status     payment_status not null default 'pending',
  policy_number      text,
  attestation_number text,
  created_by         uuid not null references public.profiles(id),
  created_at         timestamptz not null default now()
);
create index if not exists idx_contracts_prospect on public.contracts(prospect_id);
create index if not exists idx_contracts_insurer on public.contracts(insurer_id);

-- ----------------------------------------------------------------------
-- objectives (objectifs en cascade)
-- ----------------------------------------------------------------------
create table if not exists public.objectives (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  period        text not null,            -- 'YYYY-MM'
  target_amount numeric not null default 0,
  set_by        uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  unique (user_id, period)
);

-- ----------------------------------------------------------------------
-- realizations (réalisations déclarées / validées)
-- ----------------------------------------------------------------------
create table if not exists public.realizations (
  id            uuid primary key default gen_random_uuid(),
  commercial_id uuid not null references public.profiles(id) on delete cascade,
  period        text not null,
  amount        numeric not null,
  product       product_type not null,
  source        text not null default 'nsia',
  reference     text,
  status        realization_status not null default 'pending',
  declared_by   uuid not null references public.profiles(id),
  validated_by  uuid references public.profiles(id),
  validated_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_realizations_commercial on public.realizations(commercial_id, period);
create index if not exists idx_realizations_status on public.realizations(status);

-- ----------------------------------------------------------------------
-- Trigger : créer un profile à chaque inscription auth
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'commercial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------
-- Trigger : rafraîchir prospects.last_activity_at à chaque interaction
-- ----------------------------------------------------------------------
create or replace function public.touch_prospect_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prospects
     set last_activity_at = now()
   where id = new.prospect_id;
  return new;
end;
$$;

drop trigger if exists on_interaction_created on public.interactions;
create trigger on_interaction_created
  after insert on public.interactions
  for each row execute function public.touch_prospect_activity();
