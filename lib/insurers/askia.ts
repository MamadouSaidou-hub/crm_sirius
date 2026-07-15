import type {
  AutoFormula,
  AutoRiskData,
  MrhRiskData,
  RapatriementRiskData,
  VoyageRiskData,
} from "@/lib/types";

/**
 * Mapping between the Sirius auto risk model and the ASKIA NET API.
 * Ref: "API ASKIA NET" (juillet 2024), I. Simulation → A. Automobile (tarif normal).
 *
 * Endpoint: GET {base}/webservice/srwb/automobile?<params>
 * Headers:  Accept: application/json, appClient: <key>
 */

/** Normalized pricing our UI understands, derived from the Askia response. */
export interface AskiaPricing {
  netPremium: number;
  taxes: number;
  fees: number;
  totalPremium: number;
  commission: number;
  /** Askia's idSaisie — kept for later souscription/traceability. */
  reference?: string;
}

/** Raw Askia auto tarif response. */
interface AskiaAutoResponse {
  accessoire?: number;
  commission?: number;
  fga?: number;
  idSaisie?: string;
  primenette?: number;
  primettc?: number;
  taxe?: number;
}

/** Guarantee flags (recour/vol/inc/pt/gb) implied by a Sirius formula. */
function guaranteeFlags(formula: AutoFormula): Record<string, string> {
  const on = (v: boolean) => (v ? "1" : "0");
  const rc = formula === "rc";
  const tousRisques = formula === "tous_risques";
  return {
    recour: on(!rc),
    vol: on(!rc),
    inc: on(!rc),
    gb: on(!rc),
    pt: on(tousRisques),
  };
}

/** Guarantee flags from an explicit selection (Askia à la carte). */
function explicitFlags(g: NonNullable<AutoRiskData["guarantees"]>) {
  const on = (v: boolean) => (v ? "1" : "0");
  return {
    recour: on(g.recour),
    vol: on(g.vol),
    inc: on(g.inc),
    gb: on(g.gb),
    pt: on(g.pt),
  };
}

const NRG = (risk: AutoRiskData) =>
  risk.fuel === "diesel" ? "E00002" : "E00001";

/**
 * Build the query params for the Askia auto tarif (détaillé) endpoint.
 * `cat`/`scatCode` come from the referential selection, defaulting to a standard
 * vehicle (510/000) when not chosen.
 */
export function buildAskiaAutoParams(
  risk: AutoRiskData,
): Record<string, string> {
  return {
    cat: risk.category ?? "510",
    scatCode: risk.subCategory ?? "000",
    nrg: NRG(risk),
    pfs: String(risk.fiscalPower),
    nbP: String(risk.seats),
    dure: "12",
    vaf: String(risk.marketValue),
    vvn: String(risk.marketValue),
    ...(risk.guarantees
      ? explicitFlags(risk.guarantees)
      : guaranteeFlags(risk.formula)),
  };
}

/** Build the query params for the Askia pack tarif endpoint (`autopack`). */
export function buildAskiaPackParams(
  risk: AutoRiskData,
): Record<string, string> {
  return {
    nrg: NRG(risk),
    pfs: String(risk.fiscalPower),
    nbP: String(risk.seats),
    dure: "12",
    vaf: String(risk.marketValue),
    pck: risk.packCode as string,
  };
}

/** MRH tarif params (srwb/mrh). */
export function buildAskiaMrhParams(risk: MrhRiskData): Record<string, string> {
  return {
    cntn: String(risk.contentsValue),
    nbreP: String(risk.rooms),
    duree: String(risk.durationMonths),
  };
}

/** Voyage tarif params (srwb/voyage). */
export function buildAskiaVoyageParams(
  risk: VoyageRiskData,
): Record<string, string> {
  return { zn: risk.zone, duree: String(risk.durationDays) };
}

/** Rapatriement tarif params (srwb/rapatriement). */
export function buildAskiaRapatriementParams(
  risk: RapatriementRiskData,
): Record<string, string> {
  return {
    formule: risk.formula,
    adultesupl: String(risk.extraAdults),
    enfantsupl: String(risk.extraChildren),
    nbreAges: String(risk.seniors),
  };
}

/* --- Referential (vehicle categories, sub-categories, packs) --------- */

export interface AskiaRefItem {
  code: string;
  libelle: string;
}

/**
 * Fallback referential lists (from the ASKIA NET doc examples), used to preview
 * the selectors before the API key is configured. Real lists come from the API.
 */
export const ASKIA_FALLBACK_CATEGORIES: AskiaRefItem[] = [
  { code: "510", libelle: "Véhicule de tourisme" },
  { code: "520", libelle: "Véhicule utilitaire" },
  { code: "530", libelle: "Deux-roues" },
];

export const ASKIA_FALLBACK_SUBCATEGORIES: AskiaRefItem[] = [
  { code: "000", libelle: "Standard" },
];

export const ASKIA_FALLBACK_PACKS: AskiaRefItem[] = [
  { code: "P002", libelle: "PACK 1 RC - PT - DR" },
  { code: "P003", libelle: "PACK 2 RC - PT - DR - BDG" },
  { code: "P004", libelle: "PACK 3 RC - PT - DR - BDG - AR" },
  { code: "P005", libelle: "PACK 4 TOUTES OPTIONS SAUF Dommage" },
];

/** Map the Askia response to our normalized pricing. */
export function mapAskiaResponse(raw: AskiaAutoResponse): AskiaPricing {
  const netPremium = raw.primenette ?? 0;
  const fees = raw.accessoire ?? 0;
  const taxes = (raw.taxe ?? 0) + (raw.fga ?? 0);
  const totalPremium = raw.primettc ?? netPremium + taxes + fees;
  return {
    netPremium,
    taxes,
    fees,
    totalPremium,
    commission: raw.commission ?? 0,
    reference: raw.idSaisie,
  };
}
