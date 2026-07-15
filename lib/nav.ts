import {
  Building2,
  Calculator,
  CheckSquare,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Target,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item; undefined means everyone. */
  roles?: UserRole[];
  /** Match nested routes (e.g. /prospects/123) for active state. */
  matchNested?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Prospects",
    href: "/prospects",
    icon: Users,
    matchNested: true,
  },
  { label: "Pipeline", href: "/prospects/kanban", icon: KanbanSquare },
  { label: "Nouvelle simulation", href: "/simulation", icon: Calculator },
  { label: "Tâches", href: "/tasks", icon: CheckSquare },
  { label: "Objectifs", href: "/performance", icon: Target },
  {
    label: "Équipe",
    href: "/users",
    icon: UsersRound,
    roles: ["admin", "manager"],
  },
  {
    label: "Compagnies",
    href: "/partners",
    icon: Building2,
    roles: ["admin", "manager"],
  },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export { Settings as SettingsIcon };
