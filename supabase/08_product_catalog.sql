-- =====================================================================
-- SIRIUS CRM — Catalogue produits + taux de commission par produit
-- À exécuter APRÈS 07_commission_agreements.sql (idempotent).
--
--  - payroll_products : chaque produit appartient à une compagnie et à un
--    segment (individuel / groupe).
--  - commission_agreements : un taux peut viser un PRODUIT précis, une ligne
--    de produit d'une compagnie, ou toute la compagnie. Le plus précis gagne.
--  - Rétrocession au commercial modifiable par convention (sinon barème).
-- =====================================================================

do $$ begin create type product_segment as enum ('individuel','groupe'); exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------
-- Catalogue : compagnie + segment
-- ----------------------------------------------------------------------
alter table public.payroll_products
  add column if not exists insurer_id text not null default 'ins-nsia'
  references public.insurers(id);

alter table public.payroll_products
  add column if not exists segment product_segment not null default 'individuel';

-- « Retraite simple » est le produit « NSIA Retraite » du barème.
update public.payroll_products
   set label = 'NSIA Retraite'
 where code = 'RETRAITE_SIMPLE' and label = 'Retraite simple';

insert into public.payroll_products
  (code, label, insurer_id, segment, product_type, default_subscription, min_payment, assiette_type, frequency)
values
  ('NSIA_ETUDES',              'NSIA Etudes',                    'ins-nsia', 'individuel', 'vie', 0, 0, 'VARIABLE', 'mensuelle'),
  ('NSIA_PENSION',             'NSIA Pension',                   'ins-nsia', 'individuel', 'vie', 0, 0, 'VARIABLE', 'mensuelle'),
  ('CAREC',                    'Retraite complémentaire CAREC',  'ins-nsia', 'groupe',     'vie', 0, 0, 'VARIABLE', 'mensuelle'),
  ('PREVOYANCE_DECES_GROUPE',  'Prévoyance décès groupe',        'ins-nsia', 'groupe',     'vie', 0, 0, 'VARIABLE', 'mensuelle'),
  ('INDEMNITE_FIN_CARRIERE',   'Indemnité de fin de carrière',   'ins-nsia', 'groupe',     'vie', 0, 0, 'VARIABLE', 'mensuelle')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------
-- Conventions : portée « produit précis » + rétrocession optionnelle
-- Portée = product_id (produit) > product_type (ligne) > rien (compagnie).
-- ----------------------------------------------------------------------
alter table public.commission_agreements
  add column if not exists product_id uuid references public.payroll_products(id);

alter table public.commission_agreements
  add column if not exists retrocession_rate numeric
  check (retrocession_rate is null or (retrocession_rate >= 0 and retrocession_rate <= 1));

do $$ begin
  alter table public.commission_agreements
    add constraint commission_agreements_scope_check
    check (product_id is null or product_type is null);
exception when duplicate_object then null; end $$;

-- Un seul taux par portée et par date d'effet.
drop index if exists public.uq_commission_agreements_product;
drop index if exists public.uq_commission_agreements_insurer_wide;

create unique index if not exists uq_commission_agreements_product
  on public.commission_agreements (product_id, effective_from)
  where product_id is not null;

create unique index if not exists uq_commission_agreements_line
  on public.commission_agreements (insurer_id, product_type, effective_from)
  where product_id is null and product_type is not null;

create unique index if not exists uq_commission_agreements_insurer
  on public.commission_agreements (insurer_id, effective_from)
  where product_id is null and product_type is null;

-- ----------------------------------------------------------------------
-- Taux de départ du barème NSIA (le plus faible des taux proposés).
-- La fourchette d'origine est conservée dans la note.
-- ----------------------------------------------------------------------
insert into public.commission_agreements
  (insurer_id, product_id, rate, base, effective_from, note)
select 'ins-nsia', p.id, v.rate, 'ttc', date '2000-01-01', v.note
from (values
  ('RETRAITE_SIMPLE',         0.05, 'Barème NSIA : 15 % en 1ère année puis 5 % — taux le plus faible retenu'),
  ('NSIA_ETUDES',             0.03, 'Barème NSIA : 10 % en 1ère année puis 3 % — taux le plus faible retenu'),
  ('NSIA_PENSION',            0.03, 'Barème NSIA : 10 % en 1ère année puis 3 % — taux le plus faible retenu'),
  ('LIBRE_RETRAITE',          0.03, 'Barème NSIA : 3 % pendant la durée du contrat'),
  ('RETRAITE_PRESTIGE',       0.03, 'Barème NSIA : 3 % pendant la durée du contrat'),
  ('PREVOYANCE_DECES',        0.10, 'Barème NSIA : 10 à 15 % pendant la durée du contrat — taux le plus faible retenu'),
  ('CAREC',                   0.04, 'Barème NSIA groupe : maximum 4 % de la cotisation nette'),
  ('PREVOYANCE_DECES_GROUPE', 0.20, 'Barème NSIA groupe : maximum 20 % de la prime nette'),
  ('INDEMNITE_FIN_CARRIERE',  0.04, 'Barème NSIA groupe : maximum 4 % de la cotisation nette')
) as v(code, rate, note)
join public.payroll_products p on p.code = v.code
on conflict do nothing;

-- ----------------------------------------------------------------------
-- RLS : un commercial voit les conventions qui touchent ses contrats
-- (produit précis, ligne de produit ou compagnie entière).
-- ----------------------------------------------------------------------
drop policy if exists commission_agreements_select on public.commission_agreements;
create policy commission_agreements_select on public.commission_agreements for select
  using (
    public.is_manager_or_admin()
    or exists (
      select 1
      from public.payroll_contracts c
      join public.payroll_products p on p.id = c.product_id
      where c.insurer_id = commission_agreements.insurer_id
        and (commission_agreements.product_id is null
             or commission_agreements.product_id = c.product_id)
        and (commission_agreements.product_type is null
             or commission_agreements.product_type = p.product_type)
    )
  );
