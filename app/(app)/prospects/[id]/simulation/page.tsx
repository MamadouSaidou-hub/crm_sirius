"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from "lucide-react";
import type {
  AutoRiskData,
  Contract,
  QuoteOption,
  SimProduct,
} from "@/lib/types";
import {
  AUTO_FORMULA_LABELS,
  CONTRACT_STATUS_BADGE_VARIANT,
  CONTRACT_STATUS_LABELS,
  SIM_PRODUCT_LABELS,
} from "@/lib/constants";
import {
  getInsurerById,
  getInsurersForProduct,
  getProspectById,
  simulateAuto,
} from "@/lib/mock-data";
import { addContract } from "@/lib/store/subscriptions";
import { AutoSimulationForm } from "@/components/simulation/auto-simulation-form";
import {
  AskiaOptions,
  type AskiaSelection,
} from "@/components/simulation/askia-options";
import { QuoteOptionCard } from "@/components/simulation/quote-option-card";
import { SubscribeDialog } from "@/components/simulation/subscribe-dialog";
import { ProductTabs } from "@/components/simulation/product-tabs";
import { AskiaProductSimulation } from "@/components/simulation/askia-product-simulation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

const ALL = "all";
const ASKIA_ID = "ins-askia";

export default function ProspectSimulationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const prospect = getProspectById(id);
  if (!prospect) notFound();

  const [product, setProduct] = useState<SimProduct>("auto");
  const [risk, setRisk] = useState<AutoRiskData | null>(null);
  const [insurerId, setInsurerId] = useState<string>(ALL);
  const [askia, setAskia] = useState<AskiaSelection>({});
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<QuoteOption | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);

  const autoInsurers = getInsurersForProduct("auto");
  const isAskia = insurerId === ASKIA_ID;

  // Pricing is async: some insurers (Askia) are quoted through their real API.
  useEffect(() => {
    if (!risk) {
      setOptions([]);
      return;
    }
    // Askia referential selections only apply when Askia is targeted.
    const effectiveRisk: AutoRiskData = isAskia
      ? { ...risk, ...askia }
      : risk;
    let active = true;
    setLoading(true);
    simulateAuto(effectiveRisk, insurerId === ALL ? undefined : [insurerId])
      .then((result) => {
        if (active) setOptions(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [risk, insurerId, isAskia, askia]);

  const selectedInsurer = selected
    ? getInsurerById(selected.insurerId)
    : undefined;

  const handleSubscribe = (option: QuoteOption) => {
    setSelected(option);
    setDialogOpen(true);
  };

  const handleSubscribed = (created: Contract) => {
    addContract(created);
    setContract(created);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/prospects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Retour au prospect
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Simulation
          </h1>
          <p className="text-sm text-muted-foreground">
            {prospect.name} · {SIM_PRODUCT_LABELS[product]}
          </p>
        </div>
      </div>

      <ProductTabs value={product} onChange={setProduct} />

      {product === "auto" ? (
        <>
          {contract && <ContractBanner contract={contract} />}

          <Card>
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
              <Label className="shrink-0">Compagnie</Label>
              <Select value={insurerId} onValueChange={setInsurerId}>
                <SelectTrigger className="sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Toutes les compagnies</SelectItem>
                  {autoInsurers.map((insurer) => (
                    <SelectItem key={insurer.id} value={insurer.id}>
                      {insurer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground sm:ml-auto">
                {insurerId === ALL
                  ? "Comparez toutes les offres"
                  : "Devis individuel"}
              </p>
            </CardContent>
          </Card>

          {isAskia && <AskiaOptions value={askia} onChange={setAskia} />}

          <AutoSimulationForm
            defaultValue={risk ?? undefined}
            onSimulate={setRisk}
            showFormula={!isAskia}
          />

          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Comparaison des offres en cours…
            </div>
          )}

          {!loading && options.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {options.length} offre{options.length > 1 ? "s" : ""}
                </h2>
                {!isAskia && (
                  <span className="text-sm text-muted-foreground">
                    Formule : {AUTO_FORMULA_LABELS[options[0].formula]}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {options.map((option, index) => (
                  <QuoteOptionCard
                    key={option.insurerId}
                    option={option}
                    best={index === 0}
                    onSubscribe={handleSubscribe}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <AskiaProductSimulation product={product} />
      )}

      {selected && selectedInsurer && (
        <SubscribeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          insurer={selectedInsurer}
          option={selected}
          prospectId={id}
          clientName={prospect.name}
          onSubscribed={handleSubscribed}
        />
      )}
    </div>
  );
}

function ContractBanner({ contract }: { contract: Contract }) {
  const insurer = getInsurerById(contract.insurerId);
  const active = contract.status === "active";
  return (
    <div className="flex flex-col gap-3 rounded-md border border-sirius-success/30 bg-sirius-success/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {active ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sirius-success" />
        ) : (
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sirius-gold" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            Souscription {insurer?.name} —{" "}
            {AUTO_FORMULA_LABELS[contract.formula]}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFCFA(contract.totalPremium)} / an
            {contract.policyNumber && ` · Police ${contract.policyNumber}`}
          </p>
        </div>
      </div>
      <Badge variant={CONTRACT_STATUS_BADGE_VARIANT[contract.status]}>
        {CONTRACT_STATUS_LABELS[contract.status]}
      </Badge>
    </div>
  );
}
