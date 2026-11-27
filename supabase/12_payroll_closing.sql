-- =====================================================================
-- SIRIUS CRM — Clôture mensuelle de la paie
-- À exécuter APRÈS 11_security.sql (idempotent).
--
-- Clôturer un mois = le valider : plus aucun versement, police ou contrat ne
-- peut être créé, modifié ou supprimé dans ce mois (verrou dans la base, donc
-- impossible à contourner depuis l'application). Les taux et barèmes étant
-- datés et non modifiables, les montants du mois restent identiques.
--
--  - payroll_closings : une ligne par mois clôturé, avec les totaux figés.
--  - Seul un administrateur / le DG clôture ; seul le super admin rouvre.
--  - Un mois ne se clôture qu'une fois terminé.
--  - Tout est tracé dans le journal d'audit.
-- =====================================================================

create table if not exists public.payroll_closings (
  period                   text primary key check (period ~ '^\d{4}-\d{2}$'),
  closed_at                timestamptz not null default now(),
  closed_by                uuid references public.profiles(id) default auth.uid(),
  closed_by_name           text,
  total_pay                numeric not null check (total_pay >= 0),
  total_cabinet_commission numeric not null check (total_cabinet_commission >= 0),
  lines                    jsonb not null default '[]'::jsonb,
  note                     text
);

alter table public.payroll_closings enable row level security;

-- Les totaux sont sensibles : lecture réservée à ceux qui voient toute la paie.
drop policy if exists payroll_closings_select on public.payroll_closings;
create policy payroll_closings_select on public.payroll_closings for select
  using (public.is_admin() or public.is_gestionnaire());

drop policy if exists payroll_closings_insert on public.payroll_closings;
create policy payroll_closings_insert on public.payroll_closings for insert
  with check (public.is_admin());

-- Rouvrir un mois : super admin uniquement. Aucune politique de modification.
drop policy if exists payroll_closings_delete on public.payroll_closings;
create policy payroll_closings_delete on public.payroll_closings for delete
  using (public.is_super_admin());

-- ----------------------------------------------------------------------
-- Aide : un mois est-il clôturé ? (SECURITY DEFINER : utilisable partout,
-- sans exposer les totaux)
-- ----------------------------------------------------------------------
create or replace function public.period_closed(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.payroll_closings where period = p);
$$;

-- Liste des mois clôturés, lisible par tout utilisateur connecté (sans montants).
create or replace function public.closed_periods()
returns setof text language sql stable security definer set search_path = public as $$
  select period from public.payroll_closings order by period;
$$;

revoke all on function public.period_closed(text) from public, anon;
revoke all on function public.closed_periods() from public, anon;
grant execute on function public.period_closed(text) to authenticated;
grant execute on function public.closed_periods() to authenticated;

-- ----------------------------------------------------------------------
-- Un mois ne peut être clôturé qu'une fois terminé.
-- ----------------------------------------------------------------------
create or replace function public.guard_closing_insert()
returns trigger language plpgsql as $$
begin
  if new.period >= to_char(current_date, 'YYYY-MM') then
    raise exception 'Un mois ne peut être clôturé qu''une fois terminé.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_closing_insert on public.payroll_closings;
create trigger trg_guard_closing_insert
  before insert on public.payroll_closings
  for each row execute function public.guard_closing_insert();

-- ----------------------------------------------------------------------
-- Verrous : rien ne bouge dans un mois clôturé.
-- ----------------------------------------------------------------------
create or replace function public.guard_closed_payment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT','UPDATE') and public.period_closed(new.period) then
    raise exception 'Mois % clôturé : modification impossible.', new.period;
  end if;
  if tg_op in ('UPDATE','DELETE') and public.period_closed(old.period) then
    raise exception 'Mois % clôturé : modification impossible.', old.period;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.guard_closed_policy()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT','UPDATE')
     and public.period_closed(to_char(new.effective_date, 'YYYY-MM')) then
    raise exception 'Mois % clôturé : modification impossible.', to_char(new.effective_date, 'YYYY-MM');
  end if;
  if tg_op in ('UPDATE','DELETE')
     and public.period_closed(to_char(old.effective_date, 'YYYY-MM')) then
    raise exception 'Mois % clôturé : modification impossible.', to_char(old.effective_date, 'YYYY-MM');
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.guard_closed_contract()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT','UPDATE')
     and public.period_closed(to_char(new.signature_date, 'YYYY-MM')) then
    raise exception 'Mois % clôturé : modification impossible.', to_char(new.signature_date, 'YYYY-MM');
  end if;

  if tg_op in ('UPDATE','DELETE') then
    -- Changer seulement le statut (résiliation) reste possible après clôture :
    -- il n'altère aucun montant déjà calculé.
    if tg_op = 'UPDATE'
       and (new.commercial_id, new.product_id, new.insurer_id, new.signature_date,
            new.subscription_amount, new.reference_premium, new.duration_months, new.client_name)
           is not distinct from
           (old.commercial_id, old.product_id, old.insurer_id, old.signature_date,
            old.subscription_amount, old.reference_premium, old.duration_months, old.client_name) then
      return new;
    end if;

    if public.period_closed(to_char(old.signature_date, 'YYYY-MM'))
       or exists (
         select 1 from public.payroll_payments p
         where p.contract_id = old.id and public.period_closed(p.period)
       ) then
      raise exception 'Contrat lié à un mois clôturé : modification impossible.';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_guard_closed_payment on public.payroll_payments;
create trigger trg_guard_closed_payment
  before insert or update or delete on public.payroll_payments
  for each row execute function public.guard_closed_payment();

drop trigger if exists trg_guard_closed_policy on public.payroll_policies;
create trigger trg_guard_closed_policy
  before insert or update or delete on public.payroll_policies
  for each row execute function public.guard_closed_policy();

drop trigger if exists trg_guard_closed_contract on public.payroll_contracts;
create trigger trg_guard_closed_contract
  before insert or update or delete on public.payroll_contracts
  for each row execute function public.guard_closed_contract();

-- ----------------------------------------------------------------------
-- Audit : la clôture et la réouverture sont tracées (clé = le mois).
-- ----------------------------------------------------------------------
create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (actor, action, table_name, row_id, old_data, new_data)
  values (
    (select auth.uid()),
    tg_op,
    tg_table_name,
    coalesce(row_data ->> 'id', row_data ->> 'period'),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

drop trigger if exists trg_audit_payroll_closings on public.payroll_closings;
create trigger trg_audit_payroll_closings
  after insert or update or delete on public.payroll_closings
  for each row execute function public.log_audit();
