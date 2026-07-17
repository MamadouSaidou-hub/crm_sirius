-- =====================================================================
-- SIRIUS CRM — Incrément : le manager gère ses commerciaux
-- À exécuter APRÈS 02_rls.sql.
--
-- Objectif : un manager peut modifier / activer / désactiver les profils
-- de SES commerciaux (ceux dont manager_id = son id), en plus du sien.
-- On réutilise can_see_user(id) qui vaut déjà :
--   admin  OU  id = soi  OU  (le profil `id` a manager_id = soi).
-- =====================================================================

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (public.can_see_user(id))
  with check (public.can_see_user(id));
