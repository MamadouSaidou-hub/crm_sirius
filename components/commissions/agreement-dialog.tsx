"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { Insurer, ProductType } from "@/lib/types";
import { PRODUCT_LABELS } from "@/lib/constants";
import { createCommissionAgreement } from "@/lib/data/commissions";
import type { PayrollProduct } from "@/lib/data/payroll";
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

/** Scope select values: "all", "line:<productType>" or "product:<uuid>". */
const SCOPE_ALL = "all";

export const BASE_LABELS: Record<CommissionBase, string> = {
  ttc: "Taxes comprises (TTC)",
  ht: "Hors taxe (HT)",
  prime_nette: "Prime nette",
};

const percent = z
  .number({ invalid_type_error: "Taux invalide" })
  .min(0, "Un taux doit être entre 0 et 100 %")
  .max(100, "Un taux doit être entre 0 et 100 %");

const schema = z.object({
  insurerId: z.string().min(1, "Compagnie requise"),
  ratePercent: percent,
  retrocessionPercent: percent.nullable(),
  accessoryPercent: percent,
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
});

/** First day of the current month, 'YYYY-MM-DD' (rates are never retroactive). */
export function firstOfCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

interface AgreementDialogProps {
  insurers: Insurer[];
  products: PayrollProduct[];
  userId: string;
  onCreated: () => void;
}

export function AgreementDialog({
  insurers,
  products,
  userId,
  onCreated,
}: AgreementDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [insurerId, setInsurerId] = useState("");
  const [scope, setScope] = useState<string>(SCOPE_ALL);
  const [ratePercent, setRatePercent] = useState("");
  const [retrocession, setRetrocession] = useState("");
  const [base, setBase] = useState<CommissionBase>("ttc");
  const [accessoryPercent, setAccessoryPercent] = useState("0");
  const [effectiveFrom, setEffectiveFrom] = useState(firstOfCurrentMonth());
  const [note, setNote] = useState("");

  const insurer = insurers.find((i) => i.id === insurerId);
  const insurerProducts = products.filter((p) => p.insurerId === insurerId);

  const onInsurerChange = (id: string) => {
    setInsurerId(id);
    setScope(SCOPE_ALL);
  };

  const handleSubmit = async () => {
    const parsed = schema.safeParse({
      insurerId,
      ratePercent: ratePercent === "" ? Number.NaN : Number(ratePercent),
      retrocessionPercent: retrocession === "" ? null : Number(retrocession),
      accessoryPercent:
        accessoryPercent === "" ? 0 : Number(accessoryPercent),
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
        productId: scope.startsWith("product:") ? scope.slice(8) : null,
        productType: scope.startsWith("line:")
          ? (scope.slice(5) as ProductType)
          : null,
        rate: parsed.data.ratePercent / 100,
        retrocessionRate:
          parsed.data.retrocessionPercent === null
            ? null
            : parsed.data.retrocessionPercent / 100,
        base,
        accessoryShare: parsed.data.accessoryPercent / 100,
        effectiveFrom: parsed.data.effectiveFrom,
        note: note.trim() || undefined,
        createdBy: userId,
      });
      toast.success("Taux enregistré");
      setOpen(false);
      setRatePercent("");
      setRetrocession("");
      setAccessoryPercent("0");
      setNote("");
      onCreated();
    } catch {
      toast.error(
        "Enregistrement impossible : un taux existe déjà pour cette portée à cette date, ou vous n'avez pas les droits.",
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
            <Select value={insurerId} onValueChange={onInsurerChange}>
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
            <Label>S&apos;applique à</Label>
            <Select value={scope} onValueChange={setScope} disabled={!insurerId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SCOPE_ALL}>
                  Toute la compagnie (taux par défaut)
                </SelectItem>
                {(insurer?.products ?? []).map((p) => (
                  <SelectItem key={p} value={`line:${p}`}>
                    Toute la ligne {PRODUCT_LABELS[p]}
                  </SelectItem>
                ))}
                {insurerProducts.map((p) => (
                  <SelectItem key={p.id} value={`product:${p.id}`}>
                    Produit : {p.label}
                    {p.segment === "groupe" ? " (Groupe)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le taux d&apos;un produit précis l&apos;emporte sur celui de sa
              ligne, qui l&apos;emporte sur celui de la compagnie.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ag-rate">Taux du cabinet (%) *</Label>
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
              <Label htmlFor="ag-retro">Rétrocession (%)</Label>
              <Input
                id="ag-retro"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="Barème"
                value={retrocession}
                onChange={(e) => setRetrocession(e.target.value)}
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
            <div className="space-y-1.5">
              <Label>Calculé sur</Label>
              <Select
                value={base}
                onValueChange={(v) => setBase(v as CommissionBase)}
              >
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-acc">Part des accessoires pour le cabinet (%)</Label>
            <Input
              id="ag-acc"
              type="number"
              min={0}
              max={100}
              step="1"
              value={accessoryPercent}
              onChange={(e) => setAccessoryPercent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Polices IARD uniquement : 0 = aucun accessoire, 50 = la moitié,
              100 = tous les accessoires s&apos;ajoutent à la commission.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-note">Note</Label>
            <Input
              id="ag-note"
              value={note}
              placeholder="Ex. barème NSIA : 15 % puis 5 %"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Rétrocession vide = part du barème de rémunération (10 % par
            défaut). Le taux s&apos;applique dès sa date d&apos;effet : les mois
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
