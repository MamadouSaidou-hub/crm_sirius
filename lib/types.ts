/**
 * Domain types for the Sirius CRM prototype.
 * All data is mock and lives in memory; these types describe its shape.
 */

export type UserRole = "admin" | "manager" | "commercial";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  /** Manager this user reports to (commercials only). */
  managerId: string | null;
  agency: string;
  active: boolean;
  /** ISO string of last login, or null if never connected. */
  lastLoginAt: string | null;
}

export type ProductType = "auto" | "mrh" | "sante" | "vie" | "iard";

export type Stage = "lead" | "qualified" | "quoted" | "won" | "lost";

export const SENEGAL_CITIES = [
  "Dakar",
  "Thiès",
  "Saint-Louis",
  "Mbour",
  "Kaolack",
  "Ziguinchor",
] as const;

export type City = (typeof SENEGAL_CITIES)[number];

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  email: string;
  cni: string;
  address: string;
  city: City;
  products: ProductType[];
  estimatedPremium: number;
  stage: Stage;
  /** User id of the assigned commercial. */
  assignedTo: string;
  notes: string;
  /** ISO creation date. */
  createdAt: string;
  /** ISO date of the most recent interaction or update. */
  lastActivityAt: string;
  /** Reason recorded when the prospect was marked lost. */
  lostReason?: string;
}

export type InteractionType = "call" | "visit" | "note" | "whatsapp" | "sms";

export interface Interaction {
  id: string;
  prospectId: string;
  type: InteractionType;
  summary: string;
  /** Duration in minutes, when relevant (calls/visits). */
  durationMin?: number;
  /** User id of the author. */
  createdBy: string;
  createdAt: string;
}

export type TaskType = "call" | "visit" | "follow_up" | "quote" | "other";
export type TaskStatus = "pending" | "done" | "cancelled";

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  /** ISO due date. */
  dueDate: string;
  prospectId: string | null;
  assignedTo: string;
  createdAt: string;
}

export interface StageHistoryEntry {
  id: string;
  prospectId: string;
  from: Stage | null;
  to: Stage;
  changedBy: string;
  changedAt: string;
}

export interface FunnelDatum {
  stage: Stage;
  label: string;
  count: number;
  amount: number;
}

export interface MonthlyRevenueDatum {
  month: string;
  revenue: number;
}

export interface CommercialPerformance {
  userId: string;
  name: string;
  won: number;
}

export interface ProductDistributionDatum {
  product: ProductType;
  label: string;
  count: number;
}

/* ------------------------------------------------------------------ */
/* Insurance: partner companies, simulation (devis) & subscription     */
/* ------------------------------------------------------------------ */

/**
 * How a partner insurer is integrated.
 * - `api`    : real-time tarification/souscription API (e.g. Askia, NSIA).
 * - `portal` : quote & subscription handled on the insurer's web portal;
 *              the CRM prepares the file and tracks the submission status.
 */
export type IntegrationMode = "api" | "portal";

export interface Insurer {
  id: string;
  name: string;
  /** Short label for badges/columns, e.g. "Askia". */
  shortName: string;
  products: ProductType[];
  integrationMode: IntegrationMode;
  /** Broker commission rate on the net premium, 0..1. */
  commissionRate: number;
  active: boolean;
}

/* --- Auto product risk model --------------------------------------- */

export type AutoUsage = "personal" | "business" | "transport" | "goods";
export type AutoFuel = "essence" | "diesel" | "hybride" | "electrique";
/** Coverage level, from mandatory RC to comprehensive. */
export type AutoFormula = "rc" | "tiers_plus" | "tous_risques";

export interface AutoRiskData {
  /** Puissance fiscale (CV). */
  fiscalPower: number;
  /** Nombre de places. */
  seats: number;
  firstRegistrationYear: number;
  fuel: AutoFuel;
  /** Valeur vénale in FCFA (drives dommages/vol premiums). */
  marketValue: number;
  usage: AutoUsage;
  /** Ancienneté du permis in years. */
  licenseYears: number;
  formula: AutoFormula;
  /**
   * Insurer-specific referential selections (currently Askia): vehicle category
   * (`cat`), sub-category (`scatCode`) and an optional commercial pack (`pck`).
   * When a pack is set, it drives pricing instead of the formula guarantees.
   */
  category?: string;
  subCategory?: string;
  packCode?: string;
  /**
   * Explicit per-guarantee selection (Askia). When present, it overrides the
   * generic formula → flags mapping. Ignored when a pack is set.
   */
  guarantees?: AutoGuarantees;
}

