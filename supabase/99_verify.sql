-- =====================================================================
-- SIRIUS CRM — Vérification de la base (lecture seule, ne modifie rien)
-- À exécuter dans le SQL editor Supabase. Chaque bloc renvoie un tableau.
-- Idéalement : exécute-les un par un pour bien lire chaque résultat.
-- =====================================================================

-- 1) RLS activée partout ? (rls_enabled doit être true sur les 9 tables)
select
  c.relname            as table_name,
  c.relrowsecurity     as rls_enabled,
  count(p.polname)     as nb_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in (
    'profiles','insurers','prospects','interactions','tasks',
    'stage_history','contracts','objectives','realizations'
  )
group by c.relname, c.relrowsecurity
order by c.relname;

-- 2) Les fonctions de sécurité existent et sont SECURITY DEFINER ?
select
  p.proname                         as function_name,
  p.prosecdef                       as security_definer,   -- doit être true
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_admin','is_manager_or_admin','can_see_user')
order by p.proname;

-- 3) Détail des policies (vérifie profiles_update = can_see_user(id))
select
  tablename,
  policyname,
  cmd                                    as command,
  coalesce(qual, '(aucune)')             as using_expr,
  coalesce(with_check, '(aucune)')       as with_check_expr
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 4) Répartition des rôles
select role, count(*) as nb
from public.profiles
group by role
order by role;

-- 5) Hiérarchie manager -> commerciaux
--    (chaque commercial doit avoir un manager_id ; les autres rôles non)
select
  m.name                              as manager,
  m.role                              as manager_role,
  count(c.id)                         as nb_commerciaux,
  string_agg(c.name, ', ' order by c.name) as commerciaux
from public.profiles m
left join public.profiles c on c.manager_id = m.id
where m.role in ('admin','manager')
group by m.id, m.name, m.role
order by m.role, m.name;

-- 6) Anomalies : commerciaux SANS manager (devrait être vide)
select id, name, email, role, manager_id
from public.profiles
where role = 'commercial' and manager_id is null;

-- 7) Anomalies : manager_id pointant vers un profil inexistant (devrait être vide)
select p.id, p.name, p.manager_id
from public.profiles p
where p.manager_id is not null
  and not exists (select 1 from public.profiles m where m.id = p.manager_id);

-- 8) Comptes Auth sans profil (devrait être vide) — nécessite accès schéma auth
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
