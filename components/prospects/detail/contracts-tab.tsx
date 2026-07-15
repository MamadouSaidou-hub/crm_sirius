"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Contract } from "@/lib/types";
import {
  AUTO_FORMULA_LABELS,
  CONTRACT_STATUS_BADGE_VARIANT,
  CONTRACT_STATUS_LABELS,
  INTEGRATION_MODE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import { getInsurerById } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatFCFA } from "@/lib/utils";
import { fullDate } from "@/lib/date";

interface ContractsTabProps {
  prospectId: string;
  contracts: Contract[];
}

export function ContractsTab({ prospectId, contracts }: ContractsTabProps) {
  if (contracts.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Aucune souscription"
        description="Lancez une simulation pour comparer les offres et souscrire un contrat."
        action={
          <Button asChild>
            <Link href={`/prospects/${prospectId}/simulation`}>
              Simuler un devis
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/prospects/${prospectId}/simulation`}>
            Nouvelle simulation
          </Link>
        </Button>
      </div>
      {contracts.map((contract) => (
        <ContractRow key={contract.id} contract={contract} />
      ))}
    </div>
  );
}

function ContractRow({ contract }: { contract: Contract }) {
  const insurer = getInsurerById(contract.insurerId);
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">
              {insurer?.name ?? "Assureur"}
            </p>
            <Badge variant={CONTRACT_STATUS_BADGE_VARIANT[contract.status]}>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </Badge>
            {insurer && (
              <span className="text-xs text-muted-foreground">
                {INTEGRATION_MODE_LABELS[insurer.integrationMode]}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {AUTO_FORMULA_LABELS[contract.formula]} · Du{" "}
            {fullDate(contract.effectiveDate)} au {fullDate(contract.expiryDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            Paiement : {PAYMENT_METHOD_LABELS[contract.paymentMethod]}
            {contract.policyNumber && (
              <>
                {" · "}
                <span className="font-mono">{contract.policyNumber}</span>
              </>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-lg font-semibold text-sirius-gold">
            {formatFCFA(contract.totalPremium)}
          </p>
          <p className="text-xs text-muted-foreground">par an</p>
        </div>
      </CardContent>
    </Card>
  );
}
