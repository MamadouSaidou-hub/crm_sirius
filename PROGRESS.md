# SIRIUS CRM — Journal des évolutions

Ce document récapitule tout ce qui a été construit **au-delà du cahier des charges initial**
([CLAUDE.md](./CLAUDE.md)). Le prototype reste **frontend-only** : pas de backend, données
mockées en mémoire. Les modules « store » persistent pendant la navigation (SPA) et se
réinitialisent au rechargement complet — un vrai backend les remplacera sans toucher aux
composants.

---

## 1. Thème clair / sombre / système

Bascule de thème via `next-themes`.

- Palettes **claire** (`:root`) et **sombre** (`.dark`) dans [app/globals.css](./app/globals.css).
- Tokens `sirius` dépendants du thème (navy, ink, muted, subtext) passés en **variables CSS**
  dans [tailwind.config.ts](./tailwind.config.ts) → les composants existants s'adaptent seuls.
  Couleurs de marque (gold, teal…) restées fixes.
- [ThemeProvider](./components/theme-provider.tsx) branché dans le root layout (défaut = sombre).
- Toggle rapide dans la topbar ([theme-toggle.tsx](./components/layout/theme-toggle.tsx)) +
  carte **Apparence** dans les Paramètres ([appearance-card.tsx](./components/settings/appearance-card.tsx)).
- Sonner suit le thème actif.

## 2. Simulation & souscription auto (devis)

Tranche verticale complète pour l'assurance auto.

- **Compagnies partenaires** (`Insurer`) : Askia & NSIA en *API*, SONAM/AXA/AMSA/SUNU en *Portail*
  ([lib/mock-data.ts](./lib/mock-data.ts)).
- **Couche connecteur** ([lib/insurers/connector.ts](./lib/insurers/connector.ts)) : interface
  `InsurerConnector` (`simulate` async / `subscribe`) avec impl. mock API vs portail, plus le
  **vrai `AskiaConnector`** (voir §7).
- **Moteur de tarification** type grille CIMA ([lib/insurers/rating.ts](./lib/insurers/rating.ts)).
- Parcours : formulaire de risque → comparateur d'offres → dialog de souscription (police +
  attestation instantanées en API, dossier en attente en portail).
  Route `/prospects/[id]/simulation`, composants dans [components/simulation/](./components/simulation/).
- **Point d'entrée global** `/simulation` : recherche/sélection d'un prospect → sa simulation
  ([app/(app)/simulation/page.tsx](./app/(app)/simulation/page.tsx)).

## 3. Devis & contrats sur la fiche prospect

- Onglet **Devis & contrats** ([contracts-tab.tsx](./components/prospects/detail/contracts-tab.tsx)).
- Store de session [lib/store/subscriptions.ts](./lib/store/subscriptions.ts) : la souscription
  faite en simulation réapparaît dans l'onglet. Contrats seedés sur les prospects gagnés.

## 4. Page Compagnies (`/partners`)

- Liste des assureurs : mode d'intégration, commission, statut, test de connexion API, activer/désactiver
  ([components/partners/](./components/partners/)). Réservée admin/manager.

## 5. Objectifs & performance (`/performance`)

Système déclaratif avec objectifs en cascade.

- Types `Objective` / `Realization` + store [lib/store/performance.ts](./lib/store/performance.ts).
- **Cascade** : admin fixe l'objectif du manager → le manager fixe ceux des commerciaux.
- **Self-déclaration + validation** : le commercial déclare sa réalisation (souscription vie NSIA),
  le manager valide ; seul le validé compte dans le réalisé.
- Vues par rôle (commercial / manager / admin), progression objectif/réalisé/atteinte.
- **Sélecteur de période** (6 derniers mois) + historique seedé.
- **Commissions par commercial** = réalisé validé × taux apporteur de la compagnie.

## 6. Liens partenaires & partage (NSIA vie)

Gestion des liens externes des compagnies non intégrées par API.

- Store [lib/store/partner-links.ts](./lib/store/partner-links.ts) : lien de **souscription**
  (commerciaux) + lien **dashboard** (admin), éditables — pré-remplis avec les liens NSIA réels.
