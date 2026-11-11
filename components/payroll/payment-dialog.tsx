"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { PayrollContract } from "@/lib/data/payroll";
import { createPayrollPayment } from "@/lib/data/payroll";
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

const paymentSchema = z.object({
  contractId: z.string().min(1, "Contrat requis"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Période invalide"),
  amount: z.number().int().positive("Le montant doit être positif"),
});

interface PaymentDialogProps {
  contracts: PayrollContract[];
  period: string;
  userId: string;
  onCreated: () => void;
}

export function PaymentDialog({
  contracts,
  period,
  userId,
  onCreated,
}: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contractId, setContractId] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async () => {
    const parsed = paymentSchema.safeParse({
      contractId,
      period,
      amount: Number(amount),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }
    setSaving(true);
    try {
      await createPayrollPayment(
        parsed.data.contractId,
        parsed.data.period,
        parsed.data.amount,
        userId,
      );
      toast.success("Versement enregistré");
      setContractId("");
      setAmount("");
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Enregistrement impossible. Vérifiez vos droits.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Wallet className="h-4 w-4" />
          Saisir un versement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Versement — {period}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Contrat *</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un contrat" />
              </SelectTrigger>
              <SelectContent>
                {contracts
                  .filter((c) => c.status === "actif")
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.clientName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-amount">Montant (FCFA) *</Label>
            <Input
              id="pp-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
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
