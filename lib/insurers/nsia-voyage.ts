/**
 * NSIA Sénégal — Assurance Voyage (grille statique).
 * Source : "TARIF NSIA VOYAGE", application 02/06/2025.
 *
 * Modèle : le prix TTC dépend de la FORMULE × la DURÉE (base assuré 18–65 ans).
 * L'âge de l'assuré applique ensuite un coefficient (NB du barème) :
 *   < 18 ans → ×0,5 · 18–65 → ×1 · 66–75 → ×1,5 · 76–80 → ×2.
 *   81–89 ans : uniquement le plan Schengen (tarif à confirmer avec NSIA).
 * Les familles Étudiant et Pèlerinage ont leurs propres âges et sont à tarif
 * forfaitaire (pas de coefficient d'âge).
 */

export type NsiaFamily = "standard" | "etudiant" | "pelerinage";

export interface NsiaFormule {
  key: string;
  family: NsiaFamily;
  label: string;
  group: string;
}

export interface NsiaDuration {
  key: string;
  label: string;
}

export interface NsiaAgeTier {
  key: string;
  label: string;
  factor: number;
}

/* --- Coefficients d'âge (formules standard) ------------------------- */
export const NSIA_AGE_TIERS: NsiaAgeTier[] = [
  { key: "child", label: "Moins de 18 ans (×0,5)", factor: 0.5 },
  { key: "adult", label: "18 à 65 ans", factor: 1 },
  { key: "senior1", label: "66 à 75 ans (×1,5)", factor: 1.5 },
  { key: "senior2", label: "76 à 80 ans (×2)", factor: 2 },
];

/* --- Durées par famille --------------------------------------------- */
export const NSIA_STD_DURATIONS: NsiaDuration[] = [
  { key: "d7", label: "Jusqu'à 7 jours" },
  { key: "d10", label: "Jusqu'à 10 jours" },
  { key: "d15", label: "Jusqu'à 15 jours" },
  { key: "d21", label: "Jusqu'à 21 jours" },
  { key: "d31", label: "Jusqu'à 31 jours" },
  { key: "d45", label: "Jusqu'à 45 jours" },
  { key: "d60", label: "Jusqu'à 60 jours" },
  { key: "d92", label: "Jusqu'à 92 jours" },
  { key: "d180", label: "Jusqu'à 180 jours (voyages multiples)" },
  { key: "d365", label: "Jusqu'à 365 jours (voyages multiples)" },
  { key: "d730", label: "Jusqu'à 730 jours (voyages multiples)" },
];

export const NSIA_STUDENT_DURATIONS: NsiaDuration[] = [
  { key: "s6m", label: "6 mois (max 180 jours consécutifs)" },
  { key: "s9m", label: "9 mois (max 276 jours consécutifs)" },
  { key: "s1an", label: "1 an (max 365 jours consécutifs)" },
];

export const NSIA_PELERINAGE_DURATIONS: NsiaDuration[] = [
  { key: "p15", label: "Jusqu'à 15 jours" },
  { key: "p30", label: "Jusqu'à 30 jours" },
  { key: "p45", label: "Jusqu'à 45 jours" },
];

/* --- Formules ------------------------------------------------------- */
export const NSIA_FORMULES: NsiaFormule[] = [
  { key: "europe_schengen_plus", family: "standard", label: "Europe & Schengen Plus", group: "Standard — Europe" },
  { key: "schengen_only", family: "standard", label: "Schengen Only", group: "Standard — Europe" },
  { key: "mondial_premium", family: "standard", label: "Mondial Premium", group: "Standard — Monde entier" },
  { key: "mondial_basic", family: "standard", label: "Mondial Basic", group: "Standard — Monde entier" },
  { key: "mondial_plus", family: "standard", label: "Mondial Plus", group: "Standard — Monde entier" },
  { key: "afrique", family: "standard", label: "Afrique", group: "Standard — Afrique" },
  { key: "student_basic", family: "etudiant", label: "Student Mondial Basic", group: "Étudiant" },
  { key: "student_plus", family: "etudiant", label: "Student Mondial Plus", group: "Étudiant" },
  { key: "student_premium", family: "etudiant", label: "Student Mondial Premium", group: "Étudiant" },
  { key: "pelerinage_deluxe", family: "pelerinage", label: "Pèlerinage Deluxe", group: "Pèlerinage" },
  { key: "pelerinage_plus", family: "pelerinage", label: "Pèlerinage Plus", group: "Pèlerinage" },
  { key: "pelerinage_basic", family: "pelerinage", label: "Pèlerinage Basic", group: "Pèlerinage" },
];

