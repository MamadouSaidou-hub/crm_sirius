/**
 * Filtering of the IARD policies list: by commercial, by insurer and by free
 * text (insured name or registration). Pure and DB-free.
 */

import type { PayrollPolicy } from "@/lib/data/payroll";

/** Select value meaning "no filter". */
export const ALL = "all";

export interface PolicyFilters {
  commercialId: string;
  insurerId: string;
  query: string;
}

export const NO_FILTERS: PolicyFilters = {
  commercialId: ALL,
  insurerId: ALL,
  query: "",
};

/** Lower-case and strip accents so "Amadou" matches "amadou" and "Éla" matches "ela". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function hasActiveFilters(filters: PolicyFilters): boolean {
  return (
    filters.commercialId !== ALL ||
    filters.insurerId !== ALL ||
    normalize(filters.query) !== ""
  );
}

/**
 * Keeps the policies matching every active filter. `insurerOf` gives the
 * insurer of a policy's product.
 */
export function filterPolicies(
  policies: PayrollPolicy[],
  filters: PolicyFilters,
  insurerOf: (productId: string) => string | undefined,
): PayrollPolicy[] {
  const query = normalize(filters.query);
  return policies.filter((policy) => {
    if (
      filters.commercialId !== ALL &&
      policy.commercialId !== filters.commercialId
    ) {
      return false;
    }
    if (
      filters.insurerId !== ALL &&
      insurerOf(policy.produitId) !== filters.insurerId
    ) {
      return false;
    }
    if (query === "") return true;
    return (
      normalize(policy.clientName).includes(query) ||
      normalize(policy.reference ?? "").includes(query)
    );
  });
}
