"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FunnelDatum } from "@/lib/types";
import { AXIS_PROPS, CHART_COLORS, ChartTooltip } from "./chart-common";

const BAR_COLORS = [
  CHART_COLORS.axis,
  CHART_COLORS.teal,
  CHART_COLORS.gold,
  CHART_COLORS.success,
];

function FunnelChartImpl({ data }: { data: FunnelDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
        <XAxis type="number" {...AXIS_PROPS} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          {...AXIS_PROPS}
          axisLine={false}
          width={70}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={<ChartTooltip />}
        />
        <Bar dataKey="count" name="Prospects" radius={[0, 4, 4, 0]} barSize={26}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export const FunnelChart = memo(FunnelChartImpl);
