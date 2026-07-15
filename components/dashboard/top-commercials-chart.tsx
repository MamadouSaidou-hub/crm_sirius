"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CommercialPerformance } from "@/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { Trophy } from "lucide-react";
import { AXIS_PROPS, CHART_COLORS, ChartTooltip } from "./chart-common";

export function TopCommercialsChart({
  data,
}: {
  data: CommercialPerformance[];
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucune vente gagnée"
        description="Les meilleurs commerciaux apparaîtront ici."
        className="h-[260px]"
      />
    );
  }

  // Shorten names to first name + last initial for compact axis labels.
  const chartData = data.map((d) => {
    const [first, ...rest] = d.name.split(" ");
    const label = rest.length ? `${first} ${rest[0][0]}.` : first;
    return { ...d, label };
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={chartData}
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
          width={80}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={<ChartTooltip />}
        />
        <Bar
          dataKey="won"
          name="Gagnés"
          fill={CHART_COLORS.teal}
          radius={[0, 4, 4, 0]}
          barSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
