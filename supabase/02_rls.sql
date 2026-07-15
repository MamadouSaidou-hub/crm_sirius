-- =====================================================================
-- SIRIUS CRM — Sécurité au niveau des lignes (Row Level Security)
-- À exécuter EN DEUXIÈME (après 01_schema.sql).
--
-- Règles : admin = tout ; manager = son équipe + lui ; commercial = lui.
-- Les fonctions ci-dessous sont SECURITY DEFINER (elles contournent la RLS
-- pour éviter la récursion en lisant public.profiles).
-- =====================================================================

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_manager_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','manager'));
$$;

-- Le current user peut-il "voir" les données de `target` ?
create or replace function public.can_see_user(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_admin()
    or target = auth.uid()
    or exists(select 1 from public.profiles where id = target and manager_id = auth.uid());
$$;

-- Activer la RLS partout
alter table public.profiles      enable row level security;
alter table public.insurers      enable row level security;
alter table public.prospects     enable row level security;
alter table public.interactions  enable row level security;
alter table public.tasks         enable row level security;
alter table public.stage_history enable row level security;
alter table public.contracts     enable row level security;
alter table public.objectives    enable row level security;
alter table public.realizations  enable row level security;

-- ----------------------------------------------------------------------
-- profiles : lecture par tout utilisateur connecté (noms affichés partout).
-- Écriture : soi-même ou admin. Suppression : admin.
-- ----------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() is not null);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------
-- insurers : lecture pour tous les connectés ; écriture admin seulement.
-- ----------------------------------------------------------------------
drop policy if exists insurers_select on public.insurers;
create policy insurers_select on public.insurers for select
  using (auth.uid() is not null);

drop policy if exists insurers_write on public.insurers;
create policy insurers_write on public.insurers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------
-- prospects : périmètre par assigned_to.
-- ----------------------------------------------------------------------
drop policy if exists prospects_select on public.prospects;
create policy prospects_select on public.prospects for select
  using (public.can_see_user(assigned_to));

drop policy if exists prospects_insert on public.prospects;
create policy prospects_insert on public.prospects for insert
  with check (public.can_see_user(assigned_to));

drop policy if exists prospects_update on public.prospects;
create policy prospects_update on public.prospects for update
  using (public.can_see_user(assigned_to))
  with check (public.can_see_user(assigned_to));

drop policy if exists prospects_delete on public.prospects;
create policy prospects_delete on public.prospects for delete
  using (public.can_see_user(assigned_to));

-- ----------------------------------------------------------------------
-- interactions : liées à la visibilité du prospect.
-- ----------------------------------------------------------------------
drop policy if exists interactions_all on public.interactions;
create policy interactions_all on public.interactions for all
  using (exists (
    select 1 from public.prospects p
    where p.id = interactions.prospect_id and public.can_see_user(p.assigned_to)
  ))
  with check (exists (
    select 1 from public.prospects p
    where p.id = interactions.prospect_id and public.can_see_user(p.assigned_to)
  ));

-- ----------------------------------------------------------------------
-- tasks : périmètre par assigned_to.
-- ----------------------------------------------------------------------
drop policy if exists tasks_all on public.tasks;
create policy tasks_all on public.tasks for all
  using (public.can_see_user(assigned_to))
  with check (public.can_see_user(assigned_to));

-- ----------------------------------------------------------------------
-- stage_history : liée à la visibilité du prospect.
-- ----------------------------------------------------------------------
drop policy if exists stage_history_all on public.stage_history;
create policy stage_history_all on public.stage_history for all
  using (exists (
    select 1 from public.prospects p
    where p.id = stage_history.prospect_id and public.can_see_user(p.assigned_to)
  ))
  with check (exists (
    select 1 from public.prospects p
    where p.id = stage_history.prospect_id and public.can_see_user(p.assigned_to)
  ));

-- ----------------------------------------------------------------------
-- contracts : liés à la visibilité du prospect.
-- ----------------------------------------------------------------------
drop policy if exists contracts_all on public.contracts;
create policy contracts_all on public.contracts for all
  using (exists (
    select 1 from public.prospects p
    where p.id = contracts.prospect_id and public.can_see_user(p.assigned_to)
  ))
  with check (exists (
    select 1 from public.prospects p
    where p.id = contracts.prospect_id and public.can_see_user(p.assigned_to)
  ));

-- ----------------------------------------------------------------------
-- objectives : lecture selon le périmètre ; définition par un supérieur.
-- ----------------------------------------------------------------------
drop policy if exists objectives_select on public.objectives;
create policy objectives_select on public.objectives for select
  using (public.can_see_user(user_id));

drop policy if exists objectives_write on public.objectives;
create policy objectives_write on public.objectives for all
  using (public.is_manager_or_admin() and public.can_see_user(user_id))
  with check (public.is_manager_or_admin() and public.can_see_user(user_id));

-- ----------------------------------------------------------------------
-- realizations : le commercial déclare les siennes ; le manager valide.
-- ----------------------------------------------------------------------
drop policy if exists realizations_select on public.realizations;
create policy realizations_select on public.realizations for select
  using (public.can_see_user(commercial_id));

drop policy if exists realizations_insert on public.realizations;
create policy realizations_insert on public.realizations for insert
  with check (
    commercial_id = auth.uid()
    or (public.is_manager_or_admin() and public.can_see_user(commercial_id))
  );

drop policy if exists realizations_update on public.realizations;
create policy realizations_update on public.realizations for update
  using (public.is_manager_or_admin() and public.can_see_user(commercial_id))
  with check (public.is_manager_or_admin() and public.can_see_user(commercial_id));

drop policy if exists realizations_delete on public.realizations;
create policy realizations_delete on public.realizations for delete
  using (
    (commercial_id = auth.uid() and status = 'pending')
    or public.is_admin()
  );
