import { offlineDb } from "./db";
import { isNetworkError } from "./net";
import type { OutboxItem, OutboxOp } from "./types";
import { createProspect } from "@/lib/data/prospects";
import { createTask, setTaskStatus } from "@/lib/data/tasks";
import { createInteraction } from "@/lib/data/interactions";

/** Fired whenever the queue changes, so the sync UI can refresh its count. */
export const OUTBOX_EVENT = "sirius:outbox-changed";

function notify(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OUTBOX_EVENT));
  }
}

export async function enqueue(op: OutboxOp, label: string): Promise<void> {
  const item: OutboxItem = {
    id: crypto.randomUUID(),
    op,
    label,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await offlineDb.outbox.add(item);
  notify();
}

export async function pendingCount(): Promise<number> {
  return offlineDb.outbox.count();
}

export async function listPending(): Promise<OutboxItem[]> {
  return offlineDb.outbox.orderBy("createdAt").toArray();
}

/** Replay a single operation against Supabase. */
async function apply(op: OutboxOp): Promise<void> {
  switch (op.kind) {
    case "create_prospect":
      await createProspect(op.input, op.id);
      break;
    case "create_task":
      await createTask(op.input, op.id);
      break;
    case "set_task_status":
      await setTaskStatus(op.id, op.status);
      break;
    case "create_interaction":
      await createInteraction(op.input, op.id);
      break;
  }
}

export interface FlushResult {
  sent: number;
  failed: number;
}

/**
 * Replay pending operations in insertion order (so a prospect is created before
 * a task/interaction that references it). Stops on the first network error to
 * preserve order; a non-network failure (e.g. RLS) is recorded and skipped so a
 * single bad item can't block the queue forever.
 */
export async function flush(): Promise<FlushResult> {
  const items = await listPending();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await apply(item.op);
      await offlineDb.outbox.delete(item.id);
      sent++;
    } catch (e) {
      failed++;
      await offlineDb.outbox.update(item.id, {
        attempts: item.attempts + 1,
        lastError: e instanceof Error ? e.message : String(e),
      });
      if (isNetworkError(e)) break;
    }
  }

  if (sent > 0 || failed > 0) notify();
  return { sent, failed };
}
