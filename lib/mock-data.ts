import type {
  AutoFormula,
  AutoRiskData,
  City,
  CommercialPerformance,
  Contract,
  FunnelDatum,
  Insurer,
  Interaction,
  InteractionType,
  MonthlyRevenueDatum,
  ProductDistributionDatum,
  ProductType,
  Prospect,
  QuoteOption,
  Stage,
  StageHistoryEntry,
  Task,
  TaskStatus,
  TaskType,
  User,
} from "@/lib/types";
import { PRODUCT_LABELS, STAGE_LABELS } from "@/lib/constants";
import { SENEGAL_CITIES } from "@/lib/types";
import { getConnector } from "@/lib/insurers/connector";

/**
 * Deterministic mock dataset for the Sirius CRM prototype.
 * A seeded PRNG keeps ids and relations stable across reloads so routing works,
 * while all dates are anchored to "now" to stay fresh.
 */

/* ------------------------------------------------------------------ */
/* Seeded pseudo-random helpers                                        */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260628);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/* ------------------------------------------------------------------ */
/* Date helpers (anchored to now, day granularity)                     */
/* ------------------------------------------------------------------ */

const NOW = new Date();

function startOfToday(): Date {
  const d = new Date(NOW);
  d.setHours(9, 0, 0, 0);
  return d;
}

function daysAgo(n: number, hour = 10): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hour, randInt(0, 59), 0, 0);
  return d.toISOString();
}

function daysFromNow(n: number, hour = 10): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

const AGENCY = "Agence Dakar Plateau";

export const users: User[] = [
  {
    id: "u-admin-1",
    name: "Mamadou Diallo",
    email: "mamadou.diallo@siriusassurances.com",
    phone: "+221 77 123 45 67",
    role: "admin",
    managerId: null,
    agency: AGENCY,
    active: true,
    lastLoginAt: daysAgo(0, 8),
  },
  {
    id: "u-admin-2",
    name: "Aïssatou Sow",
    email: "aissatou.sow@siriusassurances.com",
    phone: "+221 77 234 56 78",
    role: "admin",
    managerId: null,
    agency: AGENCY,
    active: true,
    lastLoginAt: daysAgo(1, 17),
  },
  {
    id: "u-mgr-1",
    name: "Ousmane Ndiaye",
    email: "ousmane.ndiaye@siriusassurances.com",
    phone: "+221 77 345 67 89",
    role: "manager",
    managerId: null,
    agency: AGENCY,
    active: true,
    lastLoginAt: daysAgo(0, 9),
  },
];

const commercialNames = [
  "Fatou Bâ",
  "Ibrahima Fall",
  "Awa Gueye",
  "Cheikh Mbaye",
  "Mariama Cissé",
  "Modou Sarr",
  "Ndèye Faye",
  "Abdoulaye Diop",
  "Khady Niang",
];

const commercials: User[] = commercialNames.map((name, i) => {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, ".");
  return {
    id: `u-com-${i + 1}`,
    name,
    email: `${slug}@siriusassurances.com`,
    phone: `+221 77 ${randInt(400, 799)} ${randInt(10, 99)} ${randInt(10, 99)}`,
    role: "commercial" as const,
    managerId: "u-mgr-1",
    agency: AGENCY,
    active: i !== 8, // last commercial is inactive to exercise the UI
    lastLoginAt: i % 4 === 0 ? daysAgo(randInt(3, 9), 14) : daysAgo(randInt(0, 2), 11),
  };
});

users.push(...commercials);

const commercialIds = commercials.map((c) => c.id);

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

/* ------------------------------------------------------------------ */
/* Prospects                                                           */
/* ------------------------------------------------------------------ */

const firstNamesM = [
  "Moussa",
  "Babacar",
  "Lamine",
  "Pape",
  "Serigne",
  "Alioune",
  "Samba",
  "Ass",
  "Birame",
  "Daouda",
];
const firstNamesF = [
  "Coumba",
  "Rokhaya",
  "Sokhna",
  "Bineta",
  "Adama",
  "Dieynaba",
  "Yacine",
  "Maïmouna",
  "Fatima",
  "Aminata",
];
const lastNames = [
  "Diop",
  "Ndiaye",
  "Fall",
  "Gaye",
  "Sy",
  "Kane",
  "Diallo",
  "Sarr",
  "Mbaye",
  "Sène",
  "Thiam",
  "Camara",
  "Diouf",
  "Ba",
  "Touré",
];

const allProducts: ProductType[] = ["auto", "mrh", "sante", "vie", "iard"];

function makeName(): string {
  const isMale = rand() > 0.5;
  const first = isMale ? pick(firstNamesM) : pick(firstNamesF);
  return `${first} ${pick(lastNames)}`;
}