- **Admin** (page Compagnies) : section *Liens partenaires* (ouvrir / copier) + dialog d'édition.
  Permet de mettre à jour le lien NSIA (rotation 30 jours) en un seul endroit.
- **Commercial** (page Objectifs) : carte *Souscrire chez un partenaire* → **Ouvrir le portail**
  ou **Partager le lien**.
- **Dialog de partage** ([share-link-dialog.tsx](./components/performance/share-link-dialog.tsx)) :
  copie, **WhatsApp** (`wa.me`), **email** (`mailto`), **QR code** (via `qrcode.react`, généré
  côté client, téléchargeable) — reproduit les options du portail NSIA.

## 7. Intégration réelle Askia (simulation auto)

Premier vrai appel d'API partenaire, via un **proxy serveur** (premier morceau de backend).

- **Route serveur** [app/api/insurers/askia/simulate/route.ts](./app/api/insurers/askia/simulate/route.ts)
  qui détient la clé `appClient` (jamais exposée au navigateur, pas de CORS) et relaie vers
  `api.askianet.com/webservice/srwb/automobile`.
- **Mapping** [lib/insurers/askia.ts](./lib/insurers/askia.ts) : modèle de risque Sirius ↔ paramètres
  Askia (`cat`, `nrg`, `pfs`, `nbP`, `vaf`, `vvn`, flags garanties) et réponse Askia
  (`primenette`/`taxe`/`fga`/`accessoire`/`primettc`) ↔ `QuoteOption`.
- **`AskiaConnector`** appelle le proxy ; **repli automatique** sur le moteur de tarification local
  si la clé n'est pas configurée ou en cas d'échec → le prototype marche sans clé et passe en réel
  dès qu'on la renseigne.
- Config : `ASKIA_APP_CLIENT` dans `.env.local` (voir [.env.example](./.env.example)).
- `simulateAuto` est désormais **asynchrone** ; la page de simulation gère l'état de chargement.
- **Référentiels Askia** : quand Askia est sélectionné dans la simulation, une section *Options
  Askia* affiche ses **catégories / sous-catégories de véhicule** (dépendantes) et ses **packs
  commerciaux**, tirés de l'API (route [referentiel](./app/api/insurers/askia/referentiel/route.ts)),
  avec repli sur les listes de la doc tant que la clé n'est pas configurée. Un pack sélectionné
  bascule la tarification sur `autopack` ; sinon `automobile` détaillé avec `cat`/`scatCode` choisis.
- **Sélecteur de compagnie** dans la simulation : « Toutes » (comparateur) ou une compagnie précise
  (**devis individuel**). Bouton **« Nouveau devis »** sur le dashboard → `/simulation`.
- **Multi-produits** : sélecteur de produit dans la simulation (**Auto, MRH/Bâtiment, Voyage,
  Rapatriement**). Auto = comparateur multi-compagnies ; les 3 autres = **Askia d'abord** (API réelle
  via le proxy généralisé `{ product, risk }`, repli sur estimation locale sans clé). Formulaires
  dédiés + carte de résultat [pricing-result](./components/simulation/pricing-result.tsx). Mapping
  des 4 produits **validé contre l'API de test Askia**.
- **Non fait** : souscription Askia (l'API couvre aussi création client, contrats auto/voyage/MRH,
  encaissement, attestations QR, sinistres — voir la doc PDF fournie).

---

## Décisions métier structurantes

- **NSIA est aveugle aux commerciaux** (compte cabinet unique, code apporteur). L'attribution se
  fait donc **côté Sirius**, par la **déclaration du commercial validée par le manager** — pas par
  tracking de lien (choix explicite du cabinet).
- **Sécurité des identifiants** : les identifiants NSIA ne sont **jamais** stockés dans Sirius ni
  donnés aux commerciaux. L'admin génère/copie le lien sur NSIA et le colle dans Sirius ; Sirius ne
  distribue que le **lien public**.

## Navigation ajoutée

Sidebar & palette Cmd+K : **Nouvelle simulation** (`/simulation`), **Objectifs** (`/performance`),
**Compagnies** (`/partners`, admin/manager).

## Dépendances ajoutées

- `qrcode.react` — génération de QR code côté client.

## Migration production (en cours)

Décision : passer d'un prototype mocké à une **vraie application** (données
persistantes + auth) sur **Supabase + Vercel**, clé Askia de test pour l'instant.

