import type {
  CommercialPerformance,
  FunnelDatum,
  MonthlyRevenueDatum,
  Stage,
} from "@/lib/types";
import { STAGE_LABELS } from "@/lib/constants";
import type { ProspectListItem } from "@/lib/data/prospects";

/** Conversion funnel counts + amounts, from lead to won. */
const FUNNEL_STAGES: Stage[] = ["lead", "qualified", "quoted", "won"];

export function buildFunnel(prospects: ProspectListItem[]): FunnelDatum[] {
  return FUNNEL_STAGES.map((stage) => {
    const list = prospects.filter((p) => p.stage === stage);
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: list.length,
      amount: list.reduce((s, p) => s + p.estimatedPremium, 0),
    };
  });
}

/** Won-premium revenue over the last 6 months (by last activity). */
export function buildMonthlyRevenue(
  prospects: ProspectListItem[],
): MonthlyRevenueDatum[] {
  const now = new Date();
  const won = prospects.filter((p) => p.stage === "won");
  const months: MonthlyRevenueDatum[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const revenue = won
      .filter((p) => {
        const a = new Date(p.lastActivityAt);
        return `${a.getFullYear()}-${a.getMonth()}` === key;
      })
      .reduce((s, p) => s + p.estimatedPremium, 0);
    months.push({
      month: label.charAt(0).toUpperCase() + label.slice(1),
      revenue,
    });
  }
  return months;
}

/** Top 5 commercials by number of won prospects. */
export function buildTopCommercials(
  prospects: ProspectListItem[],
): CommercialPerformance[] {
  const counts = new Map<string, { name: string; won: number }>();
  for (const p of prospects) {
    if (p.stage !== "won") continue;
    const entry = counts.get(p.assignedTo) ?? { name: p.assigneeName, won: 0 };
    entry.won += 1;
    counts.set(p.assignedTo, entry);
  }
  return [...counts.entries()]
    .map(([userId, { name, won }]) => ({ userId, name, won }))
    .sort((a, b) => b.won - a.won)
    .slice(0, 5);
}