/* --- Grilles TTC (base 18–65 ans) ----------------------------------- */
const STD_GRID: Record<string, Record<string, number>> = {
  europe_schengen_plus: {
    d7: 7978, d10: 10065, d15: 11612, d21: 15224, d31: 16772, d45: 20922,
    d60: 24041, d92: 34921, d180: 40597, d365: 59239, d730: 94954,
  },
  schengen_only: {
    d7: 7238, d10: 8337, d15: 9436, d21: 12196, d31: 13295, d45: 16593,
    d60: 19352, d92: 27069, d180: 31489, d365: 45241, d730: 86003,
  },
  mondial_premium: {
    d7: 26262, d10: 31175, d15: 40440, d21: 49166, d31: 70972, d45: 80237,
    d60: 88403, d92: 98229, d180: 122749, d365: 132014, d730: 251945,
  },
  mondial_basic: {
    d7: 15000, d10: 18821, d15: 25181, d21: 27092, d31: 34080, d45: 38529,
    d60: 42350, d92: 63341, d180: 71611, d365: 84960, d730: 153637,
  },
  mondial_plus: {
    d7: 26437, d10: 35990, d15: 42979, d21: 60802, d31: 63969, d45: 69073,
    d60: 74150, d92: 106578, d180: 166357, d365: 181641, d730: 352078,
  },
  afrique: {
    d7: 6632, d10: 7731, d15: 8831, d21: 11007, d31: 12084, d45: 15359,
    d60: 17535, d92: 25185, d180: 29537, d365: 43715, d730: 84051,
  },
};

const STUDENT_GRID: Record<string, Record<string, number>> = {
  student_basic: { s6m: 175281, s9m: 196900, s1an: 221057 },
  student_plus: { s6m: 193079, s9m: 217236, s1an: 243959 },
  student_premium: { s6m: 216446, s9m: 247154, s1an: 259429 },
};

const PELERINAGE_GRID: Record<string, Record<string, number>> = {
  pelerinage_deluxe: { p15: 5234, p30: 10226, p45: 14768 },
  pelerinage_plus: { p15: 6599, p30: 12955, p45: 17498 },
  pelerinage_basic: { p15: 7048, p30: 14768, p45: 19311 },
};

export const NSIA_VOYAGE_NOTES = [
  "Tarif de base pour un assuré de 18 à 65 ans. Coefficient selon l'âge : −50 % (moins de 18 ans), +50 % (66–75 ans), +100 % (76–80 ans).",
  "De 81 à 89 ans : seul le plan Schengen est disponible (tarif à confirmer avec NSIA).",
  "Formules « voyages multiples » (180/365/730 j) : plusieurs déplacements sur la période.",
  "Zones — Europe : Schengen. Monde entier : hors Sénégal. Pèlerinage : monde entier hors lieux saints de l'espace Schengen.",
];

/* --- Helpers -------------------------------------------------------- */
export function nsiaDurations(family: NsiaFamily): NsiaDuration[] {
  if (family === "etudiant") return NSIA_STUDENT_DURATIONS;
  if (family === "pelerinage") return NSIA_PELERINAGE_DURATIONS;
  return NSIA_STD_DURATIONS;
}

function baseTtc(
  family: NsiaFamily,
  formuleKey: string,
  durationKey: string,
): number {
  const grid =
    family === "etudiant"
      ? STUDENT_GRID
      : family === "pelerinage"
        ? PELERINAGE_GRID
        : STD_GRID;
  return grid[formuleKey]?.[durationKey] ?? 0;
}

export interface NsiaQuoteLine {
  label: string;
  count: number;
  factor: number;
  unitTtc: number;
  subtotal: number;
}

export interface NsiaVoyageQuote {
  formuleLabel: string;
  durationLabel: string;
  family: NsiaFamily;
  lines: NsiaQuoteLine[];
  travelers: number;
  totalTtc: number;
}

function meta(formuleKey: string, durationKey: string) {
  const formule = NSIA_FORMULES.find((f) => f.key === formuleKey);
  const family = formule?.family ?? "standard";
  const durationLabel =
    nsiaDurations(family).find((d) => d.key === durationKey)?.label ?? "";
  return { formule, family, durationLabel };
}

/** Standard families: sum base × age-coefficient × head count per tier. */
export function priceNsiaStandard(
  formuleKey: string,
  durationKey: string,
  counts: Record<string, number>,
): NsiaVoyageQuote {
  const { formule, family, durationLabel } = meta(formuleKey, durationKey);
  const base = baseTtc("standard", formuleKey, durationKey);
  const lines: NsiaQuoteLine[] = NSIA_AGE_TIERS.filter(
    (t) => (counts[t.key] ?? 0) > 0,
  ).map((t) => {
    const unitTtc = Math.round(base * t.factor);
    const count = counts[t.key];
    return {
      label: t.label,
      count,
      factor: t.factor,
      unitTtc,
      subtotal: unitTtc * count,
    };
  });
  return {
    formuleLabel: formule?.label ?? "",
    durationLabel,
    family,
    lines,
    travelers: lines.reduce((s, l) => s + l.count, 0),
    totalTtc: lines.reduce((s, l) => s + l.subtotal, 0),
  };
}

/** Étudiant / Pèlerinage: flat TTC × number of travelers. */
export function priceNsiaFlat(
  formuleKey: string,
  durationKey: string,
  count: number,
): NsiaVoyageQuote {
  const { formule, family, durationLabel } = meta(formuleKey, durationKey);
  const unitTtc = baseTtc(family, formuleKey, durationKey);
  const lines: NsiaQuoteLine[] =
    count > 0
      ? [{ label: "Voyageur", count, factor: 1, unitTtc, subtotal: unitTtc * count }]
      : [];
  return {
    formuleLabel: formule?.label ?? "",
    durationLabel,
    family,
    lines,
    travelers: count,
    totalTtc: unitTtc * count,
  };
}
