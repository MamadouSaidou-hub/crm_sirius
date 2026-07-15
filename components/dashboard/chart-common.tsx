"use client";

import type { TooltipProps } from "recharts";

export const CHART_COLORS = {
  gold: "#EAC14B",
  teal: "#1FB8E0",
  success: "#22C55E",
  danger: "#EF4444",
  grid: "#2A3142",
  axis: "#9CA3AF",
};

export const AXIS_PROPS = {
  stroke: CHART_COLORS.axis,
  fontSize: 12,
  tickLine: false,
} as const;

/** Dark-themed tooltip shared by the dashboard charts. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: TooltipProps<number, string> & {
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && (
        <p className="mb-1 font-medium text-foreground">{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="text-muted-foreground">
          <span style={{ color: entry.color }}>●</span>{" "}
          {entry.name}:{" "}
          <span className="font-medium text-foreground">
            {formatter ? formatter(Number(entry.value)) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}
