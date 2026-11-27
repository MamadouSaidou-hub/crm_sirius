"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import type { PayrollLine } from "@/lib/data/payroll";
import { closePayrollPeriod, reopenPayrollPeriod } from "@/lib/data/closings";
import { freezeLines, monthName } from "@/lib/payroll/closing";
import { formatFCFA } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClosingControlsProps {
  period: string;
  closed: boolean;
  /** The month is over, so it may be closed. */
  closable: boolean;
  /** Director / super admin: may close. */
  canClose: boolean;
  /** Super admin: may reopen. */
  canReopen: boolean;
  closerName: string;
  lines: PayrollLine[];
  totalCabinetCommission: number;
  onChanged: () => void;
}

/** "Clôturer le mois" / "Rouvrir le mois", each behind a confirmation. */
export function ClosingControls({
  period,
  closed,
  closable,
  canClose,
  canReopen,
  closerName,
  lines,
  totalCabinetCommission,
  onChanged,
}: ClosingControlsProps) {
  const [dialog, setDialog] = useState<"close" | "reopen" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const totalPay = lines.reduce((sum, l) => sum + l.total, 0);
  const label = monthName(period);

  const close = async () => {
    setBusy(true);
    try {
      await closePayrollPeriod({
        period,
        closedByName: closerName,
        totalPay,
        totalCabinetCommission,
        lines: freezeLines(lines),
        note: note.trim() || undefined,
      });
      toast.success(`${label} clôturé`);
      setDialog(null);
      setNote("");
      onChanged();
    } catch {
      toast.error("Clôture impossible. Vérifiez vos droits et que le mois est terminé.");
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      await reopenPayrollPeriod(period);
      toast.success(`${label} rouvert`);
      setDialog(null);
      onChanged();
    } catch {
      toast.error("Réouverture impossible. Seul un super administrateur peut le faire.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!closed && canClose && (
        <Button
          size="sm"
          variant="outline"
          disabled={!closable}
          title={
            closable
              ? undefined
              : "Un mois ne peut être clôturé qu'une fois terminé."
          }
          onClick={() => setDialog("close")}
        >
          <Lock className="h-4 w-4" />
          Clôturer le mois
        </Button>
      )}
      {closed && canReopen && (
        <Button size="sm" variant="outline" onClick={() => setDialog("reopen")}>
          <LockOpen className="h-4 w-4" />
          Rouvrir le mois
        </Button>
      )}

      <Dialog open={dialog === "close"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">Clôturer {label}</DialogTitle>
            <DialogDescription>
              Les montants de ce mois sont validés et figés.
            </DialogDescription>
          </DialogHeader>
          <dl className="space-y-1 rounded-md border border-border p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Paie totale</dt>
              <dd className="font-semibold">{formatFCFA(totalPay)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Commission du cabinet</dt>
              <dd className="font-semibold">{formatFCFA(totalCabinetCommission)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Commerciaux</dt>
              <dd className="font-semibold">{lines.length}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Après la clôture, aucun contrat, versement ni police ne pourra plus
            être créé, modifié ou supprimé dans ce mois. Seul un super
            administrateur peut le rouvrir, et la réouverture est tracée.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="close-note">Note (facultatif)</Label>
            <Input
              id="close-note"
              value={note}
              maxLength={200}
              placeholder="Ex. validé avec le DG"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button onClick={close} disabled={busy}>
              Clôturer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reopen"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">Rouvrir {label}</DialogTitle>
            <DialogDescription>
              Les saisies redeviennent possibles sur ce mois.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            À n&apos;utiliser que pour corriger une erreur. Pense à clôturer de
            nouveau le mois ensuite : les totaux figés seront refaits.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={reopen} disabled={busy}>
              Rouvrir le mois
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
