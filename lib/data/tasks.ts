import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus, TaskType } from "@/lib/types";

/** A task enriched with linked prospect and assignee names. */
export interface TaskWithRefs extends Task {
  prospectName: string | null;
  assigneeName: string;
}

interface Row {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  due_date: string;
  prospect_id: string | null;
  assigned_to: string;
  created_at: string;
  prospect: { name: string } | { name: string }[] | null;
  assignee: { name: string } | { name: string }[] | null;
}

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const COLS =
  "id,title,description,type,status,due_date,prospect_id,assigned_to,created_at,prospect:prospects!prospect_id(name),assignee:profiles!assigned_to(name)";

function mapRow(r: Row): TaskWithRefs {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    type: r.type,
    status: r.status,
    dueDate: r.due_date,
    prospectId: r.prospect_id,
    assignedTo: r.assigned_to,
    createdAt: r.created_at,
    prospectName: firstOf(r.prospect)?.name ?? null,
    assigneeName: firstOf(r.assignee)?.name ?? "—",
  };
}

/** All tasks visible to the current user (scoped by RLS). */
export async function fetchTasks(): Promise<TaskWithRefs[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(COLS)
    .order("due_date");
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Row));
}

export async function fetchTasksForProspect(
  prospectId: string,
): Promise<TaskWithRefs[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(COLS)
    .eq("prospect_id", prospectId)
    .order("due_date");
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Row));
}

export interface TaskInput {
  title: string;
  description: string;
  type: TaskType;
  dueDate: string;
  prospectId: string | null;
  assignedTo: string;
}

export async function createTask(
  input: TaskInput,
  id?: string,
): Promise<TaskWithRefs> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...(id ? { id } : {}),
      title: input.title,
      description: input.description || null,
      type: input.type,
      status: "pending",
      due_date: input.dueDate,
      prospect_id: input.prospectId,
      assigned_to: input.assignedTo,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return mapRow(data as unknown as Row);
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw error;
}
