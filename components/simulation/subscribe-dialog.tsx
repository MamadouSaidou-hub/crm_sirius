"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Insurer, PaymentMethod, QuoteOption } from "@/lib/types";
import {
  AUTO_FORMULA_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import { getConnector } from "@/lib/insurers/connector";
import { createContract, type ContractItem } from "@/lib/data/contracts";
import { useMockUser } from "@/lib/mock-auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFCFA } from "@/lib/utils";

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurer: Insurer;
  option: QuoteOption;
  prospectId: string;
  clientName: string;
  onSubscribed: (contract: ContractItem) => void;
}

export function SubscribeDialog({
  open,
  onOpenChange,
  insurer,
  option,
  prospectId,
  clientName,
  onSubscribed,
}: SubscribeDialogProps) {
  const { user } = useMockUser();
  const [effectiveDate, setEffectiveDate] = useState(todayISODate());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wave");
  const [result, setResult] = useState<ContractItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the dialog whenever it is (re)opened for a fresh subscription.
  useEffect(() => {
    if (open) {
      setEffectiveDate(todayISODate());
      setPaymentMethod("wave");
      setResult(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    setSubmitting(true);
    const res = getConnector(insurer).subscribe({
      insurer,
      option,
      effectiveDate,
      paymentMethod,
      clientName,
    });

    const end = new Date(effectiveDate);
    end.setFullYear(end.getFullYear() + 1);

    try {
      const created = await createContract({
        prospectId,
        insurerId: insurer.id,
        formula: option.formula,
        totalPremium: option.totalPremium,
        effectiveDate,
        expiryDate: end.toISOString().slice(0, 10),
        status: res.status,
        paymentMethod,
        paymentStatus: res.status === "active" ? "paid" : "pending",
        policyNumber: res.policyNumber,
        attestationNumber: res.attestationNumber,
        createdBy: user.id,
      });
      setResult(created);
      if (res.status === "active") {
        toast.success("Souscription confirmée", { description: res.message });
      } else {
        toast.info("Dossier transmis", { description: res.message });
      }
      onSubscribed(created);
    } catch {
      toast.error("Souscription impossible. Vérifiez vos droits et réessayez.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {result ? (
          <ResultView contract={result} onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Souscription — {insurer.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="text-foreground">{clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formule</span>
                  <span className="text-foreground">
                    {AUTO_FORMULA_LABELS[option.formula]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prime annuelle</span>
                  <span className="font-semibold text-sirius-gold">
                    {formatFCFA(option.totalPremium)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="effectiveDate">Date d&apos;effet</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={effectiveDate}
                  min={todayISODate()}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Moyen de paiement</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                Confirmer la souscription
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultView({
  contract,
  onClose,
}: {
  contract: ContractItem;
  onClose: () => void;
}) {
  const active = contract.status === "active";
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {active ? (
            <CheckCircle2 className="h-5 w-5 text-sirius-success" />
          ) : (
            <Clock className="h-5 w-5 text-sirius-gold" />
          )}
          {active ? "Police émise" : "Dossier en attente"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-sm">
        {active ? (
          <div className="rounded-md border border-sirius-success/30 bg-sirius-success/10 p-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">N° de police</span>
              <span className="font-mono text-foreground">
                {contract.policyNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attestation</span>
              <span className="font-mono text-foreground">
                {contract.attestationNumber}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-sirius-gold/30 bg-sirius-gold/10 p-3 text-muted-foreground">
            La police sera émise après validation sur le portail de l&apos;assureur
            (délai habituel : 24-48&nbsp;h).
          </div>
        )}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => toast.success("Documents générés (simulation)")}
        >
          <FileText className="h-4 w-4" />
          Générer les conditions particulières
        </Button>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Terminé</Button>
      </DialogFooter>
    </>
  );
}
