import { describe, expect, it } from "vitest";
import {
  ALL,
  NO_FILTERS,
  filterPolicies,
  hasActiveFilters,
  normalize,
} from "@/lib/payroll/policy-filters";
import type { PayrollPolicy } from "@/lib/data/payroll";

function policy(over: Partial<PayrollPolicy>): PayrollPolicy {
  return {
    id: "p",
    commercialId: "u-1",
    produitId: "prod-axa",
    dateEffet: "2026-11-10",
    primeNette: 10_000,
    fga: 0,
    taxes: 0,
    accessoires: 0,
    primeTtc: 0,
    clientName: "Client",
    reference: null,
    dateExpiration: null,
    ...over,
  };
}

const POLICIES = [
  policy({ id: "1", clientName: "Amadou Ba", reference: "AA482YV", commercialId: "u-1", produitId: "prod-axa" }),
  policy({ id: "2", clientName: "Éla Sow", reference: "DK3203BL", commercialId: "u-2", produitId: "prod-askia" }),
  policy({ id: "3", clientName: "Moustapha Tall", reference: null, commercialId: "u-1", produitId: "prod-nsia" }),
];

const insurerOf = (productId: string) =>
  ({ "prod-axa": "ins-axa", "prod-askia": "ins-askia", "prod-nsia": "ins-nsia" })[productId];

const ids = (list: PayrollPolicy[]) => list.map((p) => p.id);

describe("filterPolicies", () => {
  it("keeps everything without a filter", () => {
    expect(ids(filterPolicies(POLICIES, NO_FILTERS, insurerOf))).toEqual(["1", "2", "3"]);
  });

  it("filters by commercial", () => {
    expect(ids(filterPolicies(POLICIES, { ...NO_FILTERS, commercialId: "u-1" }, insurerOf))).toEqual(["1", "3"]);
  });

  it("filters by insurer", () => {
    expect(ids(filterPolicies(POLICIES, { ...NO_FILTERS, insurerId: "ins-askia" }, insurerOf))).toEqual(["2"]);
  });

  it("searches the insured name, ignoring case and accents", () => {
    expect(ids(filterPolicies(POLICIES, { ...NO_FILTERS, query: "ela" }, insurerOf))).toEqual(["2"]);
    expect(ids(filterPolicies(POLICIES, { ...NO_FILTERS, query: "TALL" }, insurerOf))).toEqual(["3"]);
  });

  it("searches the registration", () => {
    expect(ids(filterPolicies(POLICIES, { ...NO_FILTERS, query: "dk32" }, insurerOf))).toEqual(["2"]);
  });

  it("combines every filter", () => {
    const filters = { commercialId: "u-1", insurerId: "ins-axa", query: "amadou" };
    expect(ids(filterPolicies(POLICIES, filters, insurerOf))).toEqual(["1"]);
    expect(ids(filterPolicies(POLICIES, { ...filters, insurerId: "ins-nsia" }, insurerOf))).toEqual([]);
  });
});

describe("helpers", () => {
  it("detects active filters", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, query: "   " })).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, commercialId: "u-1" })).toBe(true);
    expect(hasActiveFilters({ commercialId: ALL, insurerId: "ins-axa", query: "" })).toBe(true);
  });

  it("normalizes accents and case", () => {
    expect(normalize("  Éla  ")).toBe("ela");
  });
});
