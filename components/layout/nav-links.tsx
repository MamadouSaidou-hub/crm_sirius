"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { useMockUser } from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

function isActive(item: NavItem, pathname: string): boolean {
  // Pipeline is a nested route under /prospects but must stay distinct.
  if (item.href === "/prospects") {
    return (
      pathname === "/prospects" ||
      (pathname.startsWith("/prospects/") && pathname !== "/prospects/kanban")
    );
  }
  if (item.matchNested) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

interface NavLinksProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavLinks({ collapsed = false, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const { role } = useMockUser();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-sirius-gold/10 text-sirius-gold"
                : "text-sirius-subtext hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-sirius-gold" : "text-current"
              )}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
