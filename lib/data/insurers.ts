import { createClient } from "@/lib/supabase/client";
import type { IntegrationMode, Insurer, ProductType } from "@/lib/types";

interface InsurerRow {
  id: string;
  name: string;
  short_name: string;
  products: ProductType[] | null;
  integration_mode: IntegrationMode;
  commission_rate: number;
  active: boolean;
  subscription_url: string | null;
  dashboard_url: string | null;
}

const COLS =
  "id,name,short_name,products,integration_mode,commission_rate,active,subscription_url,dashboard_url";

function mapInsurer(r: InsurerRow): Insurer {
  return {
    id: r.id,
    name: r.name,
    shortName: r.short_name,
    products: r.products ?? [],
    integrationMode: r.integration_mode,
    commissionRate: Number(r.commission_rate),
    active: r.active,
    subscriptionUrl: r.subscription_url ?? undefined,
    dashboardUrl: r.dashboard_url ?? undefined,
  };
}

export async function fetchInsurers(): Promise<Insurer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("insurers")
    .select(COLS)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => mapInsurer(r as InsurerRow));
}

export async function setInsurerActive(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("insurers")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export async function updateInsurerLinks(
  id: string,
  subscriptionUrl: string,
  dashboardUrl: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("insurers")
    .update({
      subscription_url: subscriptionUrl.trim() || null,
      dashboard_url: dashboardUrl.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}
