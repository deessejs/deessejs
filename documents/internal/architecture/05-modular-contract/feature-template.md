# Feature template

## Goal

When you want to add a new feature to the template, follow this walkthrough. By the end, you have a feature that:

- Lives in its own self-contained module.
- Is exposed via the app's API and UI.
- Has a passing delete test.
- Can be removed cleanly without breaking the rest of the app.

This template walks through building the **`notes` feature**: users can create, list, and delete personal notes scoped to their org.

## Step 0 — Plan

Before writing code, answer:

1. **What's the feature name?** `notes`
2. **What tables does it need?** `notes` (id, orgId, authorId, text, createdAt)
3. **What API surface?** oRPC: `notes.list`, `notes.create`, `notes.delete`
4. **What UI?** A page at `/(app)/notes/` with a list and create form
5. **What env vars?** None (for this example)

## Step 1 — Scaffold the directory

```bash
mkdir -p apps/template/packages/notes/{db,api,ui/components,ui/pages,tests/unit,tests/integration,docs}
touch apps/template/packages/notes/{index.ts,README.md,package.json,env.ts,types.ts}
touch apps/template/packages/notes/db/{schema.ts,migrations/.gitkeep}
touch apps/template/packages/notes/api/{contract.ts,handler.ts,route.ts}
touch apps/template/packages/notes/tests/{delete.test.ts}
```

## Step 2 — Define the schema

`apps/template/packages/notes/db/schema.ts`:

```ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orgId: text('org_id').notNull(),
  authorId: text('author_id').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

Generate the migration:

```bash
cd apps/template/packages/notes
pnpm drizzle-kit generate
```

This creates `db/migrations/0001_<hash>_create_notes.sql`. Review it by hand, then commit.

## Step 3 — Define the contract (oRPC)

`apps/template/packages/notes/api/contract.ts`:

```ts
import { os } from '@/lib/orpc';
import { z } from 'zod';

export const notesContract = os.contract({
  list: os
    .input(z.object({ orgId: z.string() }))
    .output(z.array(z.object({
      id: z.string().uuid(),
      text: z.string(),
      createdAt: z.date(),
    }))),

  create: os
    .input(z.object({
      orgId: z.string(),
      text: z.string().min(1).max(1000),
    }))
    .output(z.object({ id: z.string().uuid() })),

  delete: os
    .input(z.object({ id: z.string().uuid() }))
    .output(z.void()),
});
```

## Step 4 — Define the handler (business logic)

`apps/template/packages/notes/api/handler.ts`:

```ts
import { db } from '@/lib/db';
import { notes } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function listNotes(orgId: string) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.orgId, orgId))
    .orderBy(desc(notes.createdAt));
}

export async function createNote(orgId: string, authorId: string, text: string) {
  const [note] = await db
    .insert(notes)
    .values({ orgId, authorId, text })
    .returning();
  return note;
}

export async function deleteNote(orgId: string, id: string) {
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.orgId, orgId)));
}
```

## Step 5 — Define the env (if any)

`apps/template/packages/notes/env.ts`:

```ts
import { z } from 'zod';

export const notesEnvSchema = z.object({
  // notes doesn't require any env vars
  // but the file exists for consistency
});
```

If the feature required env vars, declare them here. See [`../01-stack/zod.md`](../01-stack/zod.md).

## Step 6 — Export the public surface

`apps/template/packages/notes/index.ts`:

```ts
// 1. DB schema
export { notes } from './db/schema';

// 2. oRPC contract
export { notesContract } from './api/contract';

// 3. Handlers (so the Hono route can re-use them)
export { listNotes, createNote, deleteNote } from './api/handler';

// 4. Env schema
export { notesEnvSchema } from './env';

// 5. Type exports
export type { Note } from './types';
```

`apps/template/packages/notes/types.ts`:

```ts
import type { notes } from './db/schema';
export type Note = typeof notes.$inferSelect;
```

## Step 7 — Wire into the app

Four places need updating to make the feature live:

### 7a. The db schema barrel

`apps/template/packages/db/schema.ts` (add the export):

```ts
// apps/template/packages/db/schema.ts
export * from '../notes/db/schema';
// ... other feature schemas
```

### 7b. The api router

`apps/template/packages/api/root.ts` (register the contract):

```ts
// apps/template/packages/api/root.ts
import { notesContract } from '../notes';
// ... other feature contracts

