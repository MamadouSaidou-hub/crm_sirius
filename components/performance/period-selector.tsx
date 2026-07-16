"use client";

import { recentPeriods } from "@/lib/data/performance";
import { periodLabel } from "@/lib/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

function capitalize(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const periods = recentPeriods();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {periods.map((period) => (
          <SelectItem key={period} value={period}>
            {capitalize(periodLabel(period))}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
