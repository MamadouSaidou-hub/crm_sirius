import { createClient } from "@/lib/supabase/client";
import type { FrozenLine } from "@/lib/payroll/closing";

export interface PayrollClosing {
  period: string;
  closedAt: string;
  closedByName: string | null;
  totalPay: number;
  totalCabinetCommission: number;
  lines: FrozenLine[];
  note: string | null;
}

interface ClosingRow {
  period: string;
  closed_at: string;
  closed_by_name: string | null;
  total_pay: number;
  total_cabinet_commission: number;
  lines: FrozenLine[] | null;
  note: string | null;
}

/** Closed months, visible to every signed-in user (no amounts). */
export async function fetchClosedPeriods(): Promise<string[]> {
  const { data, error } = await createClient().rpc("closed_periods");
  if (error) throw error;
  return (data ?? []) as string[];
}

/**
 * The closing record of a month, with its frozen totals. Only those who see
 * the whole payroll can read it: others get null (RLS).
 */
export async function fetchClosing(
  period: string,
): Promise<PayrollClosing | null> {
  const { data, error } = await createClient()
    .from("payroll_closings")
    .select(
      "period,closed_at,closed_by_name,total_pay,total_cabinet_commission,lines,note",
    )
    .eq("period", period)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ClosingRow;
  return {
    period: row.period,
    closedAt: row.closed_at,
    closedByName: row.closed_by_name,
    totalPay: Number(row.total_pay),
    totalCabinetCommission: Number(row.total_cabinet_commission),
    lines: row.lines ?? [],
    note: row.note,
  };
}

export interface NewPayrollClosing {
  period: string;
  closedByName: string;
  totalPay: number;
  totalCabinetCommission: number;
  lines: FrozenLine[];
  note?: string;
}

/** Closes a month (admin level — enforced by RLS and by the database). */
export async function closePayrollPeriod(
  input: NewPayrollClosing,
): Promise<void> {
  const { error } = await createClient().from("payroll_closings").insert({
    period: input.period,
    closed_by_name: input.closedByName,
    total_pay: Math.round(input.totalPay),
    total_cabinet_commission: Math.round(input.totalCabinetCommission),
    lines: input.lines,
    note: input.note ?? null,
  });
  if (error) throw error;
}

/** Reopens a month (super admin only — enforced by RLS). */
export async function reopenPayrollPeriod(period: string): Promise<void> {
  const { error } = await createClient()
    .from("payroll_closings")
    .delete()
    .eq("period", period);
  if (error) throw error;
}
