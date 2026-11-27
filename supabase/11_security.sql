-- =====================================================================
-- SIRIUS CRM — Sécurité : journal d'audit + verrou des profils
-- À exécuter APRÈS 10_roles.sql (idempotent).
--
--  1. audit_log : trace de TOUTE modification de la paie, des taux, des
--     produits et des rôles (qui, quand, avant, après). Non modifiable et
--     non supprimable, lisible par l'administrateur / le super admin.
--  2. Verrou des profils : un utilisateur ordinaire ne peut changer que son
--     nom et son téléphone — jamais son email, son statut actif, son manager
--     ni son agence.
-- =====================================================================

-- ----------------------------------------------------------------------
-- 1) Journal d'audit
-- ----------------------------------------------------------------------
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  -- null = action faite hors application (éditeur SQL, service_role).
  actor      uuid,
  action     text not null check (action in ('INSERT','UPDATE','DELETE')),
  table_name text not null,
  row_id     text,
  old_data   jsonb,
  new_data   jsonb
);
create index if not exists idx_audit_log_table_at on public.audit_log (table_name, at desc);
create index if not exists idx_audit_log_actor_at on public.audit_log (actor, at desc);

alter table public.audit_log enable row level security;

-- Lecture : niveau administratif seulement. Aucune politique d'écriture :
-- personne n'écrit via l'API, seuls les déclencheurs ci-dessous le font.
drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log for select
  using (public.is_admin());

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- Même le propriétaire de la table ne peut ni modifier ni effacer une ligne.
create or replace function public.audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'Le journal d''audit est en écriture seule.';
end;
$$;

drop trigger if exists trg_audit_log_immutable on public.audit_log;
create trigger trg_audit_log_immutable
  before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

-- Enregistre chaque changement avec l'auteur (auth.uid()).
create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor, action, table_name, row_id, old_data, new_data)
  values (
    (select auth.uid()),
    tg_op,
    tg_table_name,
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id') else (to_jsonb(new) ->> 'id') end,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'payroll_contracts', 'payroll_payments', 'payroll_policies',
    'payroll_products', 'commission_agreements', 'remuneration_plans'
  ] loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$I', t);
    execute format(
      'create trigger trg_audit_%1$s after insert or update or delete on public.%1$I
         for each row execute function public.log_audit()', t);
  end loop;
end $$;

-- Comptes : seulement les changements qui comptent (pas la dernière connexion).
drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
  after insert or delete or update of role, active, manager_id, email on public.profiles
  for each row execute function public.log_audit();

-- ----------------------------------------------------------------------
-- 2) Verrou des champs sensibles d'un profil
-- ----------------------------------------------------------------------
create or replace function public.guard_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Hors application (service_role, éditeur SQL) ou niveau administratif : libre.
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if new.email      is distinct from old.email
     or new.active     is distinct from old.active
     or new.manager_id is distinct from old.manager_id
     or new.agency     is distinct from old.agency then
    raise exception 'Modification non autorisée : seuls nom et téléphone sont modifiables.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_fields on public.profiles;
create trigger trg_guard_profile_fields
  before update on public.profiles
  for each row execute function public.guard_profile_fields();
