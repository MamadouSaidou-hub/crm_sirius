/**
 * In-session store for partner external links.
 *
 * Some insurers (e.g. NSIA Vie) aren't integrated by API: the cabinet gets a
 * shared subscription link that commercials use to subscribe directly on the
 * insurer's portal, plus a dashboard link for the broker to review production.
 *
 * These are stored centrally so the admin can update them in one place — the
 * NSIA share link rotates every 30 days — and every commercial always opens the
 * current one. A real backend would persist this unchanged for callers.
 */

export interface PartnerLinks {
  /** Portal link commercials use to subscribe directly (e.g. NSIA Vie). */
  subscriptionUrl?: string;
  /** Broker dashboard link (admin/manager access to the insurer's portal). */
  dashboardUrl?: string;
}

let links: Record<string, PartnerLinks> = {
  "ins-nsia": {
    subscriptionUrl: "https://samansiavie.sn/?ref=vfsb9hn",
    dashboardUrl: "https://smart.nsiavieassurances.sn/dashboard",
  },
};

export function getPartnerLinks(insurerId: string): PartnerLinks {
  return links[insurerId] ?? {};
}

export function setPartnerLinks(insurerId: string, next: PartnerLinks): void {
  links = {
    ...links,
    [insurerId]: {
      subscriptionUrl: next.subscriptionUrl?.trim() || undefined,
      dashboardUrl: next.dashboardUrl?.trim() || undefined,
    },
  };
}

/** Insurers that expose at least one external link. */
export function listPartnerLinks(): {
  insurerId: string;
  links: PartnerLinks;
}[] {
  return Object.entries(links)
    .filter(([, l]) => l.subscriptionUrl || l.dashboardUrl)
    .map(([insurerId, l]) => ({ insurerId, links: l }));
}

/** Subscription portals commercials can open, e.g. NSIA Vie. */
export function listSubscriptionPortals(): {
  insurerId: string;
  url: string;
}[] {
  return Object.entries(links)
    .filter(([, l]) => Boolean(l.subscriptionUrl))
    .map(([insurerId, l]) => ({ insurerId, url: l.subscriptionUrl as string }));
}
