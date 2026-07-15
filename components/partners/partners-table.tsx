"use client";

import { MoreHorizontal, Plug, Power, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Insurer } from "@/lib/types";
import {
  INTEGRATION_MODE_BADGE_VARIANT,
  INTEGRATION_MODE_LABELS,
} from "@/lib/constants";
import { ProductBadges } from "@/components/shared/product-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PartnersTableProps {
  insurers: Insurer[];
  onToggleActive: (id: string) => void;
}

function formatCommission(rate: number): string {
  return `${(rate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function RowActions({
  insurer,
  onToggleActive,
}: {
  insurer: Insurer;
  onToggleActive: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          disabled={insurer.integrationMode !== "api"}
          onClick={() =>
            toast.success(`Connexion à ${insurer.name} réussie (simulation)`)
          }
        >
          <Plug className="h-4 w-4" />
          Tester la connexion API
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onToggleActive(insurer.id);
            toast.success(
              insurer.active ? "Partenaire désactivé" : "Partenaire activé",
            );
          }}
        >
          <Power className="h-4 w-4" />
          {insurer.active ? "Désactiver" : "Activer"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PartnersTable({ insurers, onToggleActive }: PartnersTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Compagnie</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Intégration</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {insurers.map((insurer) => (
              <TableRow key={insurer.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{insurer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {insurer.shortName}
                  </p>
                </TableCell>
                <TableCell>
                  <ProductBadges products={insurer.products} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={INTEGRATION_MODE_BADGE_VARIANT[insurer.integrationMode]}
                  >
                    {insurer.integrationMode === "api" && (
                      <Zap className="h-3 w-3" />
                    )}
                    {INTEGRATION_MODE_LABELS[insurer.integrationMode]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCommission(insurer.commissionRate)}
                </TableCell>
                <TableCell>
                  <Badge variant={insurer.active ? "success" : "muted"}>
                    {insurer.active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RowActions
                    insurer={insurer}
                    onToggleActive={onToggleActive}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {insurers.map((insurer) => (
          <div
            key={insurer.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {insurer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Commission {formatCommission(insurer.commissionRate)}
                </p>
              </div>
              <RowActions insurer={insurer} onToggleActive={onToggleActive} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={INTEGRATION_MODE_BADGE_VARIANT[insurer.integrationMode]}
              >
                {insurer.integrationMode === "api" && <Zap className="h-3 w-3" />}
                {INTEGRATION_MODE_LABELS[insurer.integrationMode]}
              </Badge>
              <Badge variant={insurer.active ? "success" : "muted"}>
                {insurer.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="mt-2">
              <ProductBadges products={insurer.products} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
