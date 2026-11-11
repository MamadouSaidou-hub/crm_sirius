"use client";

import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { User } from "@/lib/types";
import {
  createPayrollContract,
  type PayrollProduct,
} from "@/lib/data/payroll";
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

const contractSchema = z.object({
  commercialId: z.string().min(1, "Commercial requis"),
  productId: z.string().min(1, "Produit requis"),
  clientName: z.string().trim().min(2, "Nom du client requis"),
  signatureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  subscriptionAmount: z.number().int().min(0, "Montant invalide"),
  referencePremium: z.number().int().min(0, "Montant invalide"),
  durationMonths: z.number().int().positive("Durée invalide"),
});

interface ContractDialogProps {
  commercials: User[];
  products: PayrollProduct[];
  onCreated: () => void;
}

export function ContractDialog({
  commercials,
  products,
  onCreated,
}: ContractDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commercialId, setCommercialId] = useState("");
  const [productId, setProductId] = useState("");
  const [clientName, setClientName] = useState("");
  const [signatureDate, setSignatureDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [subscription, setSubscription] = useState("0");
  const [premium, setPremium] = useState("");
  const [duration, setDuration] = useState("120");

  const onProductChange = (id: string) => {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) setSubscription(String(product.defaultSubscription));
  };

  const handleSubmit = async () => {
    const parsed = contractSchema.safeParse({
      commercialId,
      productId,
      clientName,
      signatureDate,
      subscriptionAmount: Number(subscription),
      referencePremium: Number(premium),
      durationMonths: Number(duration),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }
    setSaving(true);
    try {
      await createPayrollContract(parsed.data);
      toast.success("Contrat enregistré");
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Création impossible. Vérifiez vos droits et réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FilePlus2 className="h-4 w-4" />
          Nouveau contrat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau contrat vie / retraite</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Commercial *</Label>
            <Select value={commercialId} onValueChange={setCommercialId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un commercial" />
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
            <Select value={productId} onValueChange={onProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un produit" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc-client">Client *</Label>
            <Input
              id="pc-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pc-date">Date de signature *</Label>
              <Input
                id="pc-date"
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-duration">Durée (mois)</Label>
              <Input
                id="pc-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-sub">Souscription (FCFA)</Label>
              <Input
                id="pc-sub"
                type="number"
                min={0}
                value={subscription}
                onChange={(e) => setSubscription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-premium">Cotisation (FCFA) *</Label>
              <Input
                id="pc-premium"
                type="number"
                min={0}
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
              />
            </div>
          </div>
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
