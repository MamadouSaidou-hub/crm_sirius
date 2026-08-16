"use client";

import { memo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyRevenueDatum } from "@/lib/types";
import { formatFCFACompact } from "@/lib/utils";
import { AXIS_PROPS, CHART_COLORS, ChartTooltip } from "./chart-common";

function RevenueChartImpl({ data }: { data: MonthlyRevenueDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="month" {...AXIS_PROPS} axisLine={false} />
        <YAxis
          {...AXIS_PROPS}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`}
        />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.grid }}
          content={<ChartTooltip formatter={formatFCFACompact} />}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="CA estimé"
          stroke={CHART_COLORS.gold}
          strokeWidth={2.5}
          dot={{ r: 3, fill: CHART_COLORS.gold }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export const RevenueChart = memo(RevenueChartImpl);
