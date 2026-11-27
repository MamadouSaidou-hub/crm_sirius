# SIRIUS CRM

CRM de courtage en assurance (Next.js 16, React 19, Supabase).

## Infrastructure

| Élément | Valeur |
|---|---|
| Compte Supabase | **ms.diallo@afriaisolutions.com** |
| Organisation / projet Supabase | `Mon_space_perso` (Free) / `crm_sirius`, région eu-west-1 |
| Projet Supabase (ref) | `pjcgskzgkrvbrdiqldrc` |
| Dashboard | https://supabase.com/dashboard/project/pjcgskzgkrvbrdiqldrc |
| Production | https://crm-sirius-five.vercel.app (Vercel) |
| Dépôt GitHub | `MamadouSaidou-hub/crm_sirius` |

> Ne pas confondre avec le projet `sirius_assurance` de l'organisation
> `tresorerie-famille` : il appartient à l'ancienne mini-app de paie, pas au CRM.

Les clés (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, clé `service_role`)
sont dans `.env.local` (non versionné) et dans les variables d'environnement Vercel.
Les scripts SQL à exécuter dans le SQL Editor sont décrits dans [supabase/README.md](./supabase/README.md)
(ordre : `01` à `05`, puis `06_payroll.sql` pour la paie des commerciaux, `07_commission_agreements.sql`
pour les taux datés, `08_product_catalog.sql` pour le catalogue de produits et les taux par produit,
puis `09_iard_policies.sql` pour les polices IARD : commission par police, part des accessoires par convention,
`10_roles.sql` pour les rôles `super_admin` et `gestionnaire`, `11_security.sql` pour le journal d'audit
et le verrou des profils, puis `12_payroll_closing.sql` pour la clôture mensuelle de la paie).

## Clôture mensuelle

Un mois terminé peut être clôturé (admin / DG) depuis la page Paie : ses totaux sont figés et la base refuse
ensuite toute création, modification ou suppression de contrat, versement ou police dans ce mois. Seul le
super admin peut rouvrir un mois. Clôture et réouverture sont tracées dans `audit_log`.

## Sécurité

- **Base de données** : RLS activée partout ; les droits sont appliqués par la base, pas seulement par l'interface.
- **Journal d'audit** (`audit_log`) : toute modification de la paie, des taux, des produits et des rôles est
  tracée (auteur, date, avant, après), sans possibilité de modifier ni effacer. Lecture : admin / super admin.
- **Rôles** : seul le super admin attribue ou retire le rôle admin ; un utilisateur ne peut pas changer son propre rôle.
- **Serveur** : le client `service_role` est réservé au serveur (`server-only`) ; la création de compte revalide
  tous les champs et impose 10 caractères minimum au mot de passe.
- **En-têtes HTTP** : anti-framing, `nosniff`, HSTS, politique de référent (voir `next.config.ts`).
- **Dépendances** : lancer `npm audit --omit=dev` régulièrement ; Next.js est maintenu à jour.
- **À régler dans Supabase** (Authentication) : désactiver l'inscription publique, activer l'authentification
  à deux facteurs pour les comptes admin.

## Rôles

| Rôle | Droits |
|---|---|
| `super_admin` (technicien) | tout, y compris créer des admins |
| `admin` (DG) | tout : taux, barèmes, paie, comptes (sauf admins) |
| `gestionnaire` | voit toute la paie ; saisit et modifie contrats, versements, polices de tous ; ne modifie pas les taux, ne supprime rien |
| `manager` | son équipe |
| `commercial` | ses propres données |

Les droits sont décrits dans `lib/permissions.ts` (affichage) et appliqués par la base dans
`supabase/10_roles.sql` (sécurité réelle). Après `10_roles.sql`, attribuer les deux rôles :
`update public.profiles set role = 'super_admin' where email = '…';` puis `… 'admin' …` pour le DG.

## Tests

```bash
npm test
```

Couvre le moteur de rémunération (`lib/payroll/engine.ts`).

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
