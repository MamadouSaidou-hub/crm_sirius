import type { City, User } from "@/lib/types";
import { fetchProspects, type ProspectListItem } from "@/lib/data/prospects";
import { fetchTasks, type TaskWithRefs } from "@/lib/data/tasks";
import { isNetworkError } from "./net";
import { readCache, writeCache } from "./cache";
import { listPending } from "./outbox";

/**
 * Offline-aware list reads. When online, fetch fresh and refresh the cache;
 * when offline, serve the last cached copy. In both cases, operations still
 * waiting in the outbox are merged in so the user sees the prospects/tasks they
 * created offline (as normal rows — the banner signals they're pending sync).
 */

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

async function pendingProspects(current: User): Promise<ProspectListItem[]> {
  const items = await listPending();
  return items
    .filter((i) => i.op.kind === "create_prospect")
    .map((i) => {
      const op = i.op as Extract<typeof i.op, { kind: "create_prospect" }>;
      const input = op.input;
      return {
        id: op.id,
        name: input.name,
        phone: input.phone,
        email: input.email,
        cni: input.cni,
        address: input.address,
        city: input.city as City,
        products: input.products,
        estimatedPremium: input.estimatedPremium,
        stage: "lead",
        assignedTo: input.assignedTo,
        notes: input.notes,
        lostReason: undefined,
        createdAt: i.createdAt,
        lastActivityAt: i.createdAt,
        assigneeName:
          input.assignedTo === current.id ? current.name : "—",
        assigneeRole: input.assignedTo === current.id ? current.role : null,
      } satisfies ProspectListItem;
    });
}

async function pendingTasks(current: User): Promise<TaskWithRefs[]> {
  const items = await listPending();
  return items
    .filter((i) => i.op.kind === "create_task")
    .map((i) => {
      const op = i.op as Extract<typeof i.op, { kind: "create_task" }>;
      const input = op.input;
      return {
        id: op.id,
        title: input.title,
        description: input.description,
        type: input.type,
        status: "pending",
        dueDate: input.dueDate,
        prospectId: input.prospectId,
        assignedTo: input.assignedTo,
        createdAt: i.createdAt,
        prospectName: null,
        assigneeName:
          input.assignedTo === current.id ? current.name : "—",
      } satisfies TaskWithRefs;
    });
}

export async function loadProspects(
  current: User,
): Promise<ProspectListItem[]> {
  const pend = await pendingProspects(current);
  try {
    const fresh = await fetchProspects();
    await writeCache("prospects", fresh);
    return dedupeById([...pend, ...fresh]);
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const cached =
      (await readCache<ProspectListItem[]>("prospects")) ?? [];
    return dedupeById([...pend, ...cached]);
  }
}

export async function loadTasks(current: User): Promise<TaskWithRefs[]> {
  const pend = await pendingTasks(current);
  try {
    const fresh = await fetchTasks();
    await writeCache("tasks", fresh);
    return dedupeById([...pend, ...fresh]);
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const cached = (await readCache<TaskWithRefs[]>("tasks")) ?? [];
    return dedupeById([...pend, ...cached]);
  }
}
