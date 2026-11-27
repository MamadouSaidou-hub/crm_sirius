"use client";

import { useEffect, useReducer, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { useMockUser } from "@/lib/mock-auth";
import { canManageTeam } from "@/lib/access";
import { ROLE_ORDER } from "@/lib/permissions";
import {
  fetchUsers,
  setUserActive,
  type UserWithManager,
} from "@/lib/data/users";
import { PageHeader } from "@/components/shared/page-header";
import { Forbidden } from "@/components/shared/forbidden";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/users/users-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";

export default function UsersPage() {
  const { user } = useMockUser();
  const [version, bump] = useReducer((x: number) => x + 1, 0);
  const [list, setList] = useState<UserWithManager[] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const allowed = canManageTeam(user);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    fetchUsers(user)
      .then((us) => active && setList(us))
      .catch(() => active && setList([]));
    return () => {
      active = false;
    };
  }, [user, allowed, version]);

  if (!allowed) {
    return (
      <Forbidden message="La gestion d'équipe est réservée aux administrateurs et managers." />
    );
  }

  const sorted = (list ?? [])
    .slice()
    .sort(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name),
    );

  const onToggleActive = (id: string) => {
    const target = (list ?? []).find((u) => u.id === id);
    const next = !(target?.active ?? true);
    setList((prev) =>
      (prev ?? []).map((u) => (u.id === id ? { ...u, active: next } : u)),
    );
    setUserActive(id, next).catch(() => {
      toast.error("Action impossible. Vérifiez vos droits.");
      bump();
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        description={
          list === null
            ? "Chargement…"
            : `${sorted.length} membre${sorted.length > 1 ? "s" : ""}`
        }
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Inviter
          </Button>
        }
      />

      {list === null ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de l&apos;équipe…
        </div>
      ) : (
        <UsersTable
          users={sorted}
          onEdit={setEditTarget}
          onToggleActive={onToggleActive}
        />
      )}

      <UserFormDialog
        mode="invite"
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSaved={bump}
      />
      <UserFormDialog
        mode="edit"
        open={editTarget !== null}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
        user={editTarget ?? undefined}
        onSaved={bump}
      />
    </div>
  );
}
