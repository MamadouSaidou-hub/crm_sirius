"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProductType, Realization } from "@/lib/types";
import { PRODUCTS, PRODUCT_LABELS } from "@/lib/constants";
import { declareRealization } from "@/lib/store/performance";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SOURCES = ["NSIA", "Askia", "Autre"] as const;

interface DeclareRealizationDialogProps {
  commercialId: string;
  period: string;
  onDeclared: (realization: Realization) => void;
}

export function DeclareRealizationDialog({
  commercialId,
  period,
  onDeclared,
}: DeclareRealizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [product, setProduct] = useState<ProductType>("vie");
  const [source, setSource] = useState<string>("NSIA");
  const [reference, setReference] = useState("");
  const [error, setError] = useState(false);

  const reset = () => {
    setAmount("");
    setProduct("vie");
    setSource("NSIA");
    setReference("");
    setError(false);
  };

  const handleSubmit = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(true);
      return;
    }
    const realization = declareRealization({
      commercialId,
      amount: value,
      product,
      source: source.toLowerCase(),
      reference: reference.trim() || undefined,
      period,
    });
    onDeclared(realization);
    toast.success("Réalisation déclarée", {
      description: "En attente de validation par votre manager.",
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Déclarer une réalisation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Déclarer une réalisation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Période : {periodLabel(period)}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Montant souscrit (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              step={10_000}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(false);
              }}
              placeholder="500000"
              autoFocus
            />
            {error && (
              <p className="text-xs text-sirius-danger">
                Saisissez un montant valide.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Produit</Label>
              <Select
                value={product}
                onValueChange={(v) => setProduct(v as ProductType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRODUCT_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Compagnie</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference">Référence (optionnel)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° proposition NSIA, note…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>Déclarer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
