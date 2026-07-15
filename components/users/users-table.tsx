"use client";

import { MoreHorizontal, Pencil, Power, Send } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { ROLE_BADGE_VARIANT, ROLE_LABELS } from "@/lib/constants";
import { getUserById } from "@/lib/mock-data";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeDate } from "@/lib/date";

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleActive: (id: string) => void;
}

function RowActions({
  user,
  onEdit,
  onToggleActive,
}: {
  user: User;
  onEdit: (user: User) => void;
  onToggleActive: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onToggleActive(user.id);
            toast.success(
              user.active ? "Membre désactivé" : "Membre activé"
            );
          }}
        >
          <Power className="h-4 w-4" />
          {user.active ? "Désactiver" : "Activer"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => toast.success("Invitation renvoyée (simulée)")}
        >
          <Send className="h-4 w-4" />
          Renvoyer l&apos;invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTable({ users, onEdit, onToggleActive }: UsersTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Membre</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Agence</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const manager = user.managerId
                ? getUserById(user.managerId)
                : null;
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} role={user.role} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {manager?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.agency}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "success" : "muted"}>
                      {user.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLoginAt ? relativeDate(user.lastLoginAt) : "Jamais"}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      user={user}
                      onEdit={onEdit}
                      onToggleActive={onToggleActive}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {users.map((user) => {
          const manager = user.managerId ? getUserById(user.managerId) : null;
          return (
            <div
              key={user.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <UserAvatar name={user.name} role={user.role} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <RowActions
                  user={user}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Badge variant={user.active ? "success" : "muted"}>
                  {user.active ? "Actif" : "Inactif"}
                </Badge>
                {manager && (
                  <span className="text-muted-foreground">
                    Manager : {manager.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
