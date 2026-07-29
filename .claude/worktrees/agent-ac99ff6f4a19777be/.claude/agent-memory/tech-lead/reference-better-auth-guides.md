---
name: reference-better-auth-guides
description: Index des guides better-auth internes à lire AVANT de toucher packages/auth ou packages/database/src/schema/auth.ts.
metadata:
  type: reference
---

**Point d'entrée obligatoire** : `docs/guides/better-auth/index.md` — décisions verrouillées + état du code.

Guides disponibles dans `docs/guides/better-auth/` :
- `setup.md` — config de base, drizzle-adapter, secrets, trustedOrigins
- `hooks.md` — databaseHooks, ordering, fire-and-forget
- `org.md` — Organization plugin, auto-create org, invitations, rôles *(désactivé single-tenant depuis 2026-07)*
- `email.md` — Email verification, password reset, Resend + console dev
- `session.md` — Session config, cookies, expiration, trustedOrigins
- `client.md` — Hooks React, useActiveOrganization, workaround #9710
- `pitfalls.md` — Bugs ouverts (#9070, #9710), options supprimées, gotchas — **à lire AVANT toute implémentation**

**Why** : better-auth évolue vite (issues #9070, #9710 ouvertes, options supprimées). Le projet verrouille ses choix dans `docs/guides/better-auth/` précisément pour éviter la dérive doc/code. Ne pas faire confiance à la mémoire d'entraînement pour les signatures d'options.

**How to apply** : avant de modifier `packages/auth/src/auth.ts`, `packages/database/src/schema/auth.ts`, ou tout formulaire de `apps/app/components/auth/`, lire au minimum `index.md` + le guide du sujet + `pitfalls.md`. Référencer en sortie d'analyse.