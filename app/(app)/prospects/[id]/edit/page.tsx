"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getProspectById } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { ProspectForm } from "@/components/prospects/prospect-form";

export default function EditProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const prospect = getProspectById(id);
  if (!prospect) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier le prospect"
        description={prospect.name}
      />
      <ProspectForm prospect={prospect} />
    </div>
  );
}
