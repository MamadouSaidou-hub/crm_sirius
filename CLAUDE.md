# SIRIUS CRM — Prototype Frontend

Tu vas créer un prototype frontend complet pour un CRM de courtage en assurance. Pas de backend, pas de Supabase, pas d'API. Juste du Next.js avec des données mockées en mémoire. L'objectif est d'avoir toutes les pages navigables et interactives pour valider le design et l'UX.

---

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript strict
- Tailwind CSS
- shadcn/ui (installer les composants au fur et à mesure)
- @tanstack/react-table
- @dnd-kit/core + @dnd-kit/sortable (Kanban)
- recharts (dashboards)
- lucide-react (icônes)
- sonner (toasts)
- date-fns
- react-hook-form + zod
- next-themes (dark mode par défaut)
- cmdk (palette Cmd+K)

## Branding

Thème dark par défaut. Couleurs dans `tailwind.config.ts` :

```ts
sirius: {
  navy:    '#0F131F',  // bg principal
  ink:     '#0A0D14',  // bg plus profond (sidebar)
  gold:    '#EAC14B',  // accent primaire, CTA, badges admin
  teal:    '#1FB8E0',  // secondaire, liens, badges manager
  muted:   '#1A1F2E',  // surfaces cards
  border:  '#2A3142',  // bordures
  text:    '#E5E7EB',  // texte principal
  subtext: '#9CA3AF',  // texte secondaire
  danger:  '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
}
```

Typo : Inter (sans-serif) par défaut. Poppins 600 uppercase pour les titres de section.
Logo : texte "SIRIUS" en Poppins bold gold + "CRM" en teal, pas de fichier image.
Radius : `0.5rem` global.

## Données mockées

Crée un fichier `lib/mock-data.ts` avec :

- **12 users** : 2 admins (Mamadou Diallo, Aissatou Sow), 1 manager (Ousmane Ndiaye), 9 commerciaux (noms sénégalais réalistes). Chaque commercial a `manager_id` pointant vers Ousmane.
- **45 prospects** répartis : 15 lead, 10 qualified, 8 quoted, 7 won, 5 lost. Noms, téléphones (+221...), villes sénégalaises (Dakar, Thiès, Saint-Louis, Mbour, Kaolack, Ziguinchor), produits d'assurance (auto, mrh, sante, vie, iard), primes estimées (50 000 à 2 000 000 FCFA).
- **60 interactions** liées aux prospects (types variés : call, visit, note, whatsapp, sms), avec dates sur les 30 derniers jours.
- **30 tâches** (types : call, visit, follow_up, quote, other), statuts variés (pending, done, cancelled), dues entre hier et +14 jours.
- **Historique de stages** pour les prospects qui ne sont plus en `lead`.
- **Stats dashboard** : données pour les graphiques (funnel, CA par mois, conversion par commercial, répartition produits).

Toutes les dates sont relatives à `new Date()` pour que les données restent fraîches.

## Utilisateur simulé

Crée un fichier `lib/mock-auth.ts` avec un hook `useMockUser()` qui retourne l'utilisateur courant. Par défaut c'est l'admin Mamadou Diallo. Ajoute un **sélecteur de rôle** discret en bas de la sidebar (dropdown : admin, manager, commercial) pour tester la même UI avec différentes permissions sans recharger. Quand on switch :
- admin → voit tout
- manager → voit ses 9 commerciaux + ses propres données
- commercial → voit ses propres prospects/tâches uniquement

Ce sélecteur est visuellement distinct (bordure dorée pointillée + label "Mode test") pour qu'on sache que c'est du debug.

## Pages à créer

### 1. Login (`/login`)
- Centré, card sombre, logo Sirius CRM en haut
- Champs email + password + bouton "Se connecter" gold
- Le bouton redirige vers `/dashboard` sans aucune vérification (prototype)
- Texte sous le form : "Cabinet de courtage agréé — Dakar, Sénégal"

