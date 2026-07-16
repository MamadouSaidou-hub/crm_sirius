"use client";

import { useEffect, useReducer, useState } from "react";
import { Building2, Loader2, Plug, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Insurer } from "@/lib/types";
import { useMockUser } from "@/lib/mock-auth";
import { canManageTeam } from "@/lib/access";
import { fetchInsurers, setInsurerActive } from "@/lib/data/insurers";
import { PageHeader } from "@/components/shared/page-header";
import { Forbidden } from "@/components/shared/forbidden";
import { Card, CardContent } from "@/components/ui/card";
import { PartnersTable } from "@/components/partners/partners-table";
import { PartnerLinksSection } from "@/components/partners/partner-links-section";
import { EditLinksDialog } from "@/components/partners/edit-links-dialog";

export default function PartnersPage() {
  const { user } = useMockUser();
  const [version, refresh] = useReducer((x: number) => x + 1, 0);
  const [list, setList] = useState<Insurer[] | null>(null);
  const [linksTarget, setLinksTarget] = useState<Insurer | null>(null);

  const allowed = canManageTeam(user);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    fetchInsurers()
      .then((is) => active && setList(is))
      .catch(() => active && setList([]));
    return () => {
      active = false;
    };
  }, [allowed, version]);

  if (!allowed) {
    return (
      <Forbidden message="La gestion des compagnies partenaires est réservée aux administrateurs et managers." />
    );
  }

  const canEdit = user.role === "admin";
  const insurers = list ?? [];
  const apiCount = insurers.filter((i) => i.integrationMode === "api").length;
  const portalCount = insurers.length - apiCount;

  const onToggleActive = (id: string) => {
    const target = insurers.find((i) => i.id === id);
    const next = !(target?.active ?? true);
    setList((prev) =>
      (prev ?? []).map((i) => (i.id === id ? { ...i, active: next } : i)),
    );
    setInsurerActive(id, next).catch(() => {
      toast.error("Action impossible. Vérifiez vos droits.");
      refresh();
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compagnies partenaires"
        description="Assureurs disponibles pour la tarification et la souscription"
      />

      {list === null ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des compagnies…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat icon={Building2} label="Partenaires" value={insurers.length} />
            <Stat icon={Zap} label="Intégrés par API" value={apiCount} accent />
            <Stat icon={Plug} label="Via portail" value={portalCount} />
          </div>

          <PartnerLinksSection
            insurers={insurers}
            canEdit={canEdit}
            onEdit={setLinksTarget}
          />

          <PartnersTable insurers={insurers} onToggleActive={onToggleActive} />
        </>
      )}

      <EditLinksDialog
        target={linksTarget}
        onOpenChange={(o) => {
          if (!o) setLinksTarget(null);
        }}
        onSaved={refresh}
      />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={
            accent
              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sirius-gold/15 text-sirius-gold"
              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sirius-teal"
          }
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-xl font-semibold text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
