"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ProspectForm } from "@/components/prospects/prospect-form";

export default function NewProspectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau prospect"
        description="Renseignez les informations du prospect"
      />
      <ProspectForm />
    </div>
  );
}
