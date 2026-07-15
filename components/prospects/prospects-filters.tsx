"use client";

import { Search, X } from "lucide-react";
import type { ProductType, Stage, User } from "@/lib/types";
import { PRODUCTS, PRODUCT_LABELS, STAGES, STAGE_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ProspectFilters {
  search: string;
  stage: Stage | "all";
  assignedTo: string | "all";
  product: ProductType | "all";
  from: string;
  to: string;
}

export const EMPTY_FILTERS: ProspectFilters = {
  search: "",
  stage: "all",
  assignedTo: "all",
  product: "all",
  from: "",
  to: "",
};

interface ProspectsFiltersProps {
  value: ProspectFilters;
  onChange: (value: ProspectFilters) => void;
  commercials: User[];
  showCommercialFilter: boolean;
}

export function ProspectsFilters({
  value,
  onChange,
  commercials,
  showCommercialFilter,
}: ProspectsFiltersProps) {
  const set = <K extends keyof ProspectFilters>(
    key: K,
    v: ProspectFilters[K]
  ) => onChange({ ...value, [key]: v });

  const isDirty =
    value.search !== "" ||
    value.stage !== "all" ||
    value.assignedTo !== "all" ||
    value.product !== "all" ||
    value.from !== "" ||
    value.to !== "";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="flex-1 lg:min-w-[220px]">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Recherche
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Nom, téléphone, email…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:items-end">
        <div className="lg:w-36">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Stage
          </label>
          <Select
            value={value.stage}
            onValueChange={(v) => set("stage", v as Stage | "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showCommercialFilter && (
          <div className="lg:w-44">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Commercial
            </label>
            <Select
              value={value.assignedTo}
              onValueChange={(v) => set("assignedTo", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {commercials.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="lg:w-36">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Produit
          </label>
          <Select
            value={value.product}
            onValueChange={(v) => set("product", v as ProductType | "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {PRODUCTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRODUCT_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:w-40">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Activité depuis
          </label>
          <Input
            type="date"
            value={value.from}
            onChange={(e) => set("from", e.target.value)}
          />
        </div>

        <div className="lg:w-40">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Jusqu&apos;au
          </label>
          <Input
            type="date"
            value={value.to}
            onChange={(e) => set("to", e.target.value)}
          />
        </div>
      </div>

      {isDirty && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="self-start lg:self-end"
        >
          <X className="h-4 w-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
