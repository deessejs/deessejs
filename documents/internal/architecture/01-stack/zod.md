# Zod

## Decision

**Zod** as the only validation and schema library in the repo. The single source of truth for runtime validation across the stack.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Zod is used for:

- **Database schemas** (`drizzle-zod` generates Zod schemas from Drizzle tables).
- **API input validation** (oRPC procedures, Hono routes).
- **Form validation** (TanStack Form via `zodValidator`).
- **Environment variable validation** (`@t3-oss/env-core` + Zod).
- **Config validation** (typed config objects).
- **AI structured output** (Vercel AI SDK's `generateObject({ schema })`).

Zod is **not** used for:

- Type-only definitions (use TypeScript types/interfaces).
- Runtime data that doesn't cross a boundary (e.g. internal helper functions).

## What Zod gives us

1. **Runtime validation.** Types that actually run.
2. **Type inference.** `z.infer<typeof schema>` gives the TS type for free.
3. **Composability.** Schemas compose: `z.object({ a: z.string() }).merge(z.object({ b: z.number() }))`.
4. **Transformations.** `.transform()`, `.refine()`, `.pipe()`.
5. **Standardized errors.** Same error shape across the stack.
6. **First-party integrations.** `drizzle-zod`, `zod-form-adapter`, Vercel AI SDK, tRPC, oRPC, Hono.

## Why Zod (not Yup, not Joi, not Valibot, not TypeBox)

| Alternative | Why not |
|---|---|
| **Yup** | Older API. Less TS-native. Smaller ecosystem in 2026. |
| **Joi** | Server-side only by tradition. Less TS support. |
| **Valibot** | Smaller bundle, tree-shakeable. But smaller ecosystem and fewer integrations. |
| **TypeBox** | JSON Schema-based. Different mental model. |
| **ArkType** | Newer. Smaller community. |
| **io-ts** | Pipe-based. More verbose. |
| **Hand-rolled validation** | We reinvent Zod badly. |

Zod wins on:

- **Type inference is first-class.** Define once, get the TS type and the runtime validator.
- **Ecosystem integrations.** drizzle-zod, TanStack Form's `zodValidator`, Vercel AI SDK, oRPC, Hono, tRPC — all support Zod.
- **Active development.** Recent versions, fast iteration.
- **Readable API.** The fluent `.min()`, `.max()`, `.email()` API is intuitive.

## Pattern with Drizzle (drizzle-zod)

```ts
// db/schema/orgs.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Generated Zod schemas
export const insertOrgSchema = createInsertSchema(orgs);
export const selectOrgSchema = createSelectSchema(orgs);

// Extend with custom validation
export const createOrgSchema = insertOrgSchema
  .pick({ name: true, slug: true })
  .extend({
    slug: z.string().regex(/^[a-z0-9-]+$/),
  });
```

The schemas flow:

- `insertOrgSchema` for INSERT validation.
- `selectOrgSchema` for the shape of a fetched org.
- `createOrgSchema` (extended) for the form + the API input.

## Pattern with Vercel AI SDK

```ts
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1),
  }),
  prompt: 'Analyze: ' + text,
});
```

The LLM is forced to return valid JSON matching the schema. `object` is fully typed.

## Pattern with env vars

```ts
// env.ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    // ...
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    // ...
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    // ...
  },
});
```

Bad env vars fail at startup, not at first use.

## Constraints

- **Every API input is a Zod schema.** No ad-hoc validation.
- **Every form has a Zod schema.** Server re-validates.
- **Database writes go through Zod.** `drizzle-zod` generates the schemas; we extend them.
- **No `any` in Zod schemas.** Use `z.unknown()` if the shape is truly unknown.
- **No runtime validation inside Server Components** for data they just fetched from our own DB (already typed). Use Zod only at boundaries.

## Cross-references

- [`./drizzle.md`](./drizzle.md) — DB schema → Zod via `drizzle-zod`.
- [`./tanstack-form.md`](./tanstack-form.md) — form validation via `zodValidator`.
- [`./orpc-hono-sdk.md`](./orpc-hono-sdk.md) — API input validation.
- [`./vercel-ai-sdk.md`](./vercel-ai-sdk.md) — structured output via Zod.
