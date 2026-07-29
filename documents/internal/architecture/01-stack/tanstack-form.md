# TanStack Form

## Decision

**TanStack Form** (`@tanstack/form`) for every form in the web app. Pairs with **Zod** for validation (via `zodAdapter`).

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked (replaces the spec's earlier mention of react-hook-form)

## Scope

TanStack Form is used for:

- **Sign-up, sign-in, profile, settings** (every form in the auth/admin areas).
- **Org creation, member invitation, role editing** (RBAC forms).
- **Billing forms** (plan picker, payment method, etc.).
- **Any user-facing form** that needs validation, error display, and submission state.

TanStack Form is **not** used for:

- **Server actions without validation** (just call the action).
- **API-only mutations** (use TanStack Query's `useMutation` directly).
- **Multi-step wizards** without per-step validation (could use a state machine instead).

## What TanStack Form gives us

1. **Type-safe forms.** Generics infer the field shape from the schema.
2. **Zod-native validation** via `zodAdapter`. Same schemas as our DB.
3. **Field-level errors.** Display validation errors next to the field that caused them.
4. **Form-level errors.** Aggregate errors for cross-field validation.
5. **Async validation.** Username availability, email uniqueness, etc.
6. **Submission state.** `isSubmitting`, `canSubmit`, error handling.
7. **Framework-agnostic core.** Headless; we render with our shadcn components.

## Why TanStack Form (not react-hook-form, not Formik, not Conform)

| Alternative | Why not |
|---|---|
| **react-hook-form** | Mature, popular. But Zod integration is via `@hookform/resolvers` (third-party adapter). TS support is good but not as native as TanStack Form. |
| **Formik** | Older. Less TS-native. |
| **Conform** | Zod-native, server-action-focused. Tighter coupling to Remix patterns. Less flexible for client-only forms. |
| **Final Form** | Older API. Smaller community. |
| **HTML form + server action** | No client-side validation. No field-level error display without custom code. |

TanStack Form wins on:

- **TS-first design.** Type inference from the Zod schema flows end-to-end.
- **Zod adapter is first-party.** No third-party resolver.
- **Headless.** Renders with our shadcn `Input`, `Select`, etc.
- **Active development.** Recent 1.0 release, fast iteration.

## Pattern with Zod

```tsx
'use client';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
});

export function CreateOrgForm() {
  const form = useForm({
    defaultValues: { name: '', slug: '' },
    validators: { onChange: zodValidator(createOrgSchema) },
    onSubmit: async ({ value }) => {
      await orpc.orgs.create.call(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="name"
        children={(field) => (
          <div>
            <label htmlFor={field.name}>Name</label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((err) => (
              <span key={err}>{err}</span>
            ))}
          </div>
        )}
      />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Server validation

Client-side validation is **never trusted**. Every form submission re-validates with the same Zod schema on the server (via oRPC + Drizzle). This is the "validate twice" rule.

```ts
// oRPC procedure
export const createOrg = os
  .input(createOrgSchema) // same schema, server-side
  .handler(async ({ input, context }) => {
    return db.insert(orgs).values(input);
  });
```

## Constraints

- **Every form has a Zod schema.** No ad-hoc validation.
- **Schemas live in the feature module**, exported for both client and server use.
- **Server re-validates.** Always.
- **Field errors display inline.** No toast-only error display.
- **Submission state is explicit.** Disabled buttons, loading spinners.

## Cross-references

- [`./zod.md`](./zod.md) — the validation library.
- [`./orpc-hono-sdk.md`](./orpc-hono-sdk.md) — the API that the form submits to.
- [`./tanstack-query.md`](./tanstack-query.md) — for non-form mutations.
- [`./tailwind-shadcn.md`](./tailwind-shadcn.md) — for form components.