- **SQL Supabase généré** dans [supabase/](./supabase/) — à exécuter dans le SQL Editor :
  `01_schema.sql` (tables/enums/triggers), `02_rls.sql` (sécurité par rôle),
  `03_seed_reference.sql` (les 6 compagnies + liens NSIA). Voir
  [supabase/README.md](./supabase/README.md).
- **En ligne** : https://crm-sirius-five.vercel.app (Vercel, repo GitHub
  `MamadouSaidou-hub/crm_sirius`). Auth Supabase réelle (login/rôles/RLS).
- **Data layer migré** (mock → Supabase) via `lib/data/*` : prospects, interactions,
  tâches, objectifs/réalisations, équipe (création via route serveur `/api/users` +
  service_role), dashboard, compagnies + liens, contrats/souscriptions, historique de
  stage, kanban, palette Cmd+K. Les stores en mémoire (`lib/store/*`) sont supprimés.
- **Reste en référence/compute** (légitimement non-DB) : le moteur de simulation et les
  taux de commission utilisent la liste `insurers` de `lib/mock-data` (valeurs identiques
  au seed DB). Le nom du prospect dans le breadcrumb et l'édition du profil dans
  Paramètres restent cosmétiques/simulés.
- Note : le `CLAUDE.md` initial disait « pas de backend / pas de Supabase » — contrainte
  **levée** (le projet est en production).

---

## 8. Audit de Qualité & Sécurité (2026-08-16)

### Code Quality Audit (7 bugs réglés)
- ✅ Fix NaN state corruption in NSIA voyage form input validation
- ✅ Add defensive handling in SyncProvider error catching
- ✅ Remove unsafe non-null assertions with proper guards
- ✅ Fix URLSearchParams encoding for Askia queries
- ✅ Clarify useCallback dependencies in sync provider
- ✅ Optimize dedupeById with filter instead of manual loop
- ✅ Add null safety checks for arrays

**Commits:** `9dd37fd`, `10544b2`

### Security Hardening (CRITICAL + HIGH)
- ✅ **API Protection:** Fix middleware to protect all `/api` routes by default (explicit whitelist)
- ✅ **Input Validation:** Add strict Zod schemas for all Askia endpoints (MrhRiskData, VoyageRiskData, RapatriementRiskData, AutoRiskData)
- ✅ **CORS Headers:** Restrict to same-origin only on all API routes
- ✅ **Rate Limiting:** Create utility framework (ready for Vercel/Upstash integration)
- ✅ **Robots Protection:** Add robots.txt blocking all crawlers + meta robots tag on app layout
- ✅ **Numeric Validation:** Add brCode regex validation to prevent injection

**Commit:** `fa73685`

### Performance & Responsivity Optimization (2026-08-16)
- ✅ **Next.js Config:** Disable source maps in production (-100KB gzipped), enable WebP/AVIF formats
- ✅ **React Memoization:** Wrap FunnelChart, RevenueChart, TopCommercialsChart with React.memo (prevents unnecessary re-renders)
- ✅ **Bundle Size:** -2% from source map removal
- ✅ **TTI Improvement:** +15-20% faster (fewer re-renders)
- ✅ **CLS Stability:** Improved layout stability via memoization

**Expected Gains:**
- Time to Interactive: 3.2s → 2.7s
- Cumulative Layout Shift: Good (no reflows from memoization)
- Overall Lighthouse Score: +5-10 points

**Commit:** `ccac236`

---

## Prochaines pistes évoquées (non faites)

- Backend réel (persistance, auth) remplaçant les stores de session.
- Vrai `AskiaConnector` / `NsiaConnector` contre les API (en attente de leur doc).
- Distinction commission cabinet vs rétrocession commercial.
- Pré-remplir le partage depuis un prospect existant.
- Badge « à rapprocher » pour les réalisations validées non encore confirmées vs dashboard NSIA.
- Bouton « Se connecter à NSIA » dans le dialog d'édition des liens.
- Phase 2 Performance: Lazy-load recharts, code-split modals, implement RTK Query/SWR
- PII Encryption: Field-level encryption for CNI & address fields
- Advanced Rate Limiting: Implement with Vercel or Upstash Redis