function makePhone(): string {
  const prefix = pick(["70", "76", "77", "78"]);
  return `+221 ${prefix} ${randInt(100, 999)} ${randInt(10, 99)} ${randInt(10, 99)}`;
}

function makeProducts(): ProductType[] {
  const count = randInt(1, 2);
  const set = new Set<ProductType>();
  while (set.size < count) {
    set.add(pick(allProducts));
  }
  return [...set];
}

// Stage distribution required by the brief.
const stagePlan: Stage[] = [
  ...Array<Stage>(15).fill("lead"),
  ...Array<Stage>(10).fill("qualified"),
  ...Array<Stage>(8).fill("quoted"),
  ...Array<Stage>(7).fill("won"),
  ...Array<Stage>(5).fill("lost"),
];

const lostReasons = [
  "Prime jugée trop élevée",
  "A choisi un concurrent",
  "Plus de besoin pour le moment",
  "Injoignable après plusieurs relances",
  "Dossier non éligible",
];

export const prospects: Prospect[] = stagePlan.map((stage, i) => {
  const createdDaysAgo = randInt(2, 60);
  const lastActivityDaysAgo = Math.min(createdDaysAgo, randInt(0, 20));
  const premium = randInt(1, 40) * 50_000; // 50k -> 2M FCFA
  const prospect: Prospect = {
    id: `p-${(i + 1).toString().padStart(3, "0")}`,
    name: makeName(),
    phone: makePhone(),
    email: "",
    cni: `${randInt(1, 2)} ${randInt(100, 999)} ${randInt(1900, 2005)} ${randInt(10000, 99999)}`,
    address: `${randInt(1, 200)} ${pick(["Rue", "Avenue", "Cité", "Boulevard"])} ${pick(lastNames)}`,
    city: pick(SENEGAL_CITIES) as City,
    products: makeProducts(),
    estimatedPremium: premium,
    stage,
    assignedTo: pick(commercialIds),
    notes: "",
    createdAt: daysAgo(createdDaysAgo, 9),
    lastActivityAt: daysAgo(lastActivityDaysAgo, randInt(9, 18)),
  };
  const emailSlug = prospect.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, ".");
  prospect.email = `${emailSlug}@gmail.com`;
  if (stage === "lost") {
    prospect.lostReason = pick(lostReasons);
  }
  return prospect;
});

export function getProspectById(id: string): Prospect | undefined {
  return prospects.find((p) => p.id === id);
}

/* ------------------------------------------------------------------ */
/* Interactions                                                        */
/* ------------------------------------------------------------------ */

const interactionTemplates: Record<InteractionType, string[]> = {
  call: [
    "Appel de prise de contact, client intéressé",
    "Relance téléphonique, à rappeler la semaine prochaine",
    "Discussion sur les garanties souhaitées",
  ],
  visit: [
    "Visite à domicile pour évaluer le besoin",
    "Rendez-vous en agence, présentation des offres",
    "Visite de suivi, signature à prévoir",
  ],
  note: [
    "Client demande un délai de réflexion",
    "Note interne : dossier à compléter (CNI manquante)",
    "Prospect recommandé par un client existant",
  ],
  whatsapp: [
    "Envoi de la brochure produit via WhatsApp",
    "Échange WhatsApp sur les modalités de paiement",
    "Partage du devis en PDF",
  ],
  sms: [
    "SMS de rappel de rendez-vous",
    "SMS de confirmation de réception du dossier",
    "Relance SMS automatique",
  ],
};

const interactionTypes: InteractionType[] = [
  "call",
  "visit",
  "note",
  "whatsapp",
  "sms",
];

