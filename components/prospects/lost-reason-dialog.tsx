"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface LostReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectName: string;
  onConfirm: (reason: string) => void;
}

/** Forces a reason before a prospect can be marked as lost. */
export function LostReasonDialog({
  open,
  onOpenChange,
  prospectName,
  onConfirm,
}: LostReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (reason.trim().length < 3) {
      setError(true);
      return;
    }
    onConfirm(reason.trim());
    setReason("");
    setError(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setReason("");
          setError(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marquer comme perdu</DialogTitle>
          <DialogDescription>
            Indiquez le motif pour {prospectName}. Cette information est
            obligatoire.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="lost-reason">Motif de perte *</Label>
          <Textarea
            id="lost-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(false);
            }}
            placeholder="Ex. Prime trop élevée, a choisi un concurrent…"
            rows={3}
            autoFocus
          />
          {error && (
            <p className="text-xs text-sirius-danger">
              Merci de préciser un motif (3 caractères minimum).
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirmer la perte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
