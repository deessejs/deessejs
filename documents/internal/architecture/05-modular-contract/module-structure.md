# Module structure

## What this is

The canonical anatomy of a feature module. Every feature in the codebase follows this structure (with `auth/` being a documented special case that composes plugins).

If you read only this file, you know how to read every feature module.

## The canonical tree

```
apps/template/packages/<feature-name>/
│
├── index.ts                          ← THE public surface. The only file other modules import.
├── README.md                         ← The "Deleting features" walkthrough for THIS feature.
├── package.json                      ← name, type: module, deps, scripts.
│
├── db/
│   ├── schema.ts                     ← Drizzle schema (tables).
│   └── migrations/                   ← Drizzle-generated migrations.
│
├── api/
│   ├── contract.ts                   ← oRPC contract (input, output, errors).
│   ├── handler.ts                    ← Business logic. Imported by oRPC + Hono.
│   └── route.ts                      ← Hono route (for the public REST API).
│
├── ui/
│   ├── components/                   ← Client components specific to this feature.
│   └── pages/                        ← Next.js pages (if applicable).
│
├── env.ts                            ← Zod schema for env vars this feature requires.
├── types.ts                          ← Internal types. NOT exported.
│
├── tests/
│   ├── unit/                         ← Vitest unit tests.
│   ├── integration/                  ← Tests with real DB.
│   └── delete.test.ts                ← The delete test (see delete-tests.md).
│
└── docs/
    └── notes.md                      ← Optional: design notes specific to the feature.
```

## The contract: `index.ts` is the only door

Every feature module exposes its public surface through a single `index.ts`. Other modules and the app import from this file. They MUST NOT import from any other file inside the feature.

### What's exported

✅ **Always exported (the public surface):**

```ts
// apps/template/packages/notes/index.ts

// 1. DB schema tables (for app-level queries)
export { notes } from './db/schema';

// 2. oRPC contract (for the app's internal API)
export { notesContract } from './api/contract';

// 3. Hono routes (for the public REST API)
export { notesRoutes } from './api/route';

// 4. Env schema (for central env validation)
export { notesEnvSchema } from './env';

// 5. Type exports that downstream consumers need
export type { Note, CreateNoteInput } from './types';
```

✅ **Recommended exports (when relevant):**

```ts
// UI components the app uses
export { NotesList } from './ui/components/NotesList';
export { CreateNoteForm } from './ui/components/CreateNoteForm';
```

### What's NOT exported

❌ **Internal to the module. Never imported by others.**

```ts
// ❌ NEVER export these:
export { internalHelper } from './utils';
export { db } from './db/client';
export { sendEmail } from './lib/email';
export { somePrivateType } from './internal/types';
```

**The CI lint verifies this.** A `no-restricted-imports` rule blocks `import { ... } from '<feature>/db/schema'` (the file directly). Only `from '<feature>'` (the index) is allowed.

## The schema pattern

Each feature owns its Drizzle schema. Schemas are not in a central `db/schema/` — they live inside the feature module.

```ts
// apps/template/packages/notes/db/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),  // multi-tenant FK
  authorId: text('author_id').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

A **central barrel** at the repo root imports all feature schemas for cross-feature queries:

```ts
// apps/template/packages/db/schema.ts (the barrel)
export * from '../notes/db/schema';
export * from '../orgs/db/schema';  // would be Better Auth's org plugin
// ... etc.
```

The barrel is an **aggregator, not a place to add new schemas**. New schemas always go inside their feature module.

## The contract pattern (oRPC)

```ts
// apps/template/packages/notes/api/contract.ts
import { os } from '@/lib/orpc';
import { z } from 'zod';

export const notesContract = os.contract({
  list: os
    .input(z.object({ orgId: z.string() }))
    .output(z.array(z.object({
      id: z.string(),
      text: z.string(),
      createdAt: z.date(),
    }))),
  
  create: os
    .input(z.object({
      orgId: z.string(),
      text: z.string().min(1).max(1000),
    }))
    .output(z.object({ id: z.string() })),
  
  delete: os
    .input(z.object({ id: z.string() }))
    .output(z.void()),
});
```

The contract is pure: input/output/errors only. Business logic lives in `handler.ts`:

```ts
// apps/template/packages/notes/api/handler.ts
import { db } from '@/lib/db';
import { notes } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function listNotes(orgId: string) {
  return db.select().from(notes).where(eq(notes.orgId, orgId));
}

export async function createNote(orgId: string, authorId: string, text: string) {
  const [note] = await db.insert(notes).values({ orgId, authorId, text }).returning();
  return note;
}
```

The contract is registered in the app's central router:

```ts
// apps/template/packages/api/root.ts
import { notesContract } from '../notes';
import { orgsContract } from '../orgs';
// ... other feature contracts

