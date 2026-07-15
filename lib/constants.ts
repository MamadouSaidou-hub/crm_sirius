import type {
  AutoFormula,
  AutoFuel,
  AutoUsage,
  ContractStatus,
  IntegrationMode,
  InteractionType,
  PaymentMethod,
  ProductType,
  RealizationStatus,
  SimProduct,
  Stage,
  TaskStatus,
  TaskType,
  UserRole,
} from "@/lib/types";
import type { BadgeProps } from "@/components/ui/badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export const STAGES: Stage[] = ["lead", "qualified", "quoted", "won", "lost"];

export const STAGE_LABELS: Record<Stage, string> = {
  lead: "Lead",
  qualified: "Qualifié",
  quoted: "Devis",
  won: "Gagné",
  lost: "Perdu",
};

export const STAGE_BADGE_VARIANT: Record<Stage, BadgeVariant> = {
  lead: "muted",
  qualified: "teal",
  quoted: "gold",
  won: "success",
  lost: "danger",
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  auto: "Auto",
  mrh: "MRH",
  sante: "Santé",
  vie: "Vie",
  iard: "IARD",
};

export const PRODUCTS = [
  "auto",
  "mrh",
  "sante",
  "vie",
  "iard",
] as const satisfies readonly ProductType[];

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  call: "Appel",
  visit: "Visite",
  note: "Note",
  whatsapp: "WhatsApp",
  sms: "SMS",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  call: "Appel",
  visit: "Visite",
  follow_up: "Relance",
  quote: "Devis",
  other: "Autre",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "En cours",
  done: "Terminée",
  cancelled: "Annulée",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  manager: "Manager",
  commercial: "Commercial",
};

export const ROLE_BADGE_VARIANT: Record<UserRole, BadgeVariant> = {
  admin: "gold",
  manager: "teal",
  commercial: "muted",
};

/* --- Insurance: simulation & subscription -------------------------- */

export const INTEGRATION_MODE_LABELS: Record<IntegrationMode, string> = {
  api: "API temps réel",
  portal: "Portail",
};

export const INTEGRATION_MODE_BADGE_VARIANT: Record<
  IntegrationMode,
  BadgeVariant
> = {
  api: "success",
  portal: "muted",
};

export const AUTO_USAGE_LABELS: Record<AutoUsage, string> = {
  personal: "Promenade / affaires perso",
  business: "Usage professionnel",
  transport: "Transport public (taxi/VTC)",
  goods: "Transport de marchandises",
};

export const AUTO_FUEL_LABELS: Record<AutoFuel, string> = {
  essence: "Essence",
  diesel: "Diesel",
  hybride: "Hybride",
  electrique: "Électrique",
};

export const SIM_PRODUCTS = [
  "auto",
  "mrh",
  "voyage",
  "rapatriement",
] as const satisfies readonly SimProduct[];

export const SIM_PRODUCT_LABELS: Record<SimProduct, string> = {
  auto: "Auto",
  mrh: "MRH / Bâtiment",
  voyage: "Voyage",
  rapatriement: "Rapatriement",
};

export const AUTO_FORMULA_LABELS: Record<AutoFormula, string> = {
  rc: "Responsabilité civile",
  tiers_plus: "Tiers +",
  tous_risques: "Tous risques",
};

export const AUTO_FORMULA_DESCRIPTIONS: Record<AutoFormula, string> = {
  rc: "Garantie minimale obligatoire (dommages causés aux tiers)",
  tiers_plus: "RC + vol, incendie, bris de glace, défense-recours",
  tous_risques: "Couverture complète, dont dommages tous accidents",
};

export const AUTO_FORMULAS = [
  "rc",
  "tiers_plus",
  "tous_risques",
] as const satisfies readonly AutoFormula[];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces",
  card: "Carte bancaire",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  active: "Actif",
  pending_submission: "En attente d'émission",
  rejected: "Rejeté",
  cancelled: "Annulé",
};

export const CONTRACT_STATUS_BADGE_VARIANT: Record<
  ContractStatus,
  BadgeVariant
> = {
  active: "success",
  pending_submission: "gold",
  rejected: "danger",
  cancelled: "muted",
};

/* --- Objectives & performance -------------------------------------- */

export const REALIZATION_STATUS_LABELS: Record<RealizationStatus, string> = {
  pending: "En attente",
  validated: "Validée",
  rejected: "Rejetée",
};

export const REALIZATION_STATUS_BADGE_VARIANT: Record<
  RealizationStatus,
  BadgeVariant
> = {
  pending: "gold",
  validated: "success",
  rejected: "danger",
};
