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
(ordre : `01` à `05`, puis `06_payroll.sql` pour la paie des commerciaux).

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
