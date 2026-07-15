import type { Objective, ProductType, Realization } from "@/lib/types";
import { insurers } from "@/lib/mock-data";

/**
 * In-session objectives & realizations store.
 *
 * Prototype-only: data lives in module memory so declarations/validations and
 * objective changes persist while navigating the SPA (a full reload resets to
 * the seed). A real backend would replace this module unchanged for callers.
 *
 * Model: commercials self-declare realizations (e.g. NSIA life subscriptions);
 * a manager validates them; only validated amounts count toward "realized".
 * Objectives cascade admin → manager → commercial.
 */

const now = new Date();

function periodOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Active period, "YYYY-MM". Defaults to the current month. */
export const CURRENT_PERIOD = periodOf(now);

/** Period N months before the current one. */
function periodMinus(n: number): string {
  return periodOf(new Date(now.getFullYear(), now.getMonth() - n, 1));
}

const PREV_PERIOD = periodMinus(1);

/** Recent periods, newest first — used to populate the period selector. */
export function recentPeriods(count = 6): string[] {
  return Array.from({ length: count }, (_, i) => periodMinus(i));
}

function iso(daysAgo: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

/** ISO timestamp on a given day within a "YYYY-MM" period. */
function isoOn(period: string, day: number): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, day, 11, 0, 0).toISOString();
}

const COMMERCIAL_TARGETS = [
  800_000, 1_000_000, 600_000, 900_000, 750_000, 500_000, 1_200_000, 650_000,
];

let objectives: Objective[] = [
  {
    id: "obj-mgr-1",
    userId: "u-mgr-1",
    period: CURRENT_PERIOD,
    targetAmount: 6_000_000,
    setBy: "u-admin-1",
    createdAt: iso(20),
  },
  ...COMMERCIAL_TARGETS.map((targetAmount, i) => ({
    id: `obj-com-${i + 1}`,
    userId: `u-com-${i + 1}`,
    period: CURRENT_PERIOD,
    targetAmount,
    setBy: "u-mgr-1",
    createdAt: iso(18),
  })),
  // Previous month (history for the period selector).
  {
    id: "obj-mgr-1-prev",
    userId: "u-mgr-1",
    period: PREV_PERIOD,
    targetAmount: 5_500_000,
    setBy: "u-admin-1",
    createdAt: isoOn(PREV_PERIOD, 2),
  },
  ...COMMERCIAL_TARGETS.map((targetAmount, i) => ({
    id: `obj-com-${i + 1}-prev`,
    userId: `u-com-${i + 1}`,
    period: PREV_PERIOD,
    targetAmount,
    setBy: "u-mgr-1",
    createdAt: isoOn(PREV_PERIOD, 3),
  })),
];

let realizations: Realization[] = [
  {
    id: "rea-1",
    commercialId: "u-com-1",
    period: CURRENT_PERIOD,
    amount: 500_000,
    product: "vie",
    source: "nsia",
    reference: "NSIA-EXC-4471",
    status: "validated",
    declaredBy: "u-com-1",
    validatedBy: "u-mgr-1",
    createdAt: iso(10),
    validatedAt: iso(9),
  },
  {
    id: "rea-2",
    commercialId: "u-com-1",
    period: CURRENT_PERIOD,
    amount: 300_000,
    product: "vie",
    source: "nsia",
    status: "pending",
    declaredBy: "u-com-1",
    createdAt: iso(2),
  },
  {
    id: "rea-3",
    commercialId: "u-com-2",
    period: CURRENT_PERIOD,
    amount: 1_100_000,
    product: "vie",
    source: "nsia",
    reference: "NSIA-EXC-4480",
    status: "validated",
    declaredBy: "u-com-2",
    validatedBy: "u-mgr-1",
    createdAt: iso(8),
    validatedAt: iso(7),
  },
  {
    id: "rea-4",
    commercialId: "u-com-3",
    period: CURRENT_PERIOD,
    amount: 600_000,
    product: "vie",
    source: "nsia",
    status: "pending",
    declaredBy: "u-com-3",
    createdAt: iso(1),
  },
  {
    id: "rea-5",
    commercialId: "u-com-5",
    period: CURRENT_PERIOD,
    amount: 450_000,
    product: "vie",
    source: "nsia",
    status: "validated",
    declaredBy: "u-com-5",
    validatedBy: "u-mgr-1",
    createdAt: iso(12),
    validatedAt: iso(11),
  },
  {
    id: "rea-6",
    commercialId: "u-com-7",
    period: CURRENT_PERIOD,
    amount: 900_000,
    product: "vie",
    source: "nsia",
    status: "validated",
    declaredBy: "u-com-7",
    validatedBy: "u-mgr-1",
    createdAt: iso(6),
    validatedAt: iso(5),
  },
  // Previous month, all validated (history).
  {
    id: "rea-prev-1",
    commercialId: "u-com-1",
    period: PREV_PERIOD,
    amount: 750_000,
    product: "vie",
    source: "nsia",
    reference: "NSIA-EXC-4390",
    status: "validated",
    declaredBy: "u-com-1",
    validatedBy: "u-mgr-1",
    createdAt: isoOn(PREV_PERIOD, 12),
    validatedAt: isoOn(PREV_PERIOD, 13),
  },
  {
    id: "rea-prev-2",
    commercialId: "u-com-2",
    period: PREV_PERIOD,
    amount: 950_000,
    product: "vie",
    source: "askia",
    status: "validated",
    declaredBy: "u-com-2",
    validatedBy: "u-mgr-1",
    createdAt: isoOn(PREV_PERIOD, 18),
    validatedAt: isoOn(PREV_PERIOD, 19),
  },
  {
    id: "rea-prev-3",
    commercialId: "u-com-4",
    period: PREV_PERIOD,
    amount: 620_000,
    product: "vie",
    source: "nsia",
    status: "validated",
    declaredBy: "u-com-4",
    validatedBy: "u-mgr-1",
    createdAt: isoOn(PREV_PERIOD, 22),
    validatedAt: isoOn(PREV_PERIOD, 23),
  },
];

