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
import { formatFCFACompact } from "@/lib/utils";
import { AXIS_PROPS, CHART_COLORS, ChartTooltip } from "./chart-common";

export interface CommercialProfitRow {
  name: string;
  /** What the commercial brings the cabinet. */
  rapporte: number;
  /** What the commercial costs the cabinet. */
  coute: number;
}

/** Most contributors first; the chart stays readable with a big team. */
const MAX_ROWS = 8;

/** "Awa Diop" -> "Awa D." so long names do not squeeze the bars. */
function shortName(name: string): string {
  const [first, ...rest] = name.split(" ");
  return rest.length > 0 ? `${first} ${rest[0][0]}.` : first;
}

function CommercialProfitChartImpl({ data }: { data: CommercialProfitRow[] }) {
  const rows = [...data]
    .sort((a, b) => b.rapporte - a.rapporte)
    .slice(0, MAX_ROWS)
    .map((r) => ({
      name: shortName(r.name),
      rapporte: Math.round(r.rapporte),
      coute: Math.round(r.coute),
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 52 + 40)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis
          type="number"
          {...AXIS_PROPS}
          axisLine={false}
          tickFormatter={(v: number) => formatFCFACompact(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          {...AXIS_PROPS}
          axisLine={false}
          width={84}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.grid, opacity: 0.3 }}
          content={<ChartTooltip formatter={formatFCFACompact} />}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="rapporte"
          name="Rapporte"
          fill={CHART_COLORS.success}
          radius={[0, 4, 4, 0]}
        />
        <Bar
          dataKey="coute"
          name="Coûte"
          fill={CHART_COLORS.danger}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const CommercialProfitChart = memo(CommercialProfitChartImpl);
