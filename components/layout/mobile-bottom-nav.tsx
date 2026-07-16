"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  KanbanSquare,
  LayoutDashboard,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Core destinations reachable in one tap on phones. */
const ITEMS: Item[] = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Prospects", href: "/prospects", icon: Users },
  { label: "Pipeline", href: "/prospects/kanban", icon: KanbanSquare },
  { label: "Tâches", href: "/tasks", icon: CheckSquare },
  { label: "Objectifs", href: "/performance", icon: Target },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/prospects") {
    return (
      pathname === "/prospects" ||
      (pathname.startsWith("/prospects/") && pathname !== "/prospects/kanban")
    );
  }
  return pathname === href;
}

/** Native-style bottom tab bar, shown below md. */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-sirius-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Navigation principale"
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:bg-secondary/50",
              active ? "text-sirius-gold" : "text-sirius-subtext",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
