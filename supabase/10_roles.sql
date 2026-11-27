-- =====================================================================
-- SIRIUS CRM — Rôles : super_admin (technicien) et gestionnaire
-- À exécuter APRÈS 09_iard_policies.sql (idempotent).
--
-- Rôles :
--   super_admin  : le technicien. Tout, y compris créer des admins.
--   admin        : le DG. Tout (taux, barèmes, comptes sauf admins).
--   gestionnaire : saisit contrats, versements et polices de TOUS les
--                  commerciaux et voit toute la paie ; ne modifie pas les taux,
--                  ne supprime rien.
--   manager      : son équipe.   commercial : lui-même.
--
-- Astuce : les rôles sont comparés en texte (role::text) pour que ce script
-- passe même dans une seule transaction avec l'ajout des valeurs d'enum.
-- =====================================================================

alter type user_role add value if not exists 'super_admin';
alter type user_role add value if not exists 'gestionnaire';

-- ----------------------------------------------------------------------
-- Fonctions de droits
-- ----------------------------------------------------------------------

-- Niveau administratif : DG ou technicien. Toutes les politiques « admin »
-- existantes (taux, barèmes, produits, suppression…) s'appliquent donc aux deux.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid()) and role::text in ('admin','super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid()) and role::text = 'super_admin'
  );
$$;

create or replace function public.is_gestionnaire()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid()) and role::text = 'gestionnaire'
  );
$$;

-- Admin, super admin ou manager (hors paie : le gestionnaire n'y figure pas).
create or replace function public.is_manager_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid()) and role::text in ('admin','super_admin','manager')
  );
$$;

-- Peut saisir / modifier la paie (contrats, versements, polices).
create or replace function public.is_payroll_writer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = (select auth.uid())
      and role::text in ('admin','super_admin','manager','gestionnaire')
  );
$$;

-- Qui voit la paie de `target` : comme can_see_user, plus le gestionnaire (tous).
create or replace function public.can_see_payroll_user(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_see_user(target) or public.is_gestionnaire();
$$;

create or replace function public.can_see_payroll_contract(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.payroll_contracts c
    where c.id = target and public.can_see_payroll_user(c.commercial_id)
  );
$$;

-- ----------------------------------------------------------------------
-- Paie : le gestionnaire voit et saisit pour tous ; suppression = admin.
-- ----------------------------------------------------------------------
drop policy if exists payroll_contracts_select on public.payroll_contracts;
create policy payroll_contracts_select on public.payroll_contracts for select
  using (public.can_see_payroll_user(commercial_id));

drop policy if exists payroll_contracts_insert on public.payroll_contracts;
create policy payroll_contracts_insert on public.payroll_contracts for insert
  with check (public.is_payroll_writer() and public.can_see_payroll_user(commercial_id));

drop policy if exists payroll_contracts_update on public.payroll_contracts;
create policy payroll_contracts_update on public.payroll_contracts for update
  using (public.is_payroll_writer() and public.can_see_payroll_user(commercial_id))
  with check (public.is_payroll_writer() and public.can_see_payroll_user(commercial_id));

drop policy if exists payroll_payments_insert on public.payroll_payments;
create policy payroll_payments_insert on public.payroll_payments for insert
  with check (public.is_payroll_writer() and public.can_see_payroll_contract(contract_id));

drop policy if exists payroll_policies_select on public.payroll_policies;
create policy payroll_policies_select on public.payroll_policies for select
  using (public.can_see_payroll_user(commercial_id));

drop policy if exists payroll_policies_insert on public.payroll_policies;
create policy payroll_policies_insert on public.payroll_policies for insert
  with check (public.is_payroll_writer() and public.can_see_payroll_user(commercial_id));

drop policy if exists payroll_policies_update on public.payroll_policies;
create policy payroll_policies_update on public.payroll_policies for update
  using (public.is_payroll_writer() and public.can_see_payroll_user(commercial_id))
  with check (public.is_payroll_writer() and public.can_see_payroll_user(commercial_id));

-- Les conventions de commission : lecture complète pour qui saisit la paie.
drop policy if exists commission_agreements_select on public.commission_agreements;
create policy commission_agreements_select on public.commission_agreements for select
  using (
    public.is_payroll_writer()
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
    or exists (
      select 1
      from public.payroll_policies q
      join public.payroll_products p on p.id = q.product_id
      where p.insurer_id = commission_agreements.insurer_id
        and (commission_agreements.product_id is null
             or commission_agreements.product_id = q.product_id)
        and (commission_agreements.product_type is null
             or commission_agreements.product_type = p.product_type)
    )
  );

-- ----------------------------------------------------------------------
-- Garde-fou sur les rôles : seul le super admin attribue ou retire les rôles
-- admin / super_admin ; seul un admin peut changer le rôle de quelqu'un.
-- (Le service_role et l'éditeur SQL n'ont pas d'auth.uid() : ils passent.)
-- ----------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.role = old.role then
    return new;
  end if;

  if (new.role::text in ('admin','super_admin')
      or (tg_op = 'UPDATE' and old.role::text in ('admin','super_admin')))
     and not public.is_super_admin() then
    raise exception 'Seul un super administrateur peut attribuer ou retirer le rôle admin.';
  end if;

  if tg_op = 'UPDATE' and not public.is_admin() then
    raise exception 'Changement de rôle non autorisé.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before insert or update of role on public.profiles
  for each row execute function public.guard_profile_role();

-- ----------------------------------------------------------------------
-- À FAIRE À LA MAIN (une fois), en remplaçant l'email :
--   update public.profiles set role = 'super_admin' where email = 'EMAIL-DU-TECHNICIEN';
--   update public.profiles set role = 'admin'       where email = 'EMAIL-DU-DG';
-- ----------------------------------------------------------------------
