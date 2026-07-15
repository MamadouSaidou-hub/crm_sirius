"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, ChevronRight, Phone, Search } from "lucide-react";
import { useMockUser } from "@/lib/mock-auth";
import { scopeProspects } from "@/lib/access";
import { prospects as allProspects } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductBadges } from "@/components/shared/product-badges";
import { StageBadge } from "@/components/shared/stage-badge";

/** Normalize for search: lowercase, drop spaces (so phone matches ignore spacing). */
function normalize(value: string): string {
  return value.toLowerCase().replace(/\s/g, "");
}

export default function NewSimulationPage() {
  const router = useRouter();
  const { user } = useMockUser();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const scoped = scopeProspects(user, allProspects);
    const q = normalize(query);
    const filtered = q
      ? scoped.filter(
          (p) =>
            normalize(p.name).includes(q) || normalize(p.phone).includes(q),
        )
      : scoped;
    return filtered.slice(0, 40);
  }, [user, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle simulation"
        description="Choisissez le prospect pour lequel établir un devis"
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou téléphone…"
          className="pl-9"
          autoFocus
        />
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun prospect trouvé"
          description="Essayez un autre nom ou numéro de téléphone."
        />
      ) : (
        <div className="space-y-2">
          {results.map((prospect) => (
            <button
              key={prospect.id}
              type="button"
              onClick={() =>
                router.push(`/prospects/${prospect.id}/simulation`)
              }
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-sirius-gold/40 hover:bg-secondary/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sirius-teal">
                <Calculator className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {prospect.name}
                </p>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {prospect.phone} · {prospect.city}
                </span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <ProductBadges products={prospect.products} />
                <StageBadge stage={prospect.stage} />
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
