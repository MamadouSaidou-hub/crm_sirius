"use client";

import { LogOut } from "lucide-react";
import { useMockUser } from "@/lib/mock-auth";
import { ROLE_LABELS } from "@/lib/constants";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UserCard({ collapsed = false }: { collapsed?: boolean }) {
  const { user, signOut } = useMockUser();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <UserAvatar name={user.name} role={user.role} />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sirius-subtext"
          onClick={() => signOut()}
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md bg-secondary/50 p-2">
      <UserAvatar name={user.name} role={user.role} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.name}
        </p>
        <p className={cn("truncate text-xs text-sirius-subtext")}>
          {ROLE_LABELS[user.role]}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-sirius-subtext hover:text-sirius-danger"
        onClick={() => signOut()}
        title="Déconnexion"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
