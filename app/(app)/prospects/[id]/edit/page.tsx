"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchProspect, type ProspectListItem } from "@/lib/data/prospects";
import { PageHeader } from "@/components/shared/page-header";
import { ProspectForm } from "@/components/prospects/prospect-form";

export default function EditProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // undefined = loading, null = not found
  const [prospect, setProspect] = useState<
    ProspectListItem | null | undefined
  >(undefined);

  useEffect(() => {
    let active = true;
    fetchProspect(id)
      .then((p) => active && setProspect(p))
      .catch(() => active && setProspect(null));
    return () => {
      active = false;
    };
  }, [id]);

  if (prospect === undefined) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (prospect === null) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Modifier le prospect" description={prospect.name} />
      <ProspectForm prospect={prospect} />
    </div>
  );
}
