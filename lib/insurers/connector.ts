import type {
  AutoRiskData,
  Insurer,
  IntegrationMode,
  PaymentMethod,
  QuoteOption,
} from "@/lib/types";
import { guaranteesFor, rateAuto } from "@/lib/insurers/rating";

/**
 * Abstraction over a partner insurer. Every insurer — whether it exposes a
 * real-time API (Askia, NSIA) or is handled through its web portal — is reached
 * through this interface, so the CRM flow never branches on the integration
 * mode. Real API clients (e.g. Askia) implement this same contract.
 */
export interface SubscribeInput {
  insurer: Insurer;
  option: QuoteOption;
  effectiveDate: string;
  paymentMethod: PaymentMethod;
  /** Client display name, only used to make the mock response readable. */
  clientName: string;
}

export interface SubscribeResult {
  /** `active` when the insurer issues instantly, else `pending_submission`. */
  status: "active" | "pending_submission";
  policyNumber?: string;
  attestationNumber?: string;
  message: string;
}

export interface InsurerConnector {
  readonly insurerId: string;
  readonly mode: IntegrationMode;
  simulate(risk: AutoRiskData): Promise<QuoteOption>;
  subscribe(input: SubscribeInput): SubscribeResult;
}

function reference(prefix: string, insurer: Insurer): string {
  const stamp = Date.now().toString().slice(-6);
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${insurer.shortName.toUpperCase().slice(0, 3)}-${stamp}${rnd}`;
}

/**
 * Insurers with a real-time API: simulation and subscription resolve
 * immediately, returning an issued policy number and attestation. Pricing
 * defaults to the local rating grid unless a subclass overrides `simulate`.
 */
class ApiConnector implements InsurerConnector {
  readonly mode: IntegrationMode = "api";
  constructor(protected readonly insurer: Insurer) {}
  get insurerId() {
    return this.insurer.id;
  }
  async simulate(risk: AutoRiskData): Promise<QuoteOption> {
    return rateAuto(risk, this.insurer);
  }
  subscribe(_input: SubscribeInput): SubscribeResult {
    return {
      status: "active",
      policyNumber: reference("POL", this.insurer),
      attestationNumber: reference("ATT", this.insurer),
      message: `Police émise en temps réel par ${this.insurer.name}. Attestation disponible immédiatement.`,
    };
  }
}

/**
 * Portal insurers: we can still price locally, but subscription creates a file
 * that has to be validated on the insurer's portal, so no policy number yet.
 */
class PortalConnector implements InsurerConnector {
  readonly mode: IntegrationMode = "portal";
  constructor(private readonly insurer: Insurer) {}
  get insurerId() {
    return this.insurer.id;
  }
  async simulate(risk: AutoRiskData): Promise<QuoteOption> {
    return rateAuto(risk, this.insurer);
  }
  subscribe(_input: SubscribeInput): SubscribeResult {
    return {
      status: "pending_submission",
      message: `Dossier transmis au portail ${this.insurer.name}. En attente d'émission de la police (délai habituel : 24-48 h).`,
    };
  }
}

/**
 * Real Askia connector: prices via the server proxy that calls the ASKIA NET
 * API. Falls back to the local rating grid when the API key isn't configured or
 * the call fails, so the flow never breaks.
 */
class AskiaConnector extends ApiConnector {
  async simulate(risk: AutoRiskData): Promise<QuoteOption> {
    try {
      const res = await fetch("/api/insurers/askia/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "auto", risk }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.pricing) {
        const p = data.pricing;
        return {
          insurerId: this.insurer.id,
          formula: risk.formula,
          netPremium: p.netPremium,
          taxes: p.taxes,
          fees: p.fees,
          totalPremium: p.totalPremium,
          guarantees: guaranteesFor(risk.formula),
          validityDays: 30,
          integrationMode: "api",
        };
      }
    } catch {
      // network/parsing issue — fall through to the local grid
    }
    return rateAuto(risk, this.insurer);
  }
}

/** Resolve the connector for an insurer. */
export function getConnector(insurer: Insurer): InsurerConnector {
  if (insurer.id === "ins-askia") {
    return new AskiaConnector(insurer);
  }
  return insurer.integrationMode === "api"
    ? new ApiConnector(insurer)
    : new PortalConnector(insurer);
}