export const interactions: Interaction[] = Array.from({ length: 60 }, (_, i) => {
  const prospect = pick(prospects);
  const type = pick(interactionTypes);
  const needsDuration = type === "call" || type === "visit";
  return {
    id: `i-${(i + 1).toString().padStart(3, "0")}`,
    prospectId: prospect.id,
    type,
    summary: pick(interactionTemplates[type]),
    durationMin: needsDuration ? randInt(5, 45) : undefined,
    createdBy: prospect.assignedTo,
    createdAt: daysAgo(randInt(0, 29), randInt(9, 18)),
  };
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function getInteractionsForProspect(prospectId: string): Interaction[] {
  return interactions
    .filter((it) => it.prospectId === prospectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

const taskTypes: TaskType[] = ["call", "visit", "follow_up", "quote", "other"];

const taskTitles: Record<TaskType, string[]> = {
  call: ["Appeler le prospect", "Rappeler pour le devis", "Appel de relance"],
  visit: ["Visite à planifier", "Rendez-vous en agence", "Visite de signature"],
  follow_up: ["Relancer le prospect", "Suivi du dossier", "Relancer après devis"],
  quote: ["Préparer le devis", "Envoyer la proposition", "Réviser le devis"],
  other: ["Compléter le dossier", "Vérifier les pièces", "Mettre à jour les infos"],
};

export const tasks: Task[] = Array.from({ length: 30 }, (_, i) => {
  const prospect = pick(prospects);
  const type = pick(taskTypes);
  // Due between yesterday (-1) and +14 days.
  const dueOffset = randInt(-1, 14);
  // Bias statuses toward pending so the board feels active.
  const statusRoll = rand();
  let status: TaskStatus;
  if (statusRoll < 0.6) status = "pending";
  else if (statusRoll < 0.85) status = "done";
  else status = "cancelled";
  // Tasks in the future are always pending.
  if (dueOffset > 1 && status === "done") status = "pending";
  return {
    id: `t-${(i + 1).toString().padStart(3, "0")}`,
    title: pick(taskTitles[type]),
    description: "",
    type,
    status,
    dueDate:
      dueOffset < 0 ? daysAgo(Math.abs(dueOffset), 12) : daysFromNow(dueOffset, 12),
    prospectId: prospect.id,
    assignedTo: prospect.assignedTo,
    createdAt: daysAgo(randInt(1, 10), 9),
  };
});

export function getTasksForProspect(prospectId: string): Task[] {
  return tasks
    .filter((t) => t.prospectId === prospectId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/* ------------------------------------------------------------------ */
/* Stage history                                                       */
/* ------------------------------------------------------------------ */

const stageOrder: Stage[] = ["lead", "qualified", "quoted", "won"];

export const stageHistory: StageHistoryEntry[] = [];

let historyCounter = 1;
for (const prospect of prospects) {
  if (prospect.stage === "lead") continue;

  // Build the path of stages this prospect went through.
  let path: Stage[];
  if (prospect.stage === "lost") {
    const lostFrom = pick(["lead", "qualified", "quoted"] as Stage[]);
    const idx = stageOrder.indexOf(lostFrom);
    path = [...stageOrder.slice(0, idx + 1), "lost"];
  } else {
    const idx = stageOrder.indexOf(prospect.stage);
    path = stageOrder.slice(0, idx + 1);
  }

  const createdAt = new Date(prospect.createdAt);
  let previous: Stage | null = null;
  path.forEach((stage, step) => {
    if (step === 0 && stage === "lead") {
      previous = "lead";
      return; // initial stage, not a transition
    }
    const changedDate = new Date(createdAt);
    changedDate.setDate(changedDate.getDate() + step * randInt(2, 6));
    stageHistory.push({
      id: `sh-${(historyCounter++).toString().padStart(3, "0")}`,
      prospectId: prospect.id,
      from: previous,
      to: stage,
      changedBy: prospect.assignedTo,
      changedAt: changedDate.toISOString(),
    });
    previous = stage;
  });
}

export function getStageHistoryForProspect(
  prospectId: string
): StageHistoryEntry[] {
  return stageHistory
    .filter((h) => h.prospectId === prospectId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}

/* ------------------------------------------------------------------ */
/* Dashboard aggregates                                                */
/* ------------------------------------------------------------------ */

export function buildFunnel(scopedProspects: Prospect[]): FunnelDatum[] {
  const order: Stage[] = ["lead", "qualified", "quoted", "won"];
  return order.map((stage) => {
    const items = scopedProspects.filter((p) => p.stage === stage);
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: items.length,
      amount: items.reduce((sum, p) => sum + p.estimatedPremium, 0),
    };
  });
}

export function buildMonthlyRevenue(
  scopedProspects: Prospect[]
): MonthlyRevenueDatum[] {
  const months: MonthlyRevenueDatum[] = [];
  const wonProspects = scopedProspects.filter((p) => p.stage === "won");
  for (let i = 5; i >= 0; i--) {
    const d = new Date(NOW);
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    // Distribute won premiums pseudo-deterministically across months.
    const base = wonProspects.reduce((sum, p, idx) => {
      return idx % 6 === (5 - i) % 6 ? sum + p.estimatedPremium : sum;
    }, 0);
    months.push({
      month: label.charAt(0).toUpperCase() + label.slice(1),
      revenue: base + randInt(2, 12) * 50_000,
    });
  }
  return months;
}

export function buildTopCommercials(
  scopedProspects: Prospect[]
): CommercialPerformance[] {
  const counts = new Map<string, number>();
  for (const p of scopedProspects) {
    if (p.stage === "won") {
      counts.set(p.assignedTo, (counts.get(p.assignedTo) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([userId, won]) => ({
      userId,
      name: getUserById(userId)?.name ?? "—",
      won,
    }))
    .sort((a, b) => b.won - a.won)
    .slice(0, 5);
}

export function buildProductDistribution(
  scopedProspects: Prospect[]
): ProductDistributionDatum[] {
  const counts = new Map<ProductType, number>();
  for (const p of scopedProspects) {
    for (const product of p.products) {
      counts.set(product, (counts.get(product) ?? 0) + 1);
    }
  }
  return allProducts.map((product) => ({
    product,
    label: PRODUCT_LABELS[product],
    count: counts.get(product) ?? 0,
  }));
}

/* ------------------------------------------------------------------ */
/* Partner insurers & simulation service                               */
/* ------------------------------------------------------------------ */

/**
 * Partner insurance companies. Askia and NSIA are integrated through their
 * real-time APIs; the others are handled via their web portals.
 */
export const insurers: Insurer[] = [
  {
    id: "ins-askia",
    name: "Askia Assurances",
    shortName: "Askia",
    products: ["auto", "mrh", "sante", "iard"],
    integrationMode: "api",
    commissionRate: 0.12,
    active: true,
  },
  {
    id: "ins-nsia",
    name: "NSIA Assurances",
    shortName: "NSIA",
    products: ["auto", "mrh", "sante", "vie", "iard"],
    integrationMode: "api",
    commissionRate: 0.14,
    active: true,
  },
  {
    id: "ins-sonam",
    name: "SONAM Assurances",
    shortName: "SONAM",
    products: ["auto", "mrh", "vie", "iard"],
    integrationMode: "portal",
    commissionRate: 0.1,
    active: true,
  },
  {
    id: "ins-axa",
    name: "AXA Assurances Sénégal",
    shortName: "AXA",
    products: ["auto", "mrh", "sante", "vie", "iard"],
    integrationMode: "portal",
    commissionRate: 0.13,
    active: true,
  },
  {
    id: "ins-amsa",
    name: "AMSA Assurances",
    shortName: "AMSA",
    products: ["auto", "iard"],
    integrationMode: "portal",
    commissionRate: 0.11,
    active: true,
  },
  {
    id: "ins-sunu",
    name: "SUNU Assurances",
    shortName: "SUNU",
    products: ["auto", "mrh", "sante", "vie"],
    integrationMode: "portal",
    commissionRate: 0.12,
    active: true,
  },
];

export function getInsurerById(id: string): Insurer | undefined {
  return insurers.find((i) => i.id === id);
}

/** Active insurers offering a given product. */
export function getInsurersForProduct(product: ProductType): Insurer[] {
  return insurers.filter((i) => i.active && i.products.includes(product));
}

/**
 * Run an auto simulation across every partner offering auto cover, through each
 * insurer's connector, and return the offers sorted from cheapest to priciest.
 */
export async function simulateAuto(
  risk: AutoRiskData,
  insurerIds?: string[],
): Promise<QuoteOption[]> {
  const insurers = getInsurersForProduct("auto").filter(
    (insurer) => !insurerIds || insurerIds.includes(insurer.id),
  );
  const options = await Promise.all(
    insurers.map((insurer) => getConnector(insurer).simulate(risk)),
  );
  return options.sort((a, b) => a.totalPremium - b.totalPremium);
}

/**
 * Seed subscriptions attached to won prospects, so the "Devis & contrats" tab
 * is populated out of the box. Consumed by the in-session subscriptions store.
 */
const SEED_FORMULAS: AutoFormula[] = ["rc", "tiers_plus", "tous_risques"];

export const seedContracts: Contract[] = prospects
  .filter((p) => p.stage === "won")
  .map((p, i) => {
    const insurer = insurers[i % insurers.length];
    const formula = SEED_FORMULAS[i % SEED_FORMULAS.length];
    const active = insurer.integrationMode === "api" || i % 3 !== 0;
    const createdAt = daysAgo(randInt(5, 40), randInt(9, 17));
    const effective = new Date(createdAt);
    const expiry = new Date(effective);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return {
      id: `ctr-seed-${(i + 1).toString().padStart(3, "0")}`,
      quoteId: `q-seed-${(i + 1).toString().padStart(3, "0")}`,
      prospectId: p.id,
      insurerId: insurer.id,
      formula,
      totalPremium: p.estimatedPremium,
      effectiveDate: effective.toISOString(),
      expiryDate: expiry.toISOString(),
      status: active ? "active" : "pending_submission",
      paymentMethod: pick(["wave", "orange_money", "cash", "card"] as const),
      paymentStatus: active ? "paid" : "pending",
      policyNumber: active
        ? `POL-${insurer.shortName.toUpperCase().slice(0, 3)}-${randInt(100000, 999999)}`
        : undefined,
      attestationNumber: active
        ? `ATT-${insurer.shortName.toUpperCase().slice(0, 3)}-${randInt(100000, 999999)}`
        : undefined,
      createdBy: p.assignedTo,
      createdAt,
    };
  });

export { startOfToday, NOW };
