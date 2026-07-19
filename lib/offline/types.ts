import type { InteractionInput } from "@/lib/data/interactions";
import type { ProspectInput } from "@/lib/data/prospects";
import type { TaskInput } from "@/lib/data/tasks";
import type { TaskStatus } from "@/lib/types";

/**
 * A single write operation captured while offline (or when a write hit a
 * network error), to be replayed against Supabase once connectivity returns.
 * Client-generated ids keep references stable between the offline copy and the
 * eventual server row.
 */
export type OutboxOp =
  | { kind: "create_prospect"; input: ProspectInput; id: string }
  | { kind: "create_task"; input: TaskInput; id: string }
  | { kind: "set_task_status"; id: string; status: TaskStatus }
  | { kind: "create_interaction"; input: InteractionInput; id: string };

export interface OutboxItem {
  /** Outbox row id (distinct from the target record's id). */
  id: string;
  op: OutboxOp;
  /** Human-readable summary shown in the sync UI. */
  label: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
}
