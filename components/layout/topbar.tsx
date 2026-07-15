"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMockUser } from "@/lib/mock-auth";

interface TopbarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  notificationCount: number;
}

export function Topbar({
  onMenuClick,
  onSearchClick,
  notificationCount,
}: TopbarProps) {
  const { user, signOut } = useMockUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-sirius-navy/80 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        title="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 flex-1 md:block">
        <Breadcrumbs />
      </div>

      <button
        type="button"
        onClick={onSearchClick}
        className="ml-auto flex h-9 items-center gap-2 rounded-md border border-border bg-sirius-ink/40 px-3 text-sm text-muted-foreground transition-colors hover:border-sirius-gold/40 md:ml-0 md:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Rechercher…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium md:inline">
          ⌘K
        </kbd>
      </button>

      <ThemeToggle />

      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <Badge
            variant="gold"
            className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
          >
            {notificationCount}
          </Badge>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="shrink-0 rounded-full">
            <UserAvatar name={user.name} role={user.role} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-medium text-foreground">{user.name}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {user.email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings">Mon profil</a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-sirius-danger"
          >
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
