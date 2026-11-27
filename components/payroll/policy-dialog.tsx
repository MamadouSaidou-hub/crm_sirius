"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { Insurer, User } from "@/lib/types";
import { fetchInsurers } from "@/lib/data/insurers";
import { createPayrollPolicy, type PayrollProduct } from "@/lib/data/payroll";
import {
  evaluatePolicy,
  primeNetteFromTtc,
  type PolicyEvaluated,
} from "@/lib/payroll/policies";
import type {
  CommissionAgreement,
  RemunerationPlanEntry,
} from "@/lib/payroll/rates";
import { formatFCFA } from "@/lib/utils";
import { formatRate } from "@/components/payroll/payroll-explainer";
import { writeErrorMessage } from "@/lib/data/errors";
import { useDialogState } from "@/components/payroll/use-dialog-state";
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

const amount = z
  .number({ invalid_type_error: "Montant invalide" })
  .min(0, "Montant invalide");

const policySchema = z.object({
  commercialId: z.string().min(1, "Commercial requis"),
  productId: z.string().min(1, "Produit requis"),
  clientName: z.string().trim().min(2, "Nom de l'assuré requis"),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'effet invalide"),
  primeNette: amount,
  fga: amount,
  taxes: amount,
  accessories: amount,
  primeTtc: amount,
});

/** Parses a numeric text field; an empty field counts as 0. */
function num(value: string): number {
  return value.trim() === "" ? 0 : Number(value);
}

