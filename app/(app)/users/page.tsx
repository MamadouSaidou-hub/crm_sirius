"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import type { User } from "@/lib/types";
import { useMockUser } from "@/lib/mock-auth";
import { canManageTeam, visibleUserIds } from "@/lib/access";
import { users as allUsers } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { Forbidden } from "@/components/shared/forbidden";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/users/users-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";

export default function UsersPage() {
  const { user } = useMockUser();

  const [list, setList] = useState<User[]>(() =>
    allUsers.map((u) => ({ ...u }))
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const visibleIds = useMemo(() => visibleUserIds(user), [user]);

  // Hooks must run before any early return.
  if (!canManageTeam(user)) {
    return (
      <Forbidden message="La gestion d'équipe est réservée aux administrateurs et managers." />
    );
  }

  const visible = list
    .filter((u) => visibleIds.has(u.id))
    .sort((a, b) => {
      const order = { admin: 0, manager: 1, commercial: 2 };
      return order[a.role] - order[b.role] || a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        description={`${visible.length} membre${visible.length > 1 ? "s" : ""}`}
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Inviter
          </Button>
        }
      />

      <UsersTable
        users={visible}
        onEdit={(u) => setEditTarget(u)}
        onToggleActive={(id) =>
          setList((prev) =>
            prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
          )
        }
      />

      <UserFormDialog
        mode="invite"
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
      <UserFormDialog
        mode="edit"
        open={editTarget !== null}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
        user={editTarget ?? undefined}
      />
    </div>
  );
}
