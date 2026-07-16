"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { fetchObjective, upsertObjective } from "@/lib/data/performance";
import { periodLabel } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SetObjectiveDialogProps {
  /** Target user; null closes the dialog. */
  target: User | null;
  period: string;
  /** Current user id, recorded as the one who set the objective. */
  setBy: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function SetObjectiveDialog({
  target,
  period,
  setBy,
  onOpenChange,
  onSaved,
}: SetObjectiveDialogProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!target) return;
    setError(false);
    setAmount("");
    let active = true;
    fetchObjective(target.id, period)
      .then((existing) => {
        if (active && existing) setAmount(String(existing.targetAmount));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [target, period]);

  const handleSubmit = async () => {
    if (!target) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setError(true);
      return;
    }
    try {
      await upsertObjective(target.id, value, setBy, period);
      toast.success("Objectif défini", {
        description: `${target.name} · ${periodLabel(period)}`,
      });
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Enregistrement impossible. Vérifiez vos droits.");
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Objectif — {target?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Période : {periodLabel(period)}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="target-amount">Objectif (FCFA)</Label>
            <Input
              id="target-amount"
              type="number"
              step={50_000}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(false);
              }}
              placeholder="1000000"
              autoFocus
            />
            {error && (
              <p className="text-xs text-sirius-danger">
                Saisissez un montant valide.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
