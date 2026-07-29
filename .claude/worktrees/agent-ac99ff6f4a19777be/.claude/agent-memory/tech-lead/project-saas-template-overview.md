---
name: project-saas-template-overview
description: Vue d'ensemble du projet saas-template-single-tenant — monorepo pnpm/Turbo, 3 apps Next.js 16, packages auth/api/database/email/ui, recentré single-tenant après retrait du plugin better-auth organization.
metadata:
  type: project
---

**Stack** : pnpm 11 (catalogMode strict) + Turborepo 2.10 + Next.js 16 App Router + React 19.2 + Tailwind v4 + shadcn/ui (style radix-nova) + better-auth + Drizzle/Postgres + Hono + oRPC + Zod + Vitest 4.

**Apps** : `apps/app` (produit authentifié, catch-all Hono sur `/api/[[...route]]`), `apps/web` (marketing, blog/changelog via content-collections), `apps/docs` (Fumadocs).

**Packages clés** : `@workspace/auth` (instance better-auth unique), `@workspace/database` (Drizzle + postgres-js + lazy Proxy), `@workspace/api` (Hono + oRPC router), `@workspace/email` (transports Resend/Console + React Email), `@workspace/env` (Zod fail-fast + garde anti-leak serveur→client), `@workspace/cookies` (consentement RGPD Zustand), `@workspace/ui` (primitives shadcn centralisées).

**État single-tenant** : commits récents (831a000, 1369316) ont retiré le plugin organization de better-auth et la surface organisation de `apps/app`. L'ancien plan d'org est documenté dans `temp/audit/onboarding/README.md` (171 lignes) + `docs/guides/better-auth/org.md`, mais le code n'est pas migré.

**Conventions verrouillées** : `AGENTS.md` racine impose `node_modules/next/dist/docs/` avant tout code Next.js (Next 16 ≠ version de l'entraînement). Guides better-auth centralisés dans `docs/guides/better-auth/` (8 fichiers : index/setup/hooks/org/email/session/client/pitfalls).

**Why** : template destiné à être forké, donc la dette « TODO wire to better-auth » dans `apps/app/components/settings/*` et la duplication config prod/tests dans `packages/auth/tests/setup.ts` sont des choix assumés.

**How to apply** : avant toute modification, lire les guides better-auth correspondants et la note AGENTS.md. Présumer single-tenant sauf indication contraire. Voir [[reference-better-auth-guides]] et [[feedback-read-only-by-default]].