"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Insurer } from "@/lib/types";
import { updateInsurerLinks } from "@/lib/data/insurers";
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

interface EditLinksDialogProps {
  /** Insurer being edited; null closes the dialog. */
  target: Insurer | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditLinksDialog({
  target,
  onOpenChange,
  onSaved,
}: EditLinksDialogProps) {
  const [subscriptionUrl, setSubscriptionUrl] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState("");

  useEffect(() => {
    if (target) {
      setSubscriptionUrl(target.subscriptionUrl ?? "");
      setDashboardUrl(target.dashboardUrl ?? "");
    }
  }, [target]);

  const handleSubmit = async () => {
    if (!target) return;
    try {
      await updateInsurerLinks(target.id, subscriptionUrl, dashboardUrl);
      toast.success("Liens mis à jour", { description: target.name });
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Enregistrement impossible. Vérifiez vos droits.");
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Liens — {target?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sub-url">Lien de souscription (commerciaux)</Label>
            <Input
              id="sub-url"
              value={subscriptionUrl}
              onChange={(e) => setSubscriptionUrl(e.target.value)}
              placeholder="https://…"
            />
            <p className="text-xs text-muted-foreground">
              Lien partagé aux commerciaux pour souscrire sur le portail.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dash-url">Tableau de bord cabinet (admin)</Label>
            <Input
              id="dash-url"
              value={dashboardUrl}
              onChange={(e) => setDashboardUrl(e.target.value)}
              placeholder="https://…"
            />
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