interface PolicyDialogProps {
  commercials: User[];
  /** Per-policy (IARD) products only. */
  products: PayrollProduct[];
  agreements: CommissionAgreement[];
  plans: RemunerationPlanEntry[];
  userId: string;
  onCreated: () => void;
  /** Controlled mode (opened from a parent menu, no trigger button). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PolicyDialog({
  commercials,
  products,
  agreements,
  plans,
  userId,
  onCreated,
  open: controlledOpen,
  onOpenChange,
}: PolicyDialogProps) {
  const { open, setOpen, controlled } = useDialogState(controlledOpen, onOpenChange);
  const [saving, setSaving] = useState(false);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [commercialId, setCommercialId] = useState("");
  const [productId, setProductId] = useState("");
  const [clientName, setClientName] = useState("");
  const [reference, setReference] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [primeTtc, setPrimeTtc] = useState("");
  const [fga, setFga] = useState("");
  const [taxes, setTaxes] = useState("");
  const [accessories, setAccessories] = useState("");
  // The prime nette follows TTC - FGA - taxes - accessories until it is typed.
  const [netOverride, setNetOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchInsurers().then(setInsurers).catch(() => setInsurers([]));
  }, [open]);

  const insurerName = (id: string) =>
    insurers.find((i) => i.id === id)?.shortName ?? "";

  const suggestedNet = primeNetteFromTtc(
    num(primeTtc),
    num(fga),
    num(taxes),
    num(accessories),
  );
  const netText = netOverride ?? (primeTtc.trim() === "" ? "" : String(suggestedNet));

  const product = products.find((p) => p.id === productId);

  // Live preview with the rates in force at the effective date.
  const preview = useMemo((): PolicyEvaluated | string | null => {
    if (!product || !commercialId || netText === "") return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) return null;
    try {
      return evaluatePolicy(
        {
          id: "preview",
          commercialId,
          produitId: product.id,
          dateEffet: effectiveDate,
          primeNette: num(netText),
          fga: num(fga),
          taxes: num(taxes),
          accessoires: num(accessories),
          primeTtc: num(primeTtc),
        },
        {
          insurerId: product.insurerId,
          productId: product.id,
          productType: product.productType,
        },
        agreements,
        plans,
      );
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Commission non calculable.";
    }
  }, [
    product,
    commercialId,
    netText,
    effectiveDate,
    fga,
    taxes,
    accessories,
    primeTtc,
    agreements,
    plans,
  ]);

  const reset = () => {
    setClientName("");
    setReference("");
    setExpiryDate("");
    setPrimeTtc("");
    setFga("");
    setTaxes("");
    setAccessories("");
    setNetOverride(null);
  };

  const handleSubmit = async () => {
    const parsed = policySchema.safeParse({
      commercialId,
      productId,
      clientName,
      effectiveDate,
      primeNette: num(netText),
      fga: num(fga),
      taxes: num(taxes),
      accessories: num(accessories),
      primeTtc: num(primeTtc),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }
    if (parsed.data.primeNette <= 0) {
      toast.error("La prime nette doit être supérieure à 0.");
      return;
    }
    if (expiryDate && expiryDate < parsed.data.effectiveDate) {
      toast.error("L'expiration ne peut pas précéder la date d'effet.");
      return;
    }
    if (typeof preview === "string") {
      toast.error("Aucune convention applicable : ajoutez-la dans « Conventions & taux ».");
      return;
    }
    setSaving(true);
    try {
      await createPayrollPolicy({
        commercialId: parsed.data.commercialId,
        productId: parsed.data.productId,
        clientName: parsed.data.clientName,
        reference: reference.trim() || null,
        effectiveDate: parsed.data.effectiveDate,
        expiryDate: expiryDate || null,
        primeNette: parsed.data.primeNette,
        fga: parsed.data.fga,
        taxes: parsed.data.taxes,
        accessories: parsed.data.accessories,
        primeTtc: parsed.data.primeTtc,
        createdBy: userId,
      });
      toast.success("Police enregistrée");
      setOpen(false);
      reset();
      onCreated();
    } catch (error) {
      toast.error(
        writeErrorMessage(error, "Création impossible. Vérifiez vos droits et réessayez."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <ShieldPlus className="h-4 w-4" />
            Nouvelle police IARD
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle police IARD</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Commercial *</Label>
              <Select value={commercialId} onValueChange={setCommercialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {commercials.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Produit *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {[insurerName(p.insurerId), p.label]
                        .filter(Boolean)
                        .join(" · ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {products.length === 0 && (
            <p className="text-xs text-sirius-warning">
              Aucun produit IARD : un administrateur doit en créer un dans
              « Conventions &amp; taux » (mode « Par police »).
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="po-client">Assuré *</Label>
              <Input
                id="po-client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-ref">Immatriculation / réf.</Label>
              <Input
                id="po-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-eff">Date d&apos;effet *</Label>
              <Input
                id="po-eff"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-exp">Date d&apos;expiration</Label>
              <Input
                id="po-exp"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="po-ttc">Prime TTC (FCFA)</Label>
              <Input
                id="po-ttc"
                type="number"
                min={0}
                value={primeTtc}
                onChange={(e) => setPrimeTtc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-acc">Accessoires (FCFA)</Label>
              <Input
                id="po-acc"
                type="number"
                min={0}
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-fga">FGA (FCFA)</Label>
              <Input
                id="po-fga"
                type="number"
                min={0}
                value={fga}
                onChange={(e) => setFga(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-tax">Taxes (FCFA)</Label>
              <Input
                id="po-tax"
                type="number"
                min={0}
                value={taxes}
                onChange={(e) => setTaxes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="po-net">Prime nette (FCFA) *</Label>
            <Input
              id="po-net"
              type="number"
              min={0}
              value={netText}
              onChange={(e) => setNetOverride(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Calculée : TTC − FGA − taxes − accessoires. Vous pouvez la
              corriger si elle diffère de la police.
            </p>
          </div>

          {preview !== null && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              {typeof preview === "string" ? (
                <p className="text-sirius-warning">{preview}</p>
              ) : (
                <div className="space-y-1">
                  <p>
                    Commission du cabinet :{" "}
                    <span className="font-semibold">
                      {formatFCFA(preview.commissionCabinet)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      ({formatFCFA(preview.assiette)} ×{" "}
                      {formatRate(preview.tauxCabinet)}
                      {preview.partAccessoires > 0
                        ? ` + ${formatRate(preview.partAccessoires)} des accessoires`
                        : ""}
                      )
                    </span>
                  </p>
                  <p>
                    Part du commercial ({formatRate(preview.retrocession)}) :{" "}
                    <span className="font-semibold text-sirius-gold">
                      {formatFCFA(preview.commissionCommercial)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
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
