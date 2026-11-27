"use client";

import { memo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProfitabilityPoint } from "@/lib/payroll/profitability";
import { periodLabel } from "@/lib/date";
import { formatFCFACompact } from "@/lib/utils";
import { AXIS_PROPS, CHART_COLORS, ChartTooltip } from "./chart-common";

function shortMonth(period: string): string {
  return periodLabel(period).split(" ")[0].slice(0, 4);
}

/**
 * Six months of cabinet commission (life and IARD stacked) against what the
 * commercials cost, with the balance drawn as a line.
 */
function ProfitabilityChartImpl({ data }: { data: ProfitabilityPoint[] }) {
  const rows = data.map((p) => ({
    month: shortMonth(p.periode),
    vie: Math.round(p.commissionCabinet - p.commissionPolices),
    iard: Math.round(p.commissionPolices),
    depenses: Math.round(p.depensesPaie),
    net: Math.round(p.net),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="month" {...AXIS_PROPS} axisLine={false} />
        <YAxis
          {...AXIS_PROPS}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => formatFCFACompact(v)}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.grid, opacity: 0.3 }}
          content={<ChartTooltip formatter={formatFCFACompact} />}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="vie"
          name="Commission vie"
          stackId="commission"
          fill={CHART_COLORS.success}
        />
        <Bar
          dataKey="iard"
          name="Commission IARD"
          stackId="commission"
          fill={CHART_COLORS.teal}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="depenses"
          name="Dépenses paie"
          fill={CHART_COLORS.danger}
          radius={[4, 4, 0, 0]}
        />
        <Line
          type="monotone"
          dataKey="net"
          name="Solde"
          stroke={CHART_COLORS.gold}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export const ProfitabilityChart = memo(ProfitabilityChartImpl);
