/**
 * Who may do what. One place, pure functions of a role, so the screens never
 * compare role names themselves. The database enforces the same rules with
 * row-level security (see supabase/10_roles.sql): this file only decides what
 * to show.
 *
 * Roles:
 *  - super_admin  : the technician. Everything, including creating admins.
 *  - admin        : the director. Everything except technical settings and
 *                   creating other admins.
 *  - gestionnaire : records contracts, payments and policies for everyone, sees
 *                   all payroll; cannot change rates nor delete.
 *  - manager      : sees and records for their own team.
 *  - commercial   : sees only their own data.
 */

import type { UserRole } from "@/lib/types";

/** Director or technician: full administrative rights. */
export function isAdminLevel(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

/** Commission rates, remuneration plans, product catalogue, insurers. */
export function canEditRates(role: UserRole): boolean {
  return isAdminLevel(role);
}

/** Creating/updating contracts, payments and IARD policies. */
export function canWritePayroll(role: UserRole): boolean {
  return role !== "commercial";
}

/** Deleting payroll records is reserved to the administrative level. */
export function canDeletePayroll(role: UserRole): boolean {
  return isAdminLevel(role);
}

/** Sees the whole payroll (everyone's pay, cabinet profitability). */
export function seesAllPayroll(role: UserRole): boolean {
  return isAdminLevel(role) || role === "gestionnaire";
}

/** The Team page (accounts). */
export function canManageTeam(role: UserRole): boolean {
  return isAdminLevel(role) || role === "manager";
}

export function canExport(role: UserRole): boolean {
  return isAdminLevel(role) || role === "manager";
}

/** Technical settings of the platform. */
export function canAccessTechnicalSettings(role: UserRole): boolean {
  return role === "super_admin";
}

/** Roles an account of `role` may create (and assign). */
export function creatableRoles(role: UserRole): UserRole[] {
  switch (role) {
    case "super_admin":
      return ["super_admin", "admin", "gestionnaire", "manager", "commercial"];
    case "admin":
      return ["gestionnaire", "manager", "commercial"];
    case "manager":
      return ["commercial"];
    default:
      return [];
  }
}

/** Minimum length of a password set by an administrator (checked server-side). */
export const MIN_PASSWORD_LENGTH = 10;

/** Display order in lists, most privileged first. */
export const ROLE_ORDER: Record<UserRole, number> = {
  super_admin: 0,
  admin: 1,
  gestionnaire: 2,
  manager: 3,
  commercial: 4,
};
