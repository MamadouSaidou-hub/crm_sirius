"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

function ProfitabilityChartImpl({ data }: { data: ProfitabilityPoint[] }) {
  const rows = data.map((p) => ({
    month: shortMonth(p.periode),
    commission: Math.round(p.commissionCabinet),
    depenses: Math.round(p.depensesPaie),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
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
          dataKey="commission"
          name="Commission cabinet"
          fill={CHART_COLORS.success}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="depenses"
          name="Dépenses paie"
          fill={CHART_COLORS.danger}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const ProfitabilityChart = memo(ProfitabilityChartImpl);
