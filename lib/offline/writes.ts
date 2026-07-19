import {
  createProspect,
  type ProspectInput,
} from "@/lib/data/prospects";
import {
  createTask,
  setTaskStatus,
  type TaskInput,
  type TaskWithRefs,
} from "@/lib/data/tasks";
import {
  createInteraction,
  type InteractionInput,
} from "@/lib/data/interactions";
import type { TaskStatus } from "@/lib/types";
import { isNetworkError, isOnline } from "./net";
import { enqueue } from "./outbox";

/**
 * Offline-aware write wrappers. When online, they write straight through to
 * Supabase; when offline (or when the write hits a network error), they queue
 * the operation in the outbox and report `queued: true` so the UI can tell the
 * user their work is saved and will sync later. A client-generated id is used
 * throughout so callers get a stable id immediately in both cases.
 */

export async function submitProspect(
  input: ProspectInput,
): Promise<{ id: string; queued: boolean }> {
  const id = crypto.randomUUID();
  if (isOnline()) {
    try {
      await createProspect(input, id);
      return { id, queued: false };
    } catch (e) {
      if (!isNetworkError(e)) throw e;
    }
  }
  await enqueue(
    { kind: "create_prospect", input, id },
    `Prospect « ${input.name} »`,
  );
  return { id, queued: true };
}

export async function submitTask(
  input: TaskInput,
): Promise<{ id: string; queued: boolean; task?: TaskWithRefs }> {
  const id = crypto.randomUUID();
  if (isOnline()) {
    try {
      const task = await createTask(input, id);
      return { id, queued: false, task };
    } catch (e) {
      if (!isNetworkError(e)) throw e;
    }
  }
  await enqueue({ kind: "create_task", input, id }, `Tâche « ${input.title} »`);
  return { id, queued: true };
}

export async function submitTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<{ queued: boolean }> {
  if (isOnline()) {
    try {
      await setTaskStatus(id, status);
      return { queued: false };
    } catch (e) {
      if (!isNetworkError(e)) throw e;
    }
  }
  await enqueue(
    { kind: "set_task_status", id, status },
    "Mise à jour d'une tâche",
  );
  return { queued: true };
}

export async function submitInteraction(
  input: InteractionInput,
): Promise<{ id: string; queued: boolean }> {
  const id = crypto.randomUUID();
  if (isOnline()) {
    try {
      await createInteraction(input, id);
      return { id, queued: false };
    } catch (e) {
      if (!isNetworkError(e)) throw e;
    }
  }
  await enqueue(
    { kind: "create_interaction", input, id },
    "Interaction ajoutée",
  );
  return { id, queued: true };
}
