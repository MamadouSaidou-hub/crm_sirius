"use client";

import { useEffect, useState } from "react";
import { Banknote, HandCoins, Scale, TrendingUp } from "lucide-react";
import type { User } from "@/lib/types";
import { fetchProfitability, type ProfitabilitySnapshot } from "@/lib/data/payroll";
import { recentPeriods } from "@/lib/data/performance";
import { periodLabel } from "@/lib/date";
import { TAUX_CABINET } from "@/lib/payroll/config";
import { formatRate } from "@/components/payroll/payroll-explainer";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProfitabilityChart } from "@/components/dashboard/profitability-chart";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatFCFA, formatFCFACompact } from "@/lib/utils";

/** Signed FCFA amount, e.g. "+12 K FCFA" / "-39 K FCFA". */
function signed(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${formatFCFACompact(Math.abs(amount))}`;
}

/** Cabinet P&L on commercials: what it spends vs what they bring in. */
export function ProfitabilitySection({ user }: { user: User }) {
  const [snapshot, setSnapshot] = useState<ProfitabilitySnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    // recentPeriods is newest-first; the chart reads oldest-first.
    const periods = recentPeriods(6).reverse();
    fetchProfitability(user, periods)
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (failed) return null;
  if (!snapshot) return null;

  const current = snapshot.history[snapshot.history.length - 1];
  const gain = current.net >= 0;
  const label = periodLabel(current.periode);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold uppercase tracking-tight">
          Rentabilité des commerciaux
        </h2>
        <p className="text-sm text-muted-foreground">
          {label} — ce que le cabinet dépense pour sa force de vente, face à la
          commission de courtage ({formatRate(TAUX_CABINET)}) qu&apos;elle lui
          rapporte.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Dépenses paie"
          value={formatFCFACompact(current.depensesPaie)}
          icon={Banknote}
          tone="danger"
          hint={`Base ${formatFCFACompact(current.baseFixe)} · prime ${formatFCFACompact(current.primePerformance)}`}
        />
        <StatCard
          label="Commission cabinet"
          value={formatFCFACompact(current.commissionCabinet)}
          icon={HandCoins}
          tone="success"
          hint={`Sur ${formatFCFACompact(current.encaisse)} encaissés`}
        />
        <StatCard
          label="Résultat net"
          value={signed(current.net)}
          icon={Scale}
          tone={gain ? "success" : "danger"}
          hint={gain ? "Gagnant pour le cabinet" : "Perte ce mois-ci"}
        />
        <StatCard
          label="Marge hors périmètre"
          value={formatFCFACompact(current.commissionHorsPerimetre)}
          icon={TrendingUp}
          tone="teal"
          hint="Mois 4+ : aucun coût commercial"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dépenses vs commission (6 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitabilityChart data={snapshot.history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Par commercial — {label}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commercial</TableHead>
                  <TableHead className="text-right">Rapporte</TableHead>
                  <TableHead className="text-right">Coûte</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.commercials.map((row) => (
                  <TableRow key={row.commercialId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={row.commercial.name}
                          role="commercial"
                          className="h-7 w-7"
                        />
                        <span className="font-medium">
                          {row.commercial.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatFCFA(row.commissionCabinet)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatFCFA(row.cout)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        row.net >= 0
                          ? "text-sirius-success"
                          : "text-sirius-danger",
                      )}
                    >
                      {signed(row.net)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Sur les 3 premiers mois d&apos;un contrat, le commercial coûte plus
        (base fixe + prime + commission) que la commission perçue : le cabinet
        rentabilise le contrat sur les versements suivants (mois 4 et au-delà),
        qui lui reviennent en totalité.
      </p>
    </section>
  );
}
