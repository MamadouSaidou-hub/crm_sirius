import type { Prospect, Task, User } from "@/lib/types";
import { users } from "@/lib/mock-data";

/**
 * Role-based scoping helpers. All pure functions of the current user so that
 * switching role in the "Mode test" selector instantly re-scopes the UI.
 */

/** Ids of users whose data the current user is allowed to see. */
export function visibleUserIds(current: User): Set<string> {
  if (current.role === "admin") {
    return new Set(users.map((u) => u.id));
  }
  if (current.role === "manager") {
    const ids = users
      .filter((u) => u.managerId === current.id)
      .map((u) => u.id);
    return new Set([current.id, ...ids]);
  }
  return new Set([current.id]);
}

export function scopeProspects(
  current: User,
  prospects: Prospect[]
): Prospect[] {
  const ids = visibleUserIds(current);
  return prospects.filter((p) => ids.has(p.assignedTo));
}

export function scopeTasks(current: User, tasks: Task[]): Task[] {
  const ids = visibleUserIds(current);
  return tasks.filter((t) => ids.has(t.assignedTo));
}

/** Commercials visible to the current user, for assignment selects/filters. */
export function assignableCommercials(current: User): User[] {
  if (current.role === "commercial") {
    return users.filter((u) => u.id === current.id);
  }
  const ids = visibleUserIds(current);
  return users.filter((u) => u.role === "commercial" && ids.has(u.id));
}

export function canManageTeam(current: User): boolean {
  return current.role === "admin" || current.role === "manager";
}

export function canExport(current: User): boolean {
  return current.role === "admin" || current.role === "manager";
}
