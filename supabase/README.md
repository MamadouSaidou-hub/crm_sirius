# Base de données Sirius CRM — Supabase

SQL à exécuter dans **Supabase → SQL Editor** (projet dédié Sirius).

## Ordre d'exécution (important)

1. **`01_schema.sql`** — enums, tables, index, triggers (profil auto à l'inscription).
2. **`02_rls.sql`** — sécurité par rôle (admin / manager / commercial).
3. **`03_seed_reference.sql`** — les 6 compagnies partenaires + liens NSIA.

Chaque fichier est **ré-exécutable** sans casser l'existant.

## Comment exécuter

- Ouvre **SQL Editor** → **New query**
- Colle le contenu d'un fichier → **Run**
- Passe au fichier suivant

## Créer le premier admin

1. **Authentication → Add user** (ou via l'inscription de l'app) → crée ton compte.
2. Un `profile` est créé automatiquement (rôle `commercial`).
3. Dans SQL Editor :
   ```sql
   update public.profiles set role = 'admin'
   where email = 'ton-email@exemple.com';
   ```
4. Les autres comptes (managers/commerciaux) : crée-les puis règle `role` et
   `manager_id` (les commerciaux doivent pointer vers leur manager).

## Règles de sécurité (RLS) appliquées

| Rôle       | Voit / gère                                  |
|------------|----------------------------------------------|
| admin      | tout                                         |
| manager    | son équipe (ses commerciaux) + lui-même      |
| commercial | uniquement ses propres données               |

Les compagnies (`insurers`) sont visibles par tous les connectés ; seules les
écritures sont réservées à l'admin.

## Étape suivante (hors SQL)

Ces fichiers créent **la base**. Il restera à **connecter l'application** à
Supabase (remplacer les données mockées par de vraies requêtes) :

- variables d'env : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (Project Settings → API), à mettre dans `.env.local` puis dans Vercel ;
- client `@supabase/ssr` + remplacement de `mock-data` / `mock-auth` / stores.

Récupère aussi la clé **service_role** (Project Settings → API) — **à garder
secrète**, jamais côté navigateur.
