-- =====================================================================
-- SIRIUS CRM — Passe de performance (quick wins)
-- À exécuter APRÈS 02_rls.sql (idempotent, sans risque).
--
-- C) Index d'appoint pour les tris/filtres les plus fréquents.
-- D) Micro-optimisation RLS : (select auth.uid()) est évalué une seule fois
--    par requête (initplan) au lieu d'une fois par ligne.
-- =====================================================================

-- ---------- C) Index d'appoint ----------

-- Tri par défaut de la liste prospects (last_activity_at desc).
create index if not exists idx_prospects_last_activity
  on public.prospects (last_activity_at desc);

-- Badge « en retard » + sections de la page Tâches (status + échéance).
create index if not exists idx_tasks_status_due
  on public.tasks (status, due_date);

-- Timeline des interactions d'un prospect (récent d'abord).
create index if not exists idx_interactions_prospect_created
  on public.interactions (prospect_id, created_at desc);

-- Historique de stage d'un prospect (récent d'abord).
create index if not exists idx_stage_history_prospect_changed
  on public.stage_history (prospect_id, changed_at desc);

-- ---------- D) RLS : évaluation unique de auth.uid() ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.is_manager_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin','manager')
  );
$$;

create or replace function public.can_see_user(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_admin()
    or target = (select auth.uid())
    or exists(
      select 1 from public.profiles
      where id = target and manager_id = (select auth.uid())
    );
$$;
