import type { Contract } from "@/lib/types";
import { seedContracts } from "@/lib/mock-data";

/**
 * In-session subscriptions store.
 *
 * Prototype-only: contracts live in module memory, so a subscription created in
 * the simulation flow shows up in the prospect's "Devis & contrats" tab while
 * navigating the SPA. A full reload resets to the seeded data. A real backend
 * would replace this module without changing the calling components.
 */
let contracts: Contract[] = [...seedContracts];

export function getAllContracts(): Contract[] {
  return contracts;
}

export function getContractsForProspect(prospectId: string): Contract[] {
  return contracts
    .filter((c) => c.prospectId === prospectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addContract(contract: Contract): void {
  contracts = [contract, ...contracts];
}