export const router = os.router({
  notes: notesContract,
  // ... other features
});
```

### 7c. The env central

`apps/template/env.ts` (validate the env schema):

```ts
// apps/template/env.ts
import { notesEnvSchema } from './packages/notes/env';
// ... other env schemas

export const env = {
  ...notesEnvSchema.parse(process.env),
  // ...
};
```

### 7d. The UI layout (if the feature has pages)

`apps/template/apps/web/app/(app)/layout.tsx` (add the navigation entry):

```tsx
// ... other nav entries
<NavLink href="/notes">Notes</NavLink>
```

## Step 8 — Build the UI

`apps/template/packages/notes/ui/components/NotesList.tsx`:

```tsx
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc/client';

export function NotesList({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const { data: notes } = useQuery(
    orpc.notes.list.queryOptions({ input: { orgId } })
  );
  const createNote = useMutation(
    orpc.notes.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    })
  );

  return (
    <div>
      <form onSubmit={(e) => {
        e.preventDefault();
        const text = new FormData(e.currentTarget).get('text');
        createNote.mutate({ orgId, text: String(text) });
      }}>
        <input name="text" placeholder="New note..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {notes?.map((note) => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Step 9 — Write the delete test

`apps/template/packages/notes/tests/delete.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('notes feature is deletable', () => {
  it('removes cleanly without breaking the app', () => {
    const result = execSync('pnpm test:delete --feature=notes', {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });
    expect(result).toContain('OK: notes is deletable');
  });
});
```

## Step 10 — Write the README

`apps/template/packages/notes/README.md`:

```markdown
# Notes

Personal notes per org member. Users can create, list, and delete notes scoped to their org.

## What's wired in

- 1 table: `notes` (id, orgId, authorId, text, createdAt).
- 3 oRPC procedures: `notes.list`, `notes.create`, `notes.delete`.
- 1 UI component: `<NotesList />`.

## Env vars

None.

## How to customize

- Change the `text` length limit in `api/contract.ts` (currently 1-1000 chars).
- Add tagging by extending the schema with a `tags` column.
- Add full-text search by adding a tsvector column + GIN index.

## How to delete

```bash
pnpm test:delete --feature=notes
```

This runs the delete test, which:
1. Snapshots the current code state.
2. Removes the `notes/` directory, the schema barrel entry, the router entry, the env entry, and the nav entry.
3. Runs tsc, tests, build.
4. Restores the state.

If the test passes, your `notes/` feature is fully self-contained and can be removed by deleting the directory and removing the 4 wiring points.

See [delete-tests.md](../delete-tests.md) for the full pipeline.
```

## The "feature is done" checklist

- [ ] All 10 dimensions of "done" pass (per `features/README.md`).
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test:unit` passes.
- [ ] `pnpm test:integration` passes.
- [ ] `pnpm test:delete --feature=<name>` passes.
- [ ] The feature has a README.md explaining what it does and how to delete it.
- [ ] The feature is listed in the relevant `features/<N>-<topic>.md` spec.
- [ ] The UI is reachable from the app's navigation.

## What's next

Once your feature passes the checklist:

1. **Update the product spec.** Add a row to the relevant `features/<N>.md` file.
2. **Update the landing page copy.** If the feature is buyer-facing, mention it in `marketing/landing-page.md`.
3. **Ship it.** The release manager will pick up the new feature in the next minor release.

## Cross-references

- [`module-structure.md`](./module-structure.md) — the canonical tree this template implements.
- [`delete-tests.md`](./delete-tests.md) — the delete test pipeline.
- [`../01-stack/orpc-hono-sdk.md`](../01-stack/orpc-hono-sdk.md) — the API pipeline.
- [`../01-stack/drizzle.md`](../01-stack/drizzle.md) — the schema pattern.
- [`../01-stack/tanstack-form.md`](../01-stack/tanstack-form.md) — for more complex forms.