### 2. Layout principal (`/(app)/layout.tsx`)
- **Sidebar gauche** (fixe, 280px desktop, collapsible sur tablette, drawer sur mobile)
  - Logo SIRIUS CRM en haut
  - Navigation :
    - 📊 Tableau de bord (`/dashboard`)
    - 👥 Prospects (`/prospects`)
    - 📋 Pipeline (`/prospects/kanban`)
    - ✅ Tâches (`/tasks`)
    - 👤 Équipe (`/users`) — visible seulement si admin ou manager
    - ⚙️ Paramètres (`/settings`)
  - Sélecteur de rôle en bas (mode test)
  - Infos user connecté + bouton déconnexion

- **Topbar** :
  - Breadcrumb
  - Recherche globale (ouvre palette Cmd+K)
  - Icône notifications (badge count)
  - Avatar user

- **Content area** : padding, max-width 1400px centré

### 3. Tableau de bord (`/dashboard`)

#### Vue Admin/Manager
4 cards stats en haut :
- Total prospects (icône Users)
- Taux de conversion lead→won (icône TrendingUp, pourcentage)
- CA estimé pipeline (icône Banknote, format "X M FCFA")
- Tâches en retard (icône AlertTriangle, rouge si > 0)

3 graphiques (recharts, thème sombre cohérent) :
- **Funnel** : bar chart horizontal (lead → qualified → quoted → won)
- **CA mensuel** : line chart 6 derniers mois
- **Top 5 commerciaux** : bar chart horizontal (nombre de prospects won)

Tableau "Dernières activités" : 10 dernières interactions, avec avatar commercial + type + prospect + date relative

#### Vue Commercial
- Mes stats personnelles (mes prospects par stage, mon CA estimé, mes tâches du jour)
- Mon funnel personnel
- Mes prochaines tâches (5 prochaines)

### 4. Liste prospects (`/prospects`)
- **Barre de filtres** en haut : recherche texte (nom/tel/email), select stage, select commercial assigné (admin/manager), select produit, date range
- **TanStack Table** : colonnes = Nom, Téléphone, Ville, Produit (badges), Prime estimée (FCFA formaté), Stage (badge coloré), Assigné à, Dernière activité (date relative), Actions (dropdown)
- Tri cliquable sur les headers
- Pagination en bas (25 par page)
- Bouton "Nouveau prospect" en haut à droite (gold)
- Bouton "Exporter CSV" à côté (visible admin/manager seulement, toast "Export simulé")
- **Responsive** : sur mobile/tablette, la table devient des cards empilées

### 5. Création/édition prospect (`/prospects/new`, `/prospects/[id]/edit`)
- Form pleine page (pas modal) avec sections :
  - **Identité** : nom*, téléphone, email, CNI, adresse, ville (select villes sénégalaises)
  - **Besoin assurance** : produits intéressés (multi-select chips), prime estimée (input number FCFA)
  - **Assignation** : select commercial (admin/manager choisit, commercial = lui-même readonly)
  - **Notes** : textarea
- Validation zod côté client
- Boutons : Annuler (ghost) + Enregistrer (gold)
- Sur soumission : toast succès + redirect vers `/prospects/[id]`

### 6. Détail prospect (`/prospects/[id]`)
- **Header** : nom + téléphone + email + ville + badge stage (avec select pour changer le stage inline) + bouton "Modifier"
  - Si on passe en "lost" → modal demandant le motif obligatoire
  - Si on passe en "won" → confetti ou toast de célébration
- **Cards métriques** : prime estimée, nombre d'interactions, jours dans le pipeline, dernière activité
- **Tabs** (shadcn Tabs) :
  - **Interactions** : timeline verticale chronologique inversée (plus récent en haut). Chaque item : icône type + titre + résumé + date + avatar créateur. Bouton "Ajouter" → modal form (type, résumé, durée optionnelle)
  - **Tâches** : liste avec checkbox pour marquer done, badge statut, due date (rouge si overdue). Bouton "Ajouter" → modal form
  - **Historique** : liste des changements de stage (from → to, date, par qui). Read-only, pas de bouton