/** Individual auto guarantees, matching Askia's tarif flags. */
export interface AutoGuarantees {
  /** Défense & recours (recour). */
  recour: boolean;
  vol: boolean;
  /** Incendie (inc). */
  inc: boolean;
  /** Personnes transportées (pt). */
  pt: boolean;
  /** Bris de glace (gb). */
  gb: boolean;
}

/* --- Other Askia products (MRH, voyage, rapatriement) -------------- */

/** Simulation products available (broader than the CRM's ProductType). */
export type SimProduct = "auto" | "mrh" | "voyage" | "rapatriement";

/** Multirisque habitation (bâtiment). */
export interface MrhRiskData {
  /** Valeur du contenu (cntn) in FCFA. */
  contentsValue: number;
  /** Nombre de pièces (nbreP). */
  rooms: number;
  /** Durée du contrat en mois (duree). */
  durationMonths: number;
}

export interface VoyageRiskData {
  /** Zone de destination (zn), Askia zone code. */
  zone: string;
  /** Durée du voyage en jours (duree). */
  durationDays: number;
}

export interface RapatriementRiskData {
  /** Formule (formule): "01" individuel, "02" famille. */
  formula: string;
  /** Adultes supplémentaires (adultesupl). */
  extraAdults: number;
  /** Enfants supplémentaires (enfantsupl). */
  extraChildren: number;
  /** Personnes de plus de 80 ans (nbreAges). */
  seniors: number;
}

/* --- Quote (devis) ------------------------------------------------- */

export interface QuoteGuarantee {
  label: string;
  included: boolean;
}

/** A single insurer's priced offer for a given risk & formula. */
export interface QuoteOption {
  insurerId: string;
  formula: AutoFormula;
  /** Prime nette (before taxes & fees). */
  netPremium: number;
  taxes: number;
  fees: number;
  totalPremium: number;
  guarantees: QuoteGuarantee[];
  /** Number of days the quote stays valid. */
  validityDays: number;
  /** Mirrors the insurer's mode so the UI can flag instant vs portal. */
  integrationMode: IntegrationMode;
}

export interface Quote {
  id: string;
  prospectId: string;
  product: "auto";
  risk: AutoRiskData;
  options: QuoteOption[];
  createdBy: string;
  createdAt: string;
}

/* --- Contract (souscription) --------------------------------------- */

export type PaymentMethod = "wave" | "orange_money" | "cash" | "card";
export type PaymentStatus = "pending" | "paid";

/**
 * - `active`             : policy issued (API insurers issue instantly).
 * - `pending_submission` : file transmitted to a portal insurer, awaiting issuance.
 */
export type ContractStatus =
  | "active"
  | "pending_submission"
  | "rejected"
  | "cancelled";

export interface Contract {
  id: string;
  quoteId: string;
  prospectId: string;
  insurerId: string;
  formula: AutoFormula;
  totalPremium: number;
  /** ISO date the cover starts. */
  effectiveDate: string;
  /** ISO date the cover ends (typically +1 year). */
  expiryDate: string;
  status: ContractStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Issued by the insurer (API) — absent while pending on a portal. */
  policyNumber?: string;
  attestationNumber?: string;
  createdBy: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Objectives & performance (cascading targets + declared realizations) */
/* ------------------------------------------------------------------ */

/** A revenue target for a user over a period (format "YYYY-MM"). */
export interface Objective {
  id: string;
  /** User the target applies to (a manager, or a commercial). */
  userId: string;
  period: string;
  targetAmount: number;
  /** User id who set the target (admin → manager, manager → commercial). */
  setBy: string;
  createdAt: string;
}

/**
 * A realization is self-declared by a commercial (e.g. a life subscription
 * completed on the NSIA portal) and validated by their manager before it counts
 * toward the realized revenue.
 */
export type RealizationStatus = "pending" | "validated" | "rejected";

export interface Realization {
  id: string;
  commercialId: string;
  period: string;
  amount: number;
  product: ProductType;
  /** Where the subscription was made, e.g. "nsia". */
  source: string;
  /** Optional external reference (NSIA proposition number, note…). */
  reference?: string;
  status: RealizationStatus;
  declaredBy: string;
  validatedBy?: string;
  createdAt: string;
  validatedAt?: string;
}