/* --- Objectives ---------------------------------------------------- */

export function getObjective(
  userId: string,
  period: string = CURRENT_PERIOD,
): Objective | undefined {
  return objectives.find((o) => o.userId === userId && o.period === period);
}

/** Create or update a user's target for a period. */
export function setObjective(
  userId: string,
  targetAmount: number,
  setBy: string,
  period: string = CURRENT_PERIOD,
): void {
  const existing = objectives.find(
    (o) => o.userId === userId && o.period === period,
  );
  if (existing) {
    objectives = objectives.map((o) =>
      o === existing
        ? { ...o, targetAmount, setBy, createdAt: new Date().toISOString() }
        : o,
    );
  } else {
    objectives = [
      ...objectives,
      {
        id: `obj-${userId}-${period}`,
        userId,
        period,
        targetAmount,
        setBy,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

/* --- Realizations -------------------------------------------------- */

export function getRealizationsForCommercial(
  commercialId: string,
  period: string = CURRENT_PERIOD,
): Realization[] {
  return realizations
    .filter((r) => r.commercialId === commercialId && r.period === period)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Realizations awaiting validation for a set of commercials. */
export function getPendingRealizations(
  commercialIds: string[],
  period: string = CURRENT_PERIOD,
): Realization[] {
  const set = new Set(commercialIds);
  return realizations
    .filter(
      (r) =>
        r.status === "pending" &&
        r.period === period &&
        set.has(r.commercialId),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Sum of a commercial's realizations for the given statuses. */
export function realizedTotal(
  commercialId: string,
  statuses: Realization["status"][] = ["validated"],
  period: string = CURRENT_PERIOD,
): number {
  return realizations
    .filter(
      (r) =>
        r.commercialId === commercialId &&
        r.period === period &&
        statuses.includes(r.status),
    )
    .reduce((sum, r) => sum + r.amount, 0);
}

export interface DeclareInput {
  commercialId: string;
  amount: number;
  product: ProductType;
  source: string;
  reference?: string;
  period?: string;
}

export function declareRealization(input: DeclareInput): Realization {
  const realization: Realization = {
    id: `rea-${Date.now()}`,
    commercialId: input.commercialId,
    period: input.period ?? CURRENT_PERIOD,
    amount: input.amount,
    product: input.product,
    source: input.source,
    reference: input.reference,
    status: "pending",
    declaredBy: input.commercialId,
    createdAt: new Date().toISOString(),
  };
  realizations = [realization, ...realizations];
  return realization;
}

export function setRealizationStatus(
  id: string,
  status: Realization["status"],
  validatedBy: string,
): void {
  realizations = realizations.map((r) =>
    r.id === id
      ? {
          ...r,
          status,
          validatedBy,
          validatedAt: new Date().toISOString(),
        }
      : r,
  );
}

/** 0..N percentage of a target reached (guards divide-by-zero). */
export function attainment(realized: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((realized / target) * 100);
}

/* --- Commissions --------------------------------------------------- */

/** Fallback broker commission rate when the source isn't a known insurer. */
const DEFAULT_COMMISSION_RATE = 0.1;

/** Broker (apporteur) commission rate for a declared source, e.g. "nsia". */
function rateForSource(source: string): number {
  const insurer = insurers.find(
    (i) => i.shortName.toLowerCase() === source.toLowerCase(),
  );
  return insurer?.commissionRate ?? DEFAULT_COMMISSION_RATE;
}

/**
 * Estimated commission generated by a commercial's validated realizations,
 * each valued at its source insurer's apporteur rate.
 */
export function commissionTotal(
  commercialId: string,
  period: string = CURRENT_PERIOD,
): number {
  return realizations
    .filter(
      (r) =>
        r.commercialId === commercialId &&
        r.period === period &&
        r.status === "validated",
    )
    .reduce((sum, r) => sum + r.amount * rateForSource(r.source), 0);
}
