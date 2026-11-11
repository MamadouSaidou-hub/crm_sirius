"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { Insurer, ProductType } from "@/lib/types";
import { PRODUCT_LABELS } from "@/lib/constants";
import { createCommissionAgreement } from "@/lib/data/commissions";
import type { CommissionBase } from "@/lib/payroll/rates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_PRODUCTS = "all";

export const BASE_LABELS: Record<CommissionBase, string> = {
  ttc: "Taxes comprises (TTC)",
  ht: "Hors taxe (HT)",
  prime_nette: "Prime nette",
};

const schema = z.object({
  insurerId: z.string().min(1, "Compagnie requise"),
  ratePercent: z
    .number({ invalid_type_error: "Taux invalide" })
    .min(0, "Le taux doit être entre 0 et 100 %")
    .max(100, "Le taux doit être entre 0 et 100 %"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
});

/** First day of the current month, 'YYYY-MM-DD' (rates are never retroactive). */
export function firstOfCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

interface AgreementDialogProps {
  insurers: Insurer[];
  userId: string;
  onCreated: () => void;
}

export function AgreementDialog({
  insurers,
  userId,
  onCreated,
}: AgreementDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [insurerId, setInsurerId] = useState("");
  const [product, setProduct] = useState<string>(ALL_PRODUCTS);
  const [ratePercent, setRatePercent] = useState("");
  const [base, setBase] = useState<CommissionBase>("ttc");
  const [effectiveFrom, setEffectiveFrom] = useState(firstOfCurrentMonth());
  const [note, setNote] = useState("");

  const insurer = insurers.find((i) => i.id === insurerId);

  const handleSubmit = async () => {
    const parsed = schema.safeParse({
      insurerId,
      ratePercent: ratePercent === "" ? Number.NaN : Number(ratePercent),
      effectiveFrom,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }
    if (parsed.data.effectiveFrom < firstOfCurrentMonth()) {
      toast.error("La date d'effet ne peut pas être avant le mois en cours.");
      return;
    }
    setSaving(true);
    try {
      await createCommissionAgreement({
        insurerId: parsed.data.insurerId,
        productType: product === ALL_PRODUCTS ? null : (product as ProductType),
        rate: parsed.data.ratePercent / 100,
        base,
        effectiveFrom: parsed.data.effectiveFrom,
        note: note.trim() || undefined,
        createdBy: userId,
      });
      toast.success("Convention enregistrée");
      setOpen(false);
      setRatePercent("");
      setNote("");
      onCreated();
    } catch {
      toast.error(
        "Enregistrement impossible : cette convention existe déjà à cette date, ou vous n'avez pas les droits.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nouveau taux
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau taux de commission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Compagnie *</Label>
            <Select value={insurerId} onValueChange={setInsurerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une compagnie" />
              </SelectTrigger>
              <SelectContent>
                {insurers.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Produit</Label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PRODUCTS}>
                  Tous les produits de la compagnie
                </SelectItem>
                {(insurer?.products ?? []).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRODUCT_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ag-rate">Taux (%) *</Label>
              <Input
                id="ag-rate"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={ratePercent}
                onChange={(e) => setRatePercent(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-date">En vigueur dès *</Label>
              <Input
                id="ag-date"
                type="date"
                min={firstOfCurrentMonth()}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Calculé sur</Label>
            <Select value={base} onValueChange={(v) => setBase(v as CommissionBase)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BASE_LABELS) as CommissionBase[]).map((b) => (
                  <SelectItem key={b} value={b}>
                    {BASE_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-note">Note</Label>
            <Input
              id="ag-note"
              value={note}
              placeholder="Ex. renégociation 2026"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Le nouveau taux s&apos;applique à partir de cette date. Les mois
            précédents ne sont pas recalculés et l&apos;historique est conservé.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
