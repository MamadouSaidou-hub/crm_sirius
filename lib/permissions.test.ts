import { describe, expect, it } from "vitest";
import {
  ROLE_ORDER,
  canAccessTechnicalSettings,
  canDeletePayroll,
  canEditRates,
  canManageTeam,
  canWritePayroll,
  creatableRoles,
  isAdminLevel,
  seesAllPayroll,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["super_admin", "admin", "gestionnaire", "manager", "commercial"];

describe("rate editing", () => {
  it("is reserved to the director and the technician", () => {
    expect(ROLES.filter(canEditRates)).toEqual(["super_admin", "admin"]);
  });
});

describe("payroll", () => {
  it("everyone but the commercial can record contracts, payments and policies", () => {
    expect(ROLES.filter(canWritePayroll)).toEqual(["super_admin", "admin", "gestionnaire", "manager"]);
  });

  it("the gestionnaire records and sees everything but cannot delete", () => {
    expect(canWritePayroll("gestionnaire")).toBe(true);
    expect(seesAllPayroll("gestionnaire")).toBe(true);
    expect(canDeletePayroll("gestionnaire")).toBe(false);
    expect(canEditRates("gestionnaire")).toBe(false);
  });

  it("the manager only sees their team, not all the payroll", () => {
    expect(seesAllPayroll("manager")).toBe(false);
    expect(seesAllPayroll("commercial")).toBe(false);
  });

  it("only the administrative level deletes", () => {
    expect(ROLES.filter(canDeletePayroll)).toEqual(["super_admin", "admin"]);
  });
});

describe("accounts", () => {
  it("only the super admin creates admins", () => {
    expect(creatableRoles("super_admin")).toContain("admin");
    expect(creatableRoles("admin")).not.toContain("admin");
    expect(creatableRoles("admin")).not.toContain("super_admin");
  });

  it("the director creates gestionnaires, managers and commercials", () => {
    expect(creatableRoles("admin")).toEqual(["gestionnaire", "manager", "commercial"]);
  });

  it("a manager only creates commercials; others create nothing", () => {
    expect(creatableRoles("manager")).toEqual(["commercial"]);
    expect(creatableRoles("gestionnaire")).toEqual([]);
    expect(creatableRoles("commercial")).toEqual([]);
  });

  it("the Team page is for admins and managers, not the gestionnaire", () => {
    expect(ROLES.filter(canManageTeam)).toEqual(["super_admin", "admin", "manager"]);
  });
});

describe("technical settings and ordering", () => {
  it("technical settings belong to the super admin alone", () => {
    expect(ROLES.filter(canAccessTechnicalSettings)).toEqual(["super_admin"]);
  });

  it("administrative level is admin and super admin", () => {
    expect(ROLES.filter(isAdminLevel)).toEqual(["super_admin", "admin"]);
  });

  it("lists most privileged first", () => {
    const sorted = [...ROLES].sort((a, b) => ROLE_ORDER[a] - ROLE_ORDER[b]);
    expect(sorted).toEqual(ROLES);
  });
});
