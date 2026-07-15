"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  ASKIA_FALLBACK_CATEGORIES,
  ASKIA_FALLBACK_PACKS,
  ASKIA_FALLBACK_SUBCATEGORIES,
  type AskiaRefItem,
} from "@/lib/insurers/askia";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { AutoGuarantees } from "@/lib/types";

export interface AskiaSelection {
  category?: string;
  subCategory?: string;
  packCode?: string;
  guarantees?: AutoGuarantees;
}

interface AskiaOptionsProps {
  value: AskiaSelection;
  onChange: (next: AskiaSelection) => void;
}

const NO_PACK = "none";

/** Sensible default cover (≈ tiers +), used until the user adjusts. */
const DEFAULT_GUARANTEES: AutoGuarantees = {
  recour: true,
  vol: true,
  inc: true,
  gb: true,
  pt: false,
};

const GUARANTEE_FIELDS: { key: keyof AutoGuarantees; label: string }[] = [
  { key: "recour", label: "Défense & recours" },
  { key: "vol", label: "Vol" },
  { key: "inc", label: "Incendie" },
  { key: "gb", label: "Bris de glace" },
  { key: "pt", label: "Personnes transportées" },
];

/** Fetch a referential list from the proxy, or null to signal fallback. */
async function loadRef(query: string): Promise<AskiaRefItem[] | null> {
  try {
    const res = await fetch(`/api/insurers/askia/referentiel?${query}`);
    const data = await res.json();
    if (res.ok && data.ok && Array.isArray(data.items)) {
      return data.items as AskiaRefItem[];
    }
  } catch {
    // ignore — caller falls back
  }
  return null;
}

/**
 * Askia-specific selectors (vehicle category, sub-category, commercial pack)
 * populated from Askia's referential API, mirroring the ASKIA NET doc. Falls
 * back to the documented static lists until the API key is configured.
 */
export function AskiaOptions({ value, onChange }: AskiaOptionsProps) {
  const [categories, setCategories] = useState<AskiaRefItem[]>(
    ASKIA_FALLBACK_CATEGORIES,
  );
  const [subCategories, setSubCategories] = useState<AskiaRefItem[]>(
    ASKIA_FALLBACK_SUBCATEGORIES,
  );
  const [packs, setPacks] = useState<AskiaRefItem[]>(ASKIA_FALLBACK_PACKS);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadRef("type=categories&brCode=500"),
      loadRef("type=packs"),
    ]).then(([cats, pks]) => {
      if (!active) return;
      if (cats) setCategories(cats);
      if (pks) setPacks(pks);
      setLive(Boolean(cats));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!value.category) {
      setSubCategories(ASKIA_FALLBACK_SUBCATEGORIES);
      return;
    }
    let active = true;
    loadRef(`type=scategories&catCode=${value.category}`).then((subs) => {
      if (active) setSubCategories(subs ?? ASKIA_FALLBACK_SUBCATEGORIES);
    });
    return () => {
      active = false;
    };
  }, [value.category]);

  // Seed default cover once so a quote can be produced without a pack.
  useEffect(() => {
    if (!value.guarantees && !value.packCode) {
      onChange({ ...value, guarantees: DEFAULT_GUARANTEES });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guarantees = value.guarantees ?? DEFAULT_GUARANTEES;
  const hasPack = Boolean(value.packCode);

  const toggle = (key: keyof AutoGuarantees) =>
    onChange({
      ...value,
      guarantees: { ...guarantees, [key]: !guarantees[key] },
    });

  return (
    <Card className="border-sirius-gold/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sirius-gold" />
          Options Askia
        </CardTitle>
        <CardDescription>
          {live
            ? "Référentiel Askia en direct."
            : "Liste par défaut (doc) — configurez la clé Askia pour le référentiel réel."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Catégorie de véhicule</Label>
          <Select
            value={value.category ?? ""}
            onValueChange={(v) =>
              onChange({ ...value, category: v, subCategory: undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Sous-catégorie</Label>
          <Select
            value={value.subCategory ?? ""}
            onValueChange={(v) => onChange({ ...value, subCategory: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {subCategories.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Pack commercial (optionnel)</Label>
          <Select
            value={value.packCode ?? NO_PACK}
            onValueChange={(v) =>
              onChange({
                ...value,
                packCode: v === NO_PACK ? undefined : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PACK}>Aucun (garanties à la carte)</SelectItem>
              {packs.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-3">
          <Label>Garanties</Label>
          {hasPack ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Les garanties sont définies par le pack commercial sélectionné.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked disabled />
                Responsabilité civile (incluse)
              </span>
              {GUARANTEE_FIELDS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox checked={guarantees[key]} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
