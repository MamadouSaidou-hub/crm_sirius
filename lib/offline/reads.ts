import type { City, User } from "@/lib/types";
import {
  fetchProspect,
  fetchProspects,
  type ProspectListItem,
} from "@/lib/data/prospects";
import {
  fetchTasks,
  fetchTasksForProspect,
  type TaskWithRefs,
} from "@/lib/data/tasks";
import {
  fetchInteractions,
  type InteractionItem,
} from "@/lib/data/interactions";
import {
  fetchStageHistory,
  type StageHistoryItem,
} from "@/lib/data/stage-history";
import {
  fetchContractsForProspect,
  type ContractItem,
} from "@/lib/data/contracts";
import { isNetworkError } from "./net";
import { readCache, writeCache } from "./cache";
import { listPending } from "./outbox";
import type { OutboxItem } from "./types";

/**
 * Offline-aware list reads. When online, fetch fresh and refresh the cache;
 * when offline, serve the last cached copy. In both cases, operations still
 * waiting in the outbox are merged in so the user sees the prospects/tasks they
 * created offline (as normal rows — the banner signals they're pending sync).
 */

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
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

/* --- Prospect detail (fiche + interactions + tasks + history + contracts) --- */

/** Apply any queued edits / stage changes to a cached prospect fiche. */
function applyPendingProspect(
  base: ProspectListItem,
  id: string,
  items: OutboxItem[],
): ProspectListItem {
  let p = base;
  for (const i of items) {
    if (i.op.kind === "update_prospect" && i.op.id === id) {
      const input = i.op.input;
      p = {
        ...p,
        name: input.name,
        phone: input.phone,
        email: input.email,
        cni: input.cni,
        address: input.address,
        city: input.city as City,
        products: input.products,
        estimatedPremium: input.estimatedPremium,
        assignedTo: input.assignedTo,
        notes: input.notes,
      };
    } else if (i.op.kind === "set_prospect_stage" && i.op.id === id) {
      p = { ...p, stage: i.op.to, lostReason: i.op.lostReason ?? p.lostReason };
    }
  }
  return p;
}

export async function loadProspect(
  id: string,
  current: User,
): Promise<ProspectListItem | null> {
  const items = await listPending();
  const withPending = (p: ProspectListItem | null) =>
    p ? applyPendingProspect(p, id, items) : p;

  try {
    const fresh = await fetchProspect(id);
    if (fresh) await writeCache(`prospect:${id}`, fresh);
    return withPending(fresh);
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const cached = await readCache<ProspectListItem>(`prospect:${id}`);
    if (cached) return withPending(cached);
    // Prospect created offline and never synced: rebuild it from the queue.
    const created = (await pendingProspects(current)).find((p) => p.id === id);
    return created ? withPending(created) : null;
  }
}

export async function loadInteractions(
  id: string,
  current: User,
): Promise<InteractionItem[]> {
  const items = await listPending();
  const pend: InteractionItem[] = items
    .filter((i) => i.op.kind === "create_interaction" && i.op.input.prospectId === id)
    .map((i) => {
      const op = i.op as Extract<typeof i.op, { kind: "create_interaction" }>;
      const input = op.input;
      return {
        id: op.id,
        prospectId: id,
        type: input.type,
        summary: input.summary,
        durationMin: input.durationMin,
        createdBy: input.createdBy,
        createdAt: i.createdAt,
        authorName: input.createdBy === current.id ? current.name : "—",
        authorRole: input.createdBy === current.id ? current.role : null,
      } satisfies InteractionItem;
    })
    .reverse(); // newest first, matching the server ordering

  try {
    const fresh = await fetchInteractions(id);
    await writeCache(`interactions:${id}`, fresh);
    return dedupeById([...pend, ...fresh]);
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const cached =
      (await readCache<InteractionItem[]>(`interactions:${id}`)) ?? [];
    return dedupeById([...pend, ...cached]);
  }
}

export async function loadTasksForProspect(
  id: string,
  current: User,
): Promise<TaskWithRefs[]> {
  const items = await listPending();
  const pend: TaskWithRefs[] = items
    .filter((i) => i.op.kind === "create_task" && i.op.input.prospectId === id)
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

  try {
    const fresh = await fetchTasksForProspect(id);
    await writeCache(`tasks:${id}`, fresh);
    return dedupeById([...pend, ...fresh]);
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const cached = (await readCache<TaskWithRefs[]>(`tasks:${id}`)) ?? [];
    return dedupeById([...pend, ...cached]);
  }
}

export async function loadStageHistory(
  id: string,
  current: User,
): Promise<StageHistoryItem[]> {
  const items = await listPending();
  const pend: StageHistoryItem[] = items
    .filter((i) => i.op.kind === "set_prospect_stage" && i.op.id === id)
    .map((i) => {
      const op = i.op as Extract<typeof i.op, { kind: "set_prospect_stage" }>;
      return {
        id: i.id,
        prospectId: id,
        from: op.from,
        to: op.to,
        changedBy: op.changedBy,
        changedAt: i.createdAt,
        changedByName: op.changedBy === current.id ? current.name : null,
      } satisfies StageHistoryItem;
    })
    .reverse();

  try {
    const fresh = await fetchStageHistory(id);
    await writeCache(`history:${id}`, fresh);
    return dedupeById([...pend, ...fresh]);
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const cached = (await readCache<StageHistoryItem[]>(`history:${id}`)) ?? [];
    return dedupeById([...pend, ...cached]);
  }
}

export async function loadContractsForProspect(
  id: string,
): Promise<ContractItem[]> {
  try {
    const fresh = await fetchContractsForProspect(id);
    await writeCache(`contracts:${id}`, fresh);
    return fresh;
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    return (await readCache<ContractItem[]>(`contracts:${id}`)) ?? [];
  }
}