### 7. Pipeline Kanban (`/prospects/kanban`)
- 5 colonnes : Lead, Qualifié, Devis, Gagné, Perdu
- Header colonne : nom + count + montant total estimé
- **Cards** draggables (`@dnd-kit`) : nom, téléphone, prime, produit (badge), avatar assigné, date création relative
- Drag d'une colonne à l'autre → toast "Stage mis à jour"
- Drag vers "Perdu" → modal motif (même que dans le détail)
- Filtre en haut : select commercial (admin/manager), ou "Tous"
- Colonnes "Gagné" et "Perdu" visuellement distinctes (fond vert/rouge subtil)
- **Responsive** : sur mobile, les colonnes scrollent horizontalement

### 8. Tâches (`/tasks`)
- **3 sections** :
  - En retard (rouge, triées par date la plus ancienne)
  - Aujourd'hui
  - À venir (7 prochains jours, groupées par jour)
- Chaque tâche : checkbox + titre + prospect lié (lien cliquable) + type (badge) + due date + assigné à
- Clic checkbox → animation strikethrough + toast "Tâche complétée"
- Bouton "Nouvelle tâche" → modal form (titre, description, type, due date, prospect lié select, assigné à)
- Filtre : tous / mes tâches / par commercial (admin/manager)

### 9. Gestion équipe (`/users`)
- Visible admin + manager seulement
- **Table** : avatar + nom, email, rôle (badge), manager, agence, statut (actif/inactif badge), dernière connexion
- Bouton "Inviter" → modal form (email, nom, rôle, manager select, agence, téléphone)
  - Validation : commercial doit avoir un manager, format téléphone +221
  - Sur soumission : toast "Invitation envoyée (simulée)"
- Dropdown actions : Modifier, Désactiver/Activer, Renvoyer invitation
- Modal édition : mêmes champs que création

### 10. Paramètres (`/settings`)
- Card "Mon profil" : nom, email, téléphone (readonly sauf admin sur les autres)
- Card "Synchronisation" : statut fictif "Dernière sync : il y a 3 min", bouton "Forcer la sync" (toast)
- Card "Notifications" : toggles fictifs (email, push, rappels tâches)
- Card "À propos" : version 0.1.0, "Sirius Assurances © 2026", lien siriusassurances.com

### 11. Palette de commandes (Cmd+K)
- Montée dans le layout principal
- Raccourci `Cmd+K` / `Ctrl+K`
- Recherche dans : prospects (nom, téléphone), pages (dashboard, prospects, kanban, tâches, équipe)
- Résultats groupés : "Prospects" et "Pages"
- Sélection → navigation

### 12. Page 403
- Si un commercial tape `/users` → page 403 propre avec illustration, message "Accès restreint", bouton retour dashboard

### 13. Page 404
- Page 404 propre avec message, bouton retour dashboard

## Responsive

Le prototype doit être **parfaitement utilisable sur tablette** (768px–1024px) et **consultable sur mobile** (< 768px) :
- Sidebar : collapsible sur tablette (icônes seules), drawer sur mobile
- Tables → cards sur mobile
- Kanban → scroll horizontal sur mobile
- Forms → full width sur mobile
- Dashboard cards → 2 colonnes tablette, 1 mobile

## Qualité du code

- TypeScript strict, zéro `any`
- Composants bien découpés, un fichier = un composant
- Imports absolus `@/`
- Nommage : `kebab-case` fichiers, `PascalCase` composants, `camelCase` fonctions
- Commentaires en anglais
- Pas de `console.log`
- Code production-ready même si c'est un prototype (on va réutiliser les composants)

## Ordre d'exécution

1. Init Next.js + Tailwind + shadcn + thème Sirius + fonts
2. `lib/mock-data.ts` + `lib/mock-auth.ts` + types
3. Layout : sidebar + topbar + breadcrumb
4. Login
5. Dashboard
6. Liste prospects + filtres + table
7. Détail prospect + tabs
8. Formulaire création/édition prospect
9. Pipeline Kanban
10. Tâches
11. Gestion équipe
12. Paramètres
13. Palette Cmd+K
14. Pages 403/404
15. Polish responsive

Présente ton plan, attends mon GO.