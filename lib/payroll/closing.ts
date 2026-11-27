/**
 * Monthly payroll closing: rules and helpers. Pure and DB-free.
 *
 * Closing a month validates it: the database then refuses any change to that
 * month's contracts, payments and policies (see supabase/12_payroll_closing.sql).
 * The totals are stored at closing time so any later drift is visible.
 */

/** One commercial's frozen total. */
export interface FrozenLine {
  commercialId: string;
  name: string;
  total: number;
}

/** 'YYYY-MM' of a date. */
export function currentPeriod(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-10" -> "octobre 2026" */
export function monthName(period: string): string {
  return new Date(`${period}-01T12:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

/** A month can be closed once it is over (strictly before the current month). */
export function isClosable(period: string, now: Date): boolean {
  return period < currentPeriod(now);
}

/** Totals kept in the closing record (rounded to whole FCFA). */
export function freezeLines(
  lines: Array<{ commercialId: string; commercial: { name: string }; total: number }>,
): FrozenLine[] {
  return lines.map((l) => ({
    commercialId: l.commercialId,
    name: l.commercial.name,
    total: Math.round(l.total),
  }));
}

/** Difference between what is computed now and what was frozen (whole FCFA). */
export function driftOf(frozenTotal: number, liveTotal: number): number {
  return Math.round(liveTotal) - Math.round(frozenTotal);
}

/** True when the live figures no longer match the frozen ones. */
export function hasDrift(frozenTotal: number, liveTotal: number): boolean {
  return driftOf(frozenTotal, liveTotal) !== 0;
}
