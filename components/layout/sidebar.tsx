"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NavLinks } from "@/components/layout/nav-links";
import { UserCard } from "@/components/layout/user-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Fixed desktop/tablet sidebar. Hidden below md, where a drawer is used. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sirius-ink md:flex",
        collapsed ? "w-[76px]" : "w-[280px]"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link href="/dashboard" className="flex items-center">
          <Logo compact={collapsed} />
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sirius-subtext"
            onClick={onToggle}
            title="Réduire le menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sirius-subtext"
            onClick={onToggle}
            title="Agrandir le menu"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <NavLinks collapsed={collapsed} />
      </div>

      <div className="space-y-3 border-t border-border p-3">
        <UserCard collapsed={collapsed} />
      </div>
    </aside>
  );
}
