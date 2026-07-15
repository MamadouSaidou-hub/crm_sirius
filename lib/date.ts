import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";

/** "il y a 3 jours" style relative label in French. */
export function relativeDate(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
}

/** "12 mars 2026" style absolute label. */
export function fullDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy", { locale: fr });
}

/** "12 mars, 14:30" style with time. */
export function dateTime(iso: string): string {
  return format(new Date(iso), "d MMM, HH:mm", { locale: fr });
}

/** Friendly due-date label used by the tasks views. */
export function dueLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return "Demain";
  return fullDate(iso);
}

export function isOverdue(iso: string): boolean {
  const d = new Date(iso);
  return isPast(d) && !isToday(d);
}

/** Whole days a prospect has spent in the pipeline since creation. */
export function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** "YYYY-MM" → "juillet 2026". */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: fr });
}
