-- =====================================================================
-- SIRIUS CRM — Vérification de la base (lecture seule, ne modifie rien)
-- À exécuter dans le SQL editor Supabase APRÈS les scripts 01 à 12.
-- Chaque bloc renvoie un tableau : exécute-les un par un pour bien lire.
-- =====================================================================

-- 1) RLS activée partout ? (rls_enabled doit être true sur TOUTES les lignes)
select
  c.relname            as table_name,
  c.relrowsecurity     as rls_enabled,
  count(p.polname)     as nb_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relrowsecurity, c.relname;

-- 2) Fonctions de sécurité : SECURITY DEFINER attendu (true) sauf
--    guard_closing_insert et audit_log_immutable (déclencheurs simples).
select
  p.proname                         as function_name,
  p.prosecdef                       as security_definer,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_admin','is_super_admin','is_gestionnaire','is_manager_or_admin',
    'is_payroll_writer','can_see_user','can_see_payroll_user',
    'can_see_payroll_contract','period_closed','closed_periods',
    'guard_profile_role','guard_profile_fields','guard_closed_payment',
    'guard_closed_policy','guard_closed_contract','guard_closing_insert',
    'log_audit','audit_log_immutable'
  )
order by p.proname;

-- 3) Détail des policies
select
  tablename,
  policyname,
  cmd                                    as command,
  coalesce(qual, '(aucune)')             as using_expr,
  coalesce(with_check, '(aucune)')       as with_check_expr
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 4) Répartition des rôles (au moins 1 super_admin et 1 admin attendus)
select role, count(*) as nb
from public.profiles
group by role
order by role;

-- 5) Hiérarchie : qui gère quels commerciaux ?
select
  m.name                              as responsable,
  m.role                              as role,
  count(c.id)                         as nb_commerciaux,
  string_agg(c.name, ', ' order by c.name) as commerciaux
from public.profiles m
left join public.profiles c on c.manager_id = m.id and c.role = 'commercial'
where m.role in ('super_admin','admin','gestionnaire','manager')
group by m.id, m.name, m.role
order by m.role, m.name;

-- 6) Anomalies : commerciaux SANS manager (devrait être vide)
select id, name, email, role, manager_id
from public.profiles
where role = 'commercial' and manager_id is null;

-- 7) Anomalie : commercial rattaché à quelqu'un qui n'est PAS manager
--    (ex. un ancien compte de test passé super_admin) — à réaffecter.
select c.name as commercial, m.name as rattache_a, m.role as role_du_responsable
from public.profiles c
join public.profiles m on m.id = c.manager_id
where c.role = 'commercial' and m.role <> 'manager';

-- 8) Anomalies : manager_id pointant vers un profil inexistant (devrait être vide)
select p.id, p.name, p.manager_id
from public.profiles p
where p.manager_id is not null
  and not exists (select 1 from public.profiles m where m.id = p.manager_id);

-- 9) Comptes Auth sans profil (devrait être vide) — nécessite accès schéma auth
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 10) Déclencheurs de sécurité en place (audit, verrous, clôture)
select
  c.relname   as table_name,
  t.tgname    as trigger_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not t.tgisinternal
  and (t.tgname like 'trg_audit_%' or t.tgname like 'trg_guard_%')
order by c.relname, t.tgname;

-- 11) Mois clôturés (lecture : admin / gestionnaire uniquement)
select period, closed_at, closed_by_name, total_pay, total_cabinet_commission
from public.payroll_closings
order by period desc;

-- 12) Dernières actions du journal d'audit
select at, action, table_name, row_id, actor
from public.audit_log
order by at desc
limit 20;