export const router = os.router({
  notes: notesContract,
  orgs: orgsContract,
});
```

## The env pattern

Each feature declares what env vars it requires. Central `env.ts` validates all feature env schemas at startup.

```ts
// apps/template/packages/notes/env.ts
import { z } from 'zod';

export const notesEnvSchema = z.object({
  // notes doesn't require any env vars
});
```

```ts
// apps/template/packages/stripe/env.ts
import { z } from 'zod';

export const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
});
```

```ts
// apps/template/env.ts (central)
import { notesEnvSchema } from './packages/notes/env';
import { stripeEnvSchema } from './packages/stripe/env';

export const env = {
  ...notesEnvSchema.parse(process.env),
  ...stripeEnvSchema.parse(process.env),
  // ...
};
```

**Bad env vars fail at startup, not at first use.** See [`../01-stack/zod.md`](../01-stack/zod.md).

## The README pattern (the buyer's "Deleting features" walkthrough)

Each feature module has a `README.md` that walks the buyer through:

1. **What this feature does** (1-2 sentences).
2. **What's wired in** (plugins, integrations, env vars).
3. **How to customize** (config files, env vars to change).
4. **How to delete** (the modular contract in action — point to `delete-tests.md`).

The README is **buyer-facing** (ships with the template). It's not internal documentation.

## The special case: `auth/`

The `auth/` module does NOT follow the canonical tree above, because it **composes 8-10 Better Auth plugins**. Its structure is:

```
apps/template/packages/auth/
├── index.ts                          ← Better Auth configured instance, exported as `auth`
├── config.ts                         ← Plugin configurations
├── cli/                              ← @better-auth/cli integration
├── plugins/
│   ├── organization.ts              ← @better-auth/organization config
│   ├── admin.ts                     ← @better-auth/admin config
│   ├── api-key.ts                   ← @better-auth/api-key config
│   ├── passkey.ts                   ← @better-auth/passkey config
│   ├── two-factor.ts                ← @better-auth/two-factor config
│   ├── magic-link.ts                ← @better-auth/magic-link config
│   ├── generic-oauth.ts             ← OAuth providers config
│   ├── stripe.ts                    ← @better-auth/stripe config
│   ├── captcha.ts                   ← @better-auth/captcha config
│   └── sso.ts                       ← @better-auth/sso config (optional)
├── schemas/                          ← Generated by @better-auth/cli, owned by Better Auth
│   ├── organization.ts
│   ├── admin.ts
│   ├── ...
└── tests/
    └── delete.test.ts                ← Special delete test that handles plugins (see delete-tests.md)
```

**Why is `auth/` different?** Because it owns npm dependencies that the buyer installs, schemas that a CLI generates, and a configuration that composes 10+ plugins. A simple "every file inside the module" pattern doesn't work here.

The delete test for `auth/` is also special (see `delete-tests.md`).

## Conventions

- **Every feature ships with a delete test.** A feature without one is not mergeable.
- **Every feature has a README** explaining what it does and how to delete it.
- **The `index.ts` is the only door.** No direct file imports from outside the module.
- **Cross-feature imports go through `index.ts`.** Feature A imports from Feature B's `index.ts`, never from `feature-b/db/schema`.
- **Schemas, contracts, env schemas are always exported** from `index.ts` (the public surface).

## Anti-patterns

❌ **Reaching into another feature's internals.**

```ts
// ❌ NEVER
import { internalHelper } from '@deessejs/notes/utils';
```

❌ **Modifying a generated file.**

```ts
// ❌ The CLI generates apps/template/packages/auth/schemas/organization.ts.
// Don't hand-edit. Re-run `pnpm better-auth generate` instead.
```

❌ **Sharing a table between two features.**

```ts
// ❌ If `notes` and `feedback` both want to read the same `users` table,
// they import from auth/index.ts (Better Auth's user table),
// not from each other's db/schema.
```

❌ **Adding a feature without a delete test.**

```ts
// ❌ The PR fails CI if `tests/delete.test.ts` is missing.
```

## Cross-references

- [`feature-template.md`](./feature-template.md) — the copy-paste walkthrough for adding a new feature.
- [`delete-tests.md`](./delete-tests.md) — the delete test pipeline.
- [`../01-stack/better-auth.md`](../01-stack/better-auth.md) — why `auth/` is special.
- [`../01-stack/drizzle.md`](../01-stack/drizzle.md) — the ORM.
- [`../01-stack/orpc-hono-sdk.md`](../01-stack/orpc-hono-sdk.md) — the API pipeline.
- [`../01-stack/zod.md`](../01-stack/zod.md) — validation (env schemas use Zod).
