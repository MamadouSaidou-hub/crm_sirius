/**
 * AXA Sénégal — Assurance Voyage Schengen (grille tarifaire statique).
 * Source : "TARIFS ASSURANCE VOYAGE SCHENGEN", AXA Sénégal, Dakar 10/01/2023.
 * Aucune API : tarification par correspondance. Pour chaque tranche d'âge,
 * zone et durée : PN (prime nette) + COÛT (accessoire, 3 000 fixe) + TAXE = TTC.
 */

export type AxaAgeBand = "child" | "adult" | "senior";
export type AxaZone = "zone1" | "zone2";
export type AxaDurationKey =
  | "d7"
  | "d10"
  | "d15"
  | "d21"
  | "d32"
  | "d62"
  | "d93"
  | "multi6m"
  | "multi1y";

export interface AxaVoyageRate {
  pn: number;
  cout: number;
  taxe: number;
  ttc: number;
}

export const AXA_AGE_BANDS: { key: AxaAgeBand; label: string }[] = [
  { key: "child", label: "Enfant (jusqu'à 18 ans)" },
  { key: "adult", label: "Adulte (jusqu'à 70 ans)" },
  { key: "senior", label: "Senior (70 à 74 ans)" },
];

export const AXA_ZONES: { key: AxaZone; label: string }[] = [
  { key: "zone1", label: "Zone 1 — Afrique / Europe / Moyen-Orient" },
  { key: "zone2", label: "Zone 2 — Monde entier" },
];

export const AXA_DURATIONS: { key: AxaDurationKey; label: string }[] = [
  { key: "d7", label: "1 à 7 jours" },
  { key: "d10", label: "1 à 10 jours" },
  { key: "d15", label: "1 à 15 jours" },
  { key: "d21", label: "1 à 21 jours" },
  { key: "d32", label: "1 à 32 jours" },
  { key: "d62", label: "1 à 62 jours" },
  { key: "d93", label: "1 à 93 jours" },
  { key: "multi6m", label: "Multivoyages 6 mois" },
  { key: "multi1y", label: "Multivoyages 1 an" },
];

const COUT = 3000;
function r(pn: number, taxe: number, ttc: number): AxaVoyageRate {
  return { pn, cout: COUT, taxe, ttc };
}

type Grid = Record<AxaAgeBand, Record<AxaZone, Record<AxaDurationKey, AxaVoyageRate>>>;

export const AXA_VOYAGE_GRID: Grid = {
  child: {
    zone1: {
      d7: r(5544, 1196, 9740),
      d10: r(6775, 1369, 11144),
      d15: r(8622, 1627, 13249),
      d21: r(10471, 1886, 15357),
      d32: r(11086, 1972, 16058),
      d62: r(14166, 2403, 19569),
      d93: r(19710, 3179, 25889),
      multi6m: r(25252, 3955, 32207),
      multi1y: r(33259, 5076, 41335),
    },
    zone2: {
      d7: r(8006, 1541, 12547),
      d10: r(9854, 1800, 14654),
      d15: r(11702, 2058, 16760),
      d21: r(14166, 2403, 19569),
      d32: r(16014, 2662, 21676),
      d62: r(20940, 3352, 27292),
      d93: r(29564, 4559, 37123),
      multi6m: r(37570, 5680, 46250),
      multi1y: r(54201, 8008, 65209),
    },
  },
  adult: {
    zone1: {
      d7: r(7333, 1447, 11780),
      d10: r(8961, 1675, 13636),
      d15: r(11405, 2017, 16422),
      d21: r(13850, 2359, 19209),
      d32: r(14664, 2473, 20137),
      d62: r(18738, 3043, 24781),
      d93: r(26071, 4070, 33141),
      multi6m: r(33402, 5096, 41498),
      multi1y: r(43994, 6579, 53573),
    },
    zone2: {
      d7: r(10590, 1903, 15493),
      d10: r(13035, 2245, 18280),
      d15: r(15479, 2587, 21066),
      d21: r(18738, 3043, 24781),
      d32: r(21182, 3385, 27567),
      d62: r(27699, 4298, 34997),
      d93: r(39106, 5895, 48001),
      multi6m: r(49696, 7377, 60073),
      multi1y: r(71694, 10457, 85151),
    },
  },
  senior: {
    zone1: {
      d7: r(15839, 2637, 21476),
      d10: r(19356, 3130, 25486),
      d15: r(24635, 3869, 31504),
      d21: r(29916, 4608, 37524),
      d32: r(31674, 4854, 39528),
      d62: r(40474, 6086, 49560),
      d93: r(56313, 8304, 67617),
      multi6m: r(72148, 10521, 85669),
      multi1y: r(95027, 13724, 111751),
    },
    zone2: {
      d7: r(22874, 3622, 29496),
      d10: r(28156, 4362, 35518),
      d15: r(33435, 5101, 41536),
      d21: r(40474, 6086, 49560),
      d32: r(45753, 6825, 55578),
      d62: r(59830, 8796, 71626),
      d93: r(84469, 12246, 99715),
      multi6m: r(107343, 15448, 125791),
      multi1y: r(154859, 22100, 179959),
    },
  },
};

export const AXA_VOYAGE_NOTES = [
  "Les formules « multivoyages » couvrent plusieurs déplacements de 92 jours maximum ; la couverture devient caduque au-delà de 3 mois.",
  "Souscription non modifiable et non annulable en cas de rejet de la demande de visa.",
  "Limite d'âge fixée à 74 ans.",
];

export interface AxaTravelerLine {
  band: AxaAgeBand;
  count: number;
}

export interface AxaVoyageQuoteLine {
  band: AxaAgeBand;
  label: string;
  count: number;
  unit: AxaVoyageRate;
  subtotalTtc: number;
}

export interface AxaVoyageQuote {
  zone: AxaZone;
  duration: AxaDurationKey;
  lines: AxaVoyageQuoteLine[];
  travelers: number;
  totalPn: number;
  totalCout: number;
  totalTaxe: number;
  totalTtc: number;
}

/** Price a trip: sum each age band's TTC × head count. */
export function priceAxaVoyage(
  zone: AxaZone,
  duration: AxaDurationKey,
  travelers: AxaTravelerLine[],
): AxaVoyageQuote {
  const lines: AxaVoyageQuoteLine[] = travelers
    .filter((t) => t.count > 0)
    .map((t) => {
      const unit = AXA_VOYAGE_GRID[t.band][zone][duration];
      const label =
        AXA_AGE_BANDS.find((b) => b.key === t.band)?.label ?? t.band;
      return {
        band: t.band,
        label,
        count: t.count,
        unit,
        subtotalTtc: unit.ttc * t.count,
      };
    });

  return {
    zone,
    duration,
    lines,
    travelers: lines.reduce((s, l) => s + l.count, 0),
    totalPn: lines.reduce((s, l) => s + l.unit.pn * l.count, 0),
    totalCout: lines.reduce((s, l) => s + l.unit.cout * l.count, 0),
    totalTaxe: lines.reduce((s, l) => s + l.unit.taxe * l.count, 0),
    totalTtc: lines.reduce((s, l) => s + l.subtotalTtc, 0),
  };
}
