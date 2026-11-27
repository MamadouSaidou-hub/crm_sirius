"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { Insurer, ProductSegment, ProductType } from "@/lib/types";
import { PRODUCT_LABELS } from "@/lib/constants";
import { createPayrollProduct } from "@/lib/data/payroll";
import type { CommissionMode } from "@/lib/data/payroll";
import type {
  AssietteType,
  FrequenceCotisation,
} from "@/lib/payroll/engine";
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

export const SEGMENT_LABELS: Record<ProductSegment, string> = {
  individuel: "Individuel",
  groupe: "Groupe",
};

export const MODE_LABELS: Record<CommissionMode, string> = {
  per_payment: "À chaque versement (vie)",
  per_policy: "Une fois par police (IARD)",
};

export const ASSIETTE_LABELS: Record<AssietteType, string> = {
  VARIABLE: "Variable (montant réellement versé)",
  FIGEE: "Figée (fixée à la signature)",
};

const schema = z.object({
  insurerId: z.string().min(1, "Compagnie requise"),
  label: z.string().trim().min(2, "Nom du produit requis"),
  defaultSubscription: z.number().min(0, "Montant invalide"),
  minPayment: z.number().min(0, "Montant invalide"),
});

interface ProductDialogProps {
  insurers: Insurer[];
  onCreated: () => void;
}

export function ProductDialog({ insurers, onCreated }: ProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [insurerId, setInsurerId] = useState("");
  const [label, setLabel] = useState("");
  const [productType, setProductType] = useState<ProductType>("vie");
  const [segment, setSegment] = useState<ProductSegment>("individuel");
  const [mode, setMode] = useState<CommissionMode>("per_payment");
  const [assiette, setAssiette] = useState<AssietteType>("VARIABLE");
  const [frequence, setFrequence] = useState<FrequenceCotisation>("mensuelle");
  const [subscription, setSubscription] = useState("0");
  const [minPayment, setMinPayment] = useState("0");

  const handleSubmit = async () => {
    const parsed = schema.safeParse({
      insurerId,
      label,
      defaultSubscription: Number(subscription),
      minPayment: Number(minPayment),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }
    setSaving(true);
    try {
      await createPayrollProduct({
        insurerId: parsed.data.insurerId,
        label: parsed.data.label,
        productType,
        segment,
        commissionMode: mode,
        assietteType: assiette,
        frequence,
        defaultSubscription: parsed.data.defaultSubscription,
        minPayment: parsed.data.minPayment,
      });
      toast.success("Produit ajouté au catalogue");
      setOpen(false);
      setLabel("");
      onCreated();
    } catch {
      toast.error(
        "Création impossible : ce produit existe déjà pour cette compagnie, ou vous n'avez pas les droits.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          Nouveau produit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau produit</DialogTitle>
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
            <Label htmlFor="pr-label">Nom du produit *</Label>
            <Input
              id="pr-label"
              value={label}
              placeholder="Ex. NSIA Etudes"
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ligne</Label>
              <Select
                value={productType}
                onValueChange={(v) => setProductType(v as ProductType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRODUCT_LABELS) as ProductType[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRODUCT_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Segment</Label>
              <Select
                value={segment}
                onValueChange={(v) => setSegment(v as ProductSegment)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEGMENT_LABELS) as ProductSegment[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEGMENT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Commission</Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as CommissionMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MODE_LABELS) as CommissionMode[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODE_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vie : une commission à chaque versement. IARD (auto, voyage,
              santé…) : une seule commission, à la date d&apos;effet de la police.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assiette</Label>
              <Select
                value={assiette}
                onValueChange={(v) => setAssiette(v as AssietteType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ASSIETTE_LABELS) as AssietteType[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ASSIETTE_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cotisation</Label>
              <Select
                value={frequence}
                onValueChange={(v) => setFrequence(v as FrequenceCotisation)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuelle">Mensuelle</SelectItem>
                  <SelectItem value="annuelle">Annuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-sub">Souscription par défaut</Label>
              <Input id="pr-sub" type="number" min={0} value={subscription} onChange={(e) => setSubscription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-min">Versement minimum</Label>
              <Input id="pr-min" type="number" min={0} value={minPayment} onChange={(e) => setMinPayment(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Après création, ajoutez son taux de commission avec « Nouveau taux »
            (sinon le taux de la ligne ou de la compagnie s&apos;applique).
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
