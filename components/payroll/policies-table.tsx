"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Insurer, User } from "@/lib/types";
import { fetchInsurers } from "@/lib/data/insurers";
import type { PayrollPolicy, PayrollProduct } from "@/lib/data/payroll";
import type { PolicyEvaluated } from "@/lib/payroll/policies";
import {
  ALL,
  NO_FILTERS,
  filterPolicies,
  hasActiveFilters,
  type PolicyFilters,
} from "@/lib/payroll/policy-filters";
import { fullDate } from "@/lib/date";
import { formatFCFA, formatNumber } from "@/lib/utils";
import { formatRate } from "@/components/payroll/payroll-explainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PoliciesTableProps {
  /** Policies taking effect in the selected month. */
  policies: PayrollPolicy[];
  evaluated: PolicyEvaluated[];
  products: PayrollProduct[];
  commercials: User[];
}

/** "25 % + 100 % acc." */
function rateLabel(result: PolicyEvaluated): string {
  return result.partAccessoires > 0
    ? `${formatRate(result.tauxCabinet)} + ${formatRate(result.partAccessoires)} acc.`
    : formatRate(result.tauxCabinet);
}

/** IARD policies of the month with the commission each one brings. */
export function PoliciesTable({
  policies,
  evaluated,
  products,
  commercials,
}: PoliciesTableProps) {
  const [filters, setFilters] = useState<PolicyFilters>(NO_FILTERS);
  const [insurers, setInsurers] = useState<Insurer[]>([]);

  useEffect(() => {
    let active = true;
    fetchInsurers()
      .then((list) => active && setInsurers(list))
      .catch(() => active && setInsurers([]));
    return () => {
      active = false;
    };
  }, []);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const commercialById = new Map(commercials.map((c) => [c.id, c]));
  const evaluatedById = new Map(evaluated.map((e) => [e.policyId, e]));

  const insurerOfProduct = (productId: string) =>
    productById.get(productId)?.insurerId;
  const insurerName = (id: string | undefined) =>
    insurers.find((i) => i.id === id)?.shortName ?? "";

  // Offer only the insurers and commercials that have a policy this month.
  const insurerIds = [
    ...new Set(
      policies.flatMap((p) => {
        const id = insurerOfProduct(p.produitId);
        return id ? [id] : [];
      }),
    ),
  ];
  const commercialIds = [...new Set(policies.map((p) => p.commercialId))];

  const shown = filterPolicies(policies, filters, insurerOfProduct);
  const filtered = hasActiveFilters(filters);

  const totalCabinet = shown.reduce(
    (sum, p) => sum + (evaluatedById.get(p.id)?.commissionCabinet ?? 0),
    0,
  );
  const totalCommercial = shown.reduce(
    (sum, p) => sum + (evaluatedById.get(p.id)?.commissionCommercial ?? 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Polices IARD du mois{" "}
          <span className="font-normal normal-case">
            ({filtered ? `${shown.length} sur ${policies.length}` : policies.length})
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="Assuré ou immatriculation"
              aria-label="Rechercher une police"
              className="h-9 w-56 pl-8"
            />
          </div>
          {commercialIds.length > 1 && (
            <Select
              value={filters.commercialId}
              onValueChange={(v) => setFilters({ ...filters, commercialId: v })}
            >
              <SelectTrigger className="h-9 w-44" aria-label="Filtrer par commercial">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les commerciaux</SelectItem>
                {commercialIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {commercialById.get(id)?.name ?? "Commercial"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {insurerIds.length > 1 && (
            <Select
              value={filters.insurerId}
              onValueChange={(v) => setFilters({ ...filters, insurerId: v })}
            >
              <SelectTrigger className="h-9 w-40" aria-label="Filtrer par compagnie">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toutes les compagnies</SelectItem>
                {insurerIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {insurerName(id) || id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filtered && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters(NO_FILTERS)}
            >
              <X className="h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          Aucune police ne correspond à ces filtres.
        </p>
      ) : (
        <>
          {/* Tablet and desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date d&apos;effet</TableHead>
                  <TableHead>Assuré</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Commercial</TableHead>
                  <TableHead className="text-right">Prime nette</TableHead>
                  <TableHead className="text-right">Commission cabinet</TableHead>
                  <TableHead className="text-right">Part commercial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((policy) => {
                  const result = evaluatedById.get(policy.id);
                  return (
                    <TableRow key={policy.id}>
                      <TableCell>{fullDate(`${policy.dateEffet}T12:00:00`)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{policy.clientName}</div>
                        {policy.reference && (
                          <div className="text-xs text-muted-foreground">
                            {policy.reference}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {productById.get(policy.produitId)?.label ?? "Produit"}
                      </TableCell>
                      <TableCell>
                        {commercialById.get(policy.commercialId)?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(policy.primeNette)}
                      </TableCell>
                      <TableCell className="text-right">
                        {result ? formatNumber(result.commissionCabinet) : "—"}
                        {result && (
                          <div className="text-xs text-muted-foreground">
                            {rateLabel(result)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {result ? formatNumber(result.commissionCommercial) : "—"}
                        {result && (
                          <div className="text-xs font-normal text-muted-foreground">
                            {formatRate(result.retrocession)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                  <TableCell colSpan={5}>
                    Total{filtered ? " (filtré)" : ""} — FCFA
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(totalCabinet)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(totalCommercial)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Phone: one card per policy */}
          <div className="space-y-3 md:hidden">
            {shown.map((policy) => {
              const result = evaluatedById.get(policy.id);
              return (
                <Card key={policy.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{policy.clientName}</p>
                        {policy.reference && (
                          <p className="text-xs text-muted-foreground">
                            {policy.reference}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {fullDate(`${policy.dateEffet}T12:00:00`)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {productById.get(policy.produitId)?.label ?? "Produit"} ·{" "}
                      {commercialById.get(policy.commercialId)?.name ?? "—"}
                    </p>
                    <dl className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Prime nette</dt>
                        <dd>{formatNumber(policy.primeNette)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Cabinet</dt>
                        <dd>{result ? formatNumber(result.commissionCabinet) : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Commercial</dt>
                        <dd className="font-semibold">
                          {result ? formatNumber(result.commissionCommercial) : "—"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              );
            })}
            <p className="rounded-lg bg-muted/30 p-3 text-sm font-semibold">
              Total{filtered ? " (filtré)" : ""} : cabinet {formatFCFA(totalCabinet)}{" "}
              · commerciaux {formatFCFA(totalCommercial)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
