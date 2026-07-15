-- =====================================================================
-- SIRIUS CRM — Données de référence (compagnies partenaires + liens)
-- À exécuter EN TROISIÈME (après 01 et 02). Ré-exécutable (upsert).
--
-- Ce sont de vraies données de référence (les compagnies réelles).
-- Aucune donnée de démo (prospects/tâches/objectifs) n'est insérée :
-- le cabinet saisira ses vraies données depuis l'application.
-- =====================================================================

insert into public.insurers
  (id, name, short_name, products, integration_mode, commission_rate, active, subscription_url, dashboard_url)
values
  ('ins-askia', 'Askia Assurances',        'Askia', array['auto','mrh','sante','iard']::product_type[],       'api',    0.12, true, null, null),
  ('ins-nsia',  'NSIA Assurances',         'NSIA',  array['auto','mrh','sante','vie','iard']::product_type[],  'api',    0.14, true,
     'https://samansiavie.sn/?ref=vfsb9hn', 'https://smart.nsiavieassurances.sn/dashboard'),
  ('ins-sonam', 'SONAM Assurances',        'SONAM', array['auto','mrh','vie','iard']::product_type[],          'portal', 0.10, true, null, null),
  ('ins-axa',   'AXA Assurances Sénégal',  'AXA',   array['auto','mrh','sante','vie','iard']::product_type[],  'portal', 0.13, true, null, null),
  ('ins-amsa',  'AMSA Assurances',         'AMSA',  array['auto','iard']::product_type[],                      'portal', 0.11, true, null, null),
  ('ins-sunu',  'SUNU Assurances',         'SUNU',  array['auto','mrh','sante','vie']::product_type[],         'portal', 0.12, true, null, null)
on conflict (id) do update set
  name             = excluded.name,
  short_name       = excluded.short_name,
  products         = excluded.products,
  integration_mode = excluded.integration_mode,
  commission_rate  = excluded.commission_rate,
  active           = excluded.active,
  subscription_url = excluded.subscription_url,
  dashboard_url    = excluded.dashboard_url;

-- =====================================================================
-- BOOTSTRAP DU PREMIER ADMIN
-- ---------------------------------------------------------------------
-- 1) Crée le premier utilisateur via Supabase (Authentication → Add user),
--    ou via l'écran d'inscription de l'application.
-- 2) Un profile est créé automatiquement (rôle 'commercial' par défaut).
-- 3) Promeus-le en admin en remplaçant l'email ci-dessous, puis exécute :
--
--    update public.profiles set role = 'admin'
--    where email = 'ton-email@exemple.com';
--
-- Ensuite, cet admin pourra créer/gérer les autres comptes depuis l'app,
-- ou tu crées les managers/commerciaux dans Supabase et tu ajustes
-- leur rôle + manager_id de la même manière.
-- =====================================================================
