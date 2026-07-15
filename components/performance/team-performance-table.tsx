"use client";

import { Target } from "lucide-react";
import type { User } from "@/lib/types";
import { attainment } from "@/lib/store/performance";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFCFA } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface PerformanceRow {
  user: User;
  target: number;
  realized: number;
  pending?: number;
  commission?: number;
}

interface TeamPerformanceTableProps {
  rows: PerformanceRow[];
  /** Show the estimated-commission column. */
  showCommission?: boolean;
  /** When provided, shows a per-row "Définir l'objectif" action. */
  onSetObjective?: (user: User) => void;
}

export function TeamPerformanceTable({
  rows,
  showCommission,
  onSetObjective,
}: TeamPerformanceTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Membre</TableHead>
            <TableHead className="text-right">Objectif</TableHead>
            <TableHead className="text-right">Réalisé</TableHead>
            <TableHead className="w-40">Atteinte</TableHead>
            {showCommission && (
              <TableHead className="text-right">Commission</TableHead>
            )}
            {onSetObjective && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ user, target, realized, pending, commission }) => {
            const pct = attainment(realized, target);
            const reached = pct >= 100;
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} role={user.role} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {user.name}
                      </p>
                      {pending ? (
                        <p className="text-xs text-sirius-gold">
                          {formatFCFA(pending)} en attente
                        </p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatFCFA(target)}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {formatFCFA(realized)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          reached ? "bg-sirius-success" : "bg-sirius-gold",
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-10 text-right text-xs font-semibold",
                        reached ? "text-sirius-success" : "text-muted-foreground",
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                </TableCell>
                {showCommission && (
                  <TableCell className="text-right text-sirius-gold">
                    {formatFCFA(commission ?? 0)}
                  </TableCell>
                )}
                {onSetObjective && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetObjective(user)}
                    >
                      <Target className="h-4 w-4" />
                      Objectif
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
