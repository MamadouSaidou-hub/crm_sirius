"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { useMockUser } from "@/lib/mock-auth";
import { canExport } from "@/lib/access";
import { type ProspectListItem } from "@/lib/data/prospects";
import { loadProspects } from "@/lib/offline/reads";
import { fetchAssignableCommercials } from "@/lib/data/profiles";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { ProspectCard } from "@/components/prospects/prospect-card";
import {
  EMPTY_FILTERS,
  ProspectsFilters,
  type ProspectFilters,
} from "@/components/prospects/prospects-filters";

function matches(filters: ProspectFilters, p: ProspectListItem) {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const haystack = `${p.name} ${p.phone} ${p.email}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.stage !== "all" && p.stage !== filters.stage) return false;
  if (filters.assignedTo !== "all" && p.assignedTo !== filters.assignedTo)
    return false;
  if (filters.product !== "all" && !p.products.includes(filters.product))
    return false;
  if (filters.from && p.lastActivityAt < new Date(filters.from).toISOString())
    return false;
  if (filters.to) {
    const end = new Date(filters.to);
    end.setHours(23, 59, 59, 999);
    if (p.lastActivityAt > end.toISOString()) return false;
  }
  return true;
}

export default function ProspectsPage() {
  const { user } = useMockUser();
  const [filters, setFilters] = useState<ProspectFilters>(EMPTY_FILTERS);
  const [prospects, setProspects] = useState<ProspectListItem[] | null>(null);
  const [commercials, setCommercials] = useState<User[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([loadProspects(user), fetchAssignableCommercials(user)])
      .then(([ps, cs]) => {
        if (!active) return;
        setProspects(ps);
        setCommercials(cs);
      })
      .catch(() => {
        if (!active) return;
        setProspects([]);
        toast.error("Erreur de chargement des prospects.");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const showCommercialFilter = user.role !== "commercial";

  const filtered = useMemo(() => {
    if (!prospects) return [];
    return prospects
      .filter((p) => matches(filters, p))
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }, [prospects, filters]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospects"
        description={
          prospects === null
            ? "Chargement…"
            : `${filtered.length} prospect${filtered.length > 1 ? "s" : ""} visible${filtered.length > 1 ? "s" : ""}`
        }
        actions={
          <>
            {canExport(user) && (
              <Button
                variant="outline"
                onClick={() =>
                  toast.success("Export simulé", {
                    description: "Le fichier CSV aurait été téléchargé.",
                  })
                }
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
            )}
            <Button asChild>
              <Link href="/prospects/new">
                <Plus className="h-4 w-4" />
                Nouveau prospect
              </Link>
            </Button>
          </>
        }
      />

      <ProspectsFilters
        value={filters}
        onChange={setFilters}
        commercials={commercials}
        showCommercialFilter={showCommercialFilter}
      />

      {prospects === null ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des prospects…
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden lg:block">
            <ProspectsTable data={filtered} />
          </div>

          {/* Mobile / tablet: stacked cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
            {filtered.length === 0 ? (
              <p className="col-span-full rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                Aucun prospect ne correspond aux filtres.
              </p>
            ) : (
              filtered.map((p) => <ProspectCard key={p.id} prospect={p} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
