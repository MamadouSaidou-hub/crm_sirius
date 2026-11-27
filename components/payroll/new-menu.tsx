"use client";

import { useState } from "react";
import { ChevronDown, FilePlus2, Plus, ShieldPlus, Wallet } from "lucide-react";
import type { User } from "@/lib/types";
import type { PayrollSnapshot } from "@/lib/data/payroll";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContractDialog } from "@/components/payroll/contract-dialog";
import { PaymentDialog } from "@/components/payroll/payment-dialog";
import { PolicyDialog } from "@/components/payroll/policy-dialog";

type Entry = "contract" | "payment" | "policy" | null;

interface NewMenuProps {
  snapshot: PayrollSnapshot;
  commercials: User[];
  period: string;
  /** The displayed month is closed: payments for it are refused. */
  periodClosed: boolean;
  userId: string;
  onCreated: () => void;
}

/** One "Nouveau" button for the three kinds of entries, instead of three buttons. */
export function NewMenu({
  snapshot,
  commercials,
  period,
  periodClosed,
  userId,
  onCreated,
}: NewMenuProps) {
  const [entry, setEntry] = useState<Entry>(null);
  const close = (kind: Exclude<Entry, null>) => (open: boolean) =>
    setEntry(open ? kind : null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouveau
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEntry("policy")}>
            <ShieldPlus className="mr-2 h-4 w-4" />
            Police IARD
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEntry("contract")}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Contrat vie / retraite
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={periodClosed}
            onSelect={() => setEntry("payment")}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {periodClosed ? "Versement (mois clôturé)" : "Versement"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PolicyDialog
        open={entry === "policy"}
        onOpenChange={close("policy")}
        commercials={commercials}
        products={snapshot.products.filter((p) => p.commissionMode === "per_policy")}
        agreements={snapshot.agreements}
        plans={snapshot.plans}
        userId={userId}
        onCreated={onCreated}
      />
      <ContractDialog
        open={entry === "contract"}
        onOpenChange={close("contract")}
        commercials={commercials}
        products={snapshot.products.filter((p) => p.commissionMode === "per_payment")}
        onCreated={onCreated}
      />
      <PaymentDialog
        open={entry === "payment"}
        onOpenChange={close("payment")}
        contracts={snapshot.contracts}
        period={period}
        userId={userId}
        onCreated={onCreated}
      />
    </>
  );
}
