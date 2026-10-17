# Implementation Spec — Organizations V1 · PR-1

**Status:** ready for implementation (revised four times — 16 October review follow-up, 16 October smoke test + fixture + migration tooling review, 16 October session state + customisations + test status review, 16 October normalisation completeness + compensating migration safety + 1.7.7 source verification + smoke cleanup review)
**Source RFC:** "Organizations V1" v4 (16 October 2026)
**Parent spec:** `docs/specs/organizations-v1.md` §3 — PR-1 of 8 in the stack
**Baseline:** `staging` after PR #221 — Better Auth 1.7.7, Drizzle adapter, Admin + device + bearer + nextCookies stack
**Target branch:** `impl/223-organizations-v1/server-plugin` based on `staging`
**PR scope:** server plugin wiring + schema probe integration + first migrations. **No application helpers, no UI, no route changes.** Downstream PRs (PR-2..PR-8) consume the surface installed here.

## 1. Goal of this PR

Install the Better Auth `organization` plugin in the server configuration and propagate the new schema to the canonical Drizzle schema, the migration history, and a new application-owned schema module. This PR does not make the plugin functional end-to-end — it makes the plugin *present and shape-correct*, so the helper modules and route work in PR-2..PR-8 can build on a stable foundation.

Concrete outcomes at the end of PR-1:

1. `packages/auth/src/auth.ts` includes the `organization()` plugin entry, the five `organizationHooks` referenced from the spec (`beforeCreateOrganization`, `beforeDeleteOrganization`, `beforeRemoveMember`, `beforeUpdateMemberRole`, `beforeUpdateOrganization`), and a `sendInvitationEmail` callback stub that delegates to a new module. The `bootstrapOperationId` additional field is configured with `input: false` and `returned: false`.
2. `packages/auth/src/organization-policy.ts` exists as a **stub** exporting the five function signatures the downstream PRs import. One of them (`assertOrganizationSlug`) is **real** in PR-1 and throws a typed `APIError("BAD_REQUEST", { code: "invalid_slug" })` on rejection. The other four throw `APIError("CONFLICT", { code: "not_implemented" })` so the smoke checklist sees a typed 409 rather than a generic 500. This avoids the chicken-and-egg where PR-2 imports from a file that does not yet exist. `packages/auth/src/organization-onboarding.ts` is **not** part of PR-1 — it is created in PR-2 alongside the real policy bodies. PR-1 has no need for it.
3. `packages/auth/src/organization-invitation.ts` exists as a stub that throws the same typed `not_implemented` `APIError`. PR-6 fills it in.
4. The Better Auth CLI has been run; the probe in `packages/database/src/schema/.auth-gen-probe.ts` has been diffed against the canonical `auth.ts`; the new plugin tables, the `activeOrganizationId` session field, and the `bootstrapOperationId` additional field have been integrated into the canonical schema with the six runtime-required customisations preserved (`deviceCode` table name, FK on `userId`, `deviceCodeRelations`, the two `deviceCode` lookup indexes, the Admin plugin columns on `user`, and the `userRelations.deviceCodes` back-reference).
5. A new `packages/database/src/schema/organization-state.ts` exports the two application-owned tables (`accountOrganizationDefaults`, `accountOrganizationProvisioning`) as **declarations only** — no row-inserting helpers, no query helpers, no relations to the Better Auth plugin tables (those come in PR-3 when the FK semantics are decided alongside the trigger design).
6. `packages/database/src/schema/index.ts` re-exports the new module.
7. Two new migrations exist: `0003_organizations.sql` (plugin tables, session field, additional field, plugin relations) and `0004_organization_application_state.sql` (application tables, indexes). Both have been applied to the dev database; the actual tables, columns, and constraints exist before any code that reads them.
8. `pnpm typecheck` is green across the workspace. `pnpm build` succeeds. `pnpm lint` is clean. The existing test suite still passes.
9. **No** UI changes. **No** route changes. **No** proxy changes. **No** `apps/app` source changes outside `lib/auth-client.ts` (which gains `organizationClient()` — see §3.2).

## 2. Why this PR is the right unit

The plugin's table presence is a prerequisite for every later PR. PR-2 (policy + onboarding service) reads `accountOrganizationProvisioning` and writes to `accountOrganizationDefaults`. PR-3 (triggers) references `organization.id` and `member.id`. PR-4 (workspace shell) calls `authClient.organization.*` and renders the switcher. PR-5 (onboarding) issues the first `auth.api.createOrganization` call and expects the hook's `bootstrapOperationId` to flow through.

If plugin + schema land in the same commit as the policy/onboarding logic, the diff is unreviewable. If they land separately from the route changes, the migration cannot be exercised by any test. PR-1 is the smallest unit that:

- Adds a new dependency surface (the plugin + the additional field + the application tables) that the rest of the stack builds on.
- Stays inert at the user surface — the V1 home page still works as today, the auth flows are unchanged, the proxy still treats `/settings/*` as a protected route.
- Can be merged without coordinating with the UI team.

## 3. Implementation steps

The PR is one branch, one merge commit, one changeset. Each step is a discrete commit on the branch so reviewers can walk the diff in order.

### 3.1 — Server plugin entry

**Files:** `packages/auth/src/auth.ts` only.

Add `organization()` to the `plugins` array, **immediately before** `nextCookies()`. The new entry follows RFC §10 exactly. Do not change the position of any existing plugin; the diff must show the four existing entries (`deviceAuthorization`, `bearer`, `admin`, `nextCookies`) before and after the insertion with `organization` slotted between `admin` and `nextCookies`. CI must fail if `nextCookies()` is no longer the last entry.

Configuration block (RFC §10, copied verbatim, no behavioural additions in this PR):

- `allowUserToCreateOrganization: (user) => user.emailVerified === true`
- `creatorRole: "owner"`
- `requireEmailVerificationOnInvitation: true`
- `invitationExpiresIn: 60 * 60 * 48`
- `disableOrganizationDeletion: false`
- `schema.organization.additionalFields.bootstrapOperationId` with `type: "string"`, `required: false`, `unique: true`, `input: false`, `returned: false`. **Both** properties are required and serve different purposes: `input: false` prevents the create route's `toZodSchema({ isClientSide: true })` from accepting a caller-supplied value (clients cannot write the field — see better-auth/better-auth issues #7489 and PR #7504 for the upstream history), and `returned: false` prevents the adapter from including the stored value in response bodies via `filterOutputFields` (clients cannot read the field — see PR #7531, which fixed the organization adapter to actually filter `returned: false` fields on read). `input: false` alone is **not sufficient**: the default `returned: true` would expose the server-owned marker to the client. See the Better Auth database concepts page for the full `input` / `returned` truth table.
- `organizationHooks` for the **five** plugin hooks: `beforeCreateOrganization`, `beforeDeleteOrganization`, `beforeRemoveMember`, `beforeUpdateMemberRole`, `beforeUpdateOrganization`. The hook bodies call typed helpers from the new `organization-policy.ts`; the helpers themselves are stubs that raise a typed `not_implemented` error (see §3.4). The stubs are required so the plugin compiles and the schema probe is correct; they are deliberately insufficient to satisfy the create path end-to-end (see §3.4 and §5 gate 10 for the explicit test contract).
- `sendInvitationEmail: async (data) => { await sendOrganizationInvitation(data); }` where `sendOrganizationInvitation` is imported from the new `organization-invitation.ts`. The new module is a stub that raises a typed `not_implemented` error (see §3.5). The Better Auth native `createInvitation` endpoint invokes the callback as part of its own transaction; a callback that throws propagates the error to the HTTP caller. The downstream PR-6 fills in the helper.

The plugin entry sits **after** the `admin({ defaultRole: "user", adminRoles: ["admin"] })` entry and **before** `nextCookies()`. The existing `BetterAuthOptions` annotation on `authConfig` and the `as ReturnType<typeof betterAuth<typeof authConfig>>` cast on the public `auth` export are preserved unchanged. The TS2883 rationale in the existing comment block (the widening cast that loses plugin-augmented shape on the inferred `$Infer` chain) applies identically to the new plugin: the cast is required to compile the public `auth` export against the union of plugin-inferred types.

The new hooks reference the policy helpers via named imports. The `beforeCreateOrganization` hook body is the minimum that lets the plugin compile and lets PR-5 wire the real provisioning logic:

```ts
beforeCreateOrganization: async ({ organization: input, user }) => {
  // RFC §10 §5 — narrow the optional fields the Better Auth hook type
  // marks as `string | undefined` even though the native create endpoint
  // parses both as required strings. The `assertOrganizationSlug` helper
  // (§3.4) is the real validator in PR-1; it raises a typed
  // `BAD_REQUEST / invalid_slug` and the hook propagates.
  if (typeof input.name !== "string" || typeof input.slug !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid organization name or slug",
    });
  }
  assertOrganizationSlug(input.slug);
  if (user.emailVerified !== true) {
    throw new APIError("FORBIDDEN", {
      message: "Email verification is required",
    });
  }
  const bootstrapData = await prepareOrganizationCreation({
    userId: user.id,
    name: input.name,
    slug: input.slug,
  });
  if (input.metadata != null) {
    throw new APIError("BAD_REQUEST", {
      message: "Organization metadata is not editable",
    });
  }
  return { data: { ...input, ...(bootstrapData ?? {}) } };
},
```

The other four hooks (`beforeDeleteOrganization`, `beforeRemoveMember`, `beforeUpdateMemberRole`, `beforeUpdateOrganization`) call their respective helpers and propagate the typed errors the helpers raise. The `beforeUpdateOrganization` hook additionally guards `slug`, `metadata`, and the presence of `bootstrapOperationId` in the update payload per RFC §10. The check is structural: if the key is present, the helper rejects with a clear error. The Better Auth `toZodSchema` strips `input: false` fields from the request body, so a browser-supplied marker cannot reach the row; the `beforeUpdateOrganization` check is belt-and-suspenders against a future Better Auth change that exposes the field.

`APIError` is imported from `better-auth/api`. `assertOrganizationSlug`, `prepareOrganizationCreation`, `assertOrganizationIsDeletable`, `assertDefaultOwnerMembershipIsRetained`, `assertDefaultOwnerRoleIsRetained` are imported from `./organization-policy.js` (see §3.4).

### 3.2 — Client plugin entry

**Files:** `apps/app/lib/auth-client.ts` only.

Add `organizationClient` to the import group alongside `adminClient` and `deviceAuthorizationClient`. Extend the `plugins` array with `organizationClient()` slotted after `adminClient()` to keep the alphabetical-then-feature order the file already uses. The `satisfies BetterAuthClientOptions` annotation and the `as ReturnType<typeof createAuthClient<typeof authClientOptions>>` cast are preserved unchanged.

The client plugin is required in PR-1 even though the only V1 UI that calls `authClient.organization.*` arrives in PR-4b. The reason: the type surface of the public `authClient` export is widened by the plugin, and adding the plugin after the rest of the stack begins to import the typed client forces a noisy cross-PR refactor. Wiring the plugin here, when the server plugin is also wired, keeps the type surface coherent.

The `inferOrgAdditionalFields<typeof auth>()` helper is **not** wired in this PR. The `bootstrapOperationId` is server-only; the client never reads it back through the typed `authClient.organization.*` methods that V1 uses. Adding the helper in PR-4b, alongside the first call to `authClient.organization.list`, is the right time. Doing it now risks an inferOrgAdditionalFields failure that blocks the entire stack for a field PR-1 does not need to expose.

### 3.3 — Schema probe integration

**Files:** `packages/database/src/schema/auth.ts`, the migration history under `packages/database/drizzle/`.

Run `pnpm --filter @workspace/auth auth:generate`. The CLI writes its regenerated Drizzle schema to `packages/database/src/schema/.auth-gen-probe.ts` (gitignored per `packages/database/.gitignore`). Diff the probe against the canonical schema with `git diff --no-index packages/database/src/schema/auth.ts packages/database/src/schema/.auth-gen-probe.ts`. The exit code is `1` when the files differ, `0` when they match; CI must assert non-zero.

The diff will list, at minimum:

- A new `organization` table with the columns the plugin declares (`id`, `name`, `slug`, `logo`, `createdAt`, `metadata` plus the `bootstrapOperationId` additional field). The probe emits the additional field as a `text` column with a `UNIQUE` constraint; preserve both the `text("bootstrap_operation_id")` shape and the unique constraint.
- A new `member` table with `id`, `organizationId`, `userId`, `role`, `createdAt`.
- A new `invitation` table with `id`, `organizationId`, `email`, `role`, `status`, `inviterId`, `expiresAt`, `createdAt`.
- A new `activeOrganizationId` column on `session`, nullable, with no `input: false` annotation in Drizzle (the plugin owns the runtime behaviour; the column is plain `text`).
- Three relations exports (`organizationRelations`, `memberRelations`, `invitationRelations`) the CLI emits; integrate verbatim.

Apply the runtime-required patches documented at the top of `packages/database/src/schema/auth.ts`:

- Preserve the `deviceCode` table name (the CLI emits `device_code`; rename to `"deviceCode"`).
- Preserve the FK on `deviceCode.userId` (the CLI emits a plain `text("user_id")`).
- Preserve the `deviceCodeRelations` export and the `userRelations.deviceCodes` back-reference.
- Preserve the `deviceCode_userId_idx` and `deviceCode_expiresAt_idx` indexes.
- Preserve the Admin plugin columns on `user` and `session`. Do not add the plugin twice.

The `auth:generate` script in `packages/auth/package.json` already points at the gitignored probe path. After the integration, re-run `pnpm --filter @workspace/auth auth:generate` and confirm the diff against the canonical file is now empty (the probe and the canonical schema match). A non-empty diff at this stage means a column was missed or a customisation was lost; resolve before continuing.

### 3.4 — Application policy module

**Files:** `packages/auth/src/organization-policy.ts` (new).

The module exports the five helpers PR-2 will fill in. The signatures match RFC §10 verbatim. The bodies have two distinct contracts in PR-1:

- `assertOrganizationSlug` is **real** in PR-1. It enforces the format, length, and reservation list from RFC §6. It throws a typed `APIError("BAD_REQUEST", { code: "invalid_slug" })` on rejection. The slug check has **two** failure modes, each producing a distinct gate assertion (see §5 gate 10): a malformed slug fails the format check and the test expects **400** `invalid_slug`; a reserved slug fails the reservation check and the test expects **400** `invalid_slug` (same code, distinct message — see `RESERVED_SLUGS` for the list). A well-formed, non-reserved slug passes `assertOrganizationSlug` and the request reaches `prepareOrganizationCreation` (a stub), which then raises **409** `not_implemented`. The slug validator is the only piece of policy code that has to ship in PR-1 — without it, the gate 10 smoke checklist cannot reach the `prepareOrganizationCreation` stub without coupling the assertion to a separate error.
- The other four helpers stay as stubs that throw `APIError("CONFLICT", { code: "not_implemented" })` (see §3.4 block "Typed not_implemented contract"). The downstream PRs (PR-2 in particular) replace each body with the real policy; PR-1 ships only the typed-error surface for those four.

The `not_implemented` error is **not** the eventual error a user will see — it is the contract between PR-1 and PR-2. The smoke checklist in §5 gate 10 asserts the exact status and code for each request, so a future refactor that changes the error type will be caught before merge.

**The §5 gate 10 scenarios are a manual smoke checklist executed by the implementer against the dev database, not a committed test suite.** §4 lists « No tests against the new tables. PR-8 ships the integration tests. » as an explicit non-goal, and gate 4 asserts the existing test suite still passes. The smoke checklist is a verifiable runbook, not a CI gate: it produces evidence (captured status + body) that the reviewer can read and reproduce. PR-8 turns the smoke checklist into committed integration tests against the dev database.

```ts
import { APIError } from "better-auth/api"

const RESERVED_SLUGS = new Set<string>([
  // Top-level application segments
  "account", "admin", "onboarding", "accept-invitation", "api",
  "login", "signup", "forgot-password", "reset-password",
  "verify-email", "device",
  // Reserved by product / templates
  "deessejs", "nesalia",
])

const SLUG_FORMAT = /^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$/

function notImplemented(name: string): never {
  throw new APIError("CONFLICT", {
    code: "not_implemented",
    message: `${name} is not implemented in this increment; ships in a later PR.`,
  })
}

export function assertOrganizationSlug(slug: string): void {
  if (typeof slug !== "string" || !SLUG_FORMAT.test(slug)) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_slug",
      message: "Organization slug must be 2–38 lowercase ASCII characters (letters, digits, hyphens), starting and ending with a letter or digit.",
    })
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_slug",
      message: `Organization slug "${slug}" is reserved.`,
    })
  }
}

export async function prepareOrganizationCreation(_input: {
  userId: string
  name: string
  slug: string
}): Promise<{ bootstrapOperationId: string } | undefined> {
  // Returning `undefined` here is the post-PR-2 contract for "account
  // already has a completed default, this is ordinary additional
  // creation". In PR-1 the function never returns; the stub raises
  // not_implemented so the smoke test in §5 sees the 409. The PR-2
  // implementation must distinguish "default exists" (return undefined)
  // from "no default and no active provisioning operation" (throw
  // CONFLICT with code "onboarding_required") from "matched operation"
  // (return { bootstrapOperationId }).
  notImplemented("prepareOrganizationCreation")
}

export async function assertOrganizationIsDeletable(_orgId: string): Promise<void> {
  notImplemented("assertOrganizationIsDeletable")
}

export async function assertDefaultOwnerMembershipIsRetained(
  _member: { userId: string; organizationId: string; role: string },
): Promise<void> {
  notImplemented("assertDefaultOwnerMembershipIsRetained")
}

export async function assertDefaultOwnerRoleIsRetained(
  _member: { userId: string; organizationId: string; role: string },
  _newRole: string,
): Promise<void> {
  notImplemented("assertDefaultOwnerRoleIsRetained")
}
```

The slug validator deliberately does **not** handle the `org-<hex>` neutral fallback or the collision suffix from RFC §6 — those need the full provisioning service and belong in PR-2. The format check matches the eventual RFC §6 final-shape rules, so PR-2's full implementation extends the validator without breaking PR-1's tests. Reserved top-level slugs are listed in `RESERVED_SLUGS`; `account` is the only overlap with an organization name a real user might submit, and the test data avoids it.

The module is reachable from Better Auth's runtime; it does **not** import `server-only`. The downstream PR-2 keeps it that way so it can be unit-tested in isolation.

**Why the create path in gate 10 is a failure test, not a success test.** With a well-formed slug, the `beforeCreateOrganization` hook calls `assertOrganizationSlug` (passes) and then `prepareOrganizationCreation` (which the stub raises on). A real `createOrganization` call from a verified account therefore reaches the hook, the stub raises `not_implemented`, and the native route returns 409 with code `not_implemented`. The first end-to-end successful create ships in PR-5, when the provisioning service and the policy helpers are wired together. PR-1 keeps the user-facing create flow explicitly gated on downstream PRs.

### 3.5 — Invitation callback stub

**Files:** `packages/auth/src/organization-invitation.ts` (new).

The module exports `sendOrganizationInvitation(data)` whose signature matches the Better Auth Organization plugin option `sendInvitationEmail`. The body throws `APIError("CONFLICT", { code: "not_implemented" })` (same pattern as §3.4). PR-6 fills it in. The module imports `serverEnv` from `@workspace/env/server` to surface the missing `APP_URL` configuration explicitly when PR-6 lands; the import is safe in PR-1 because the env module is already a dependency of `@workspace/auth`.

### 3.6 — Application schema module

**Files:** `packages/database/src/schema/organization-state.ts` (new), `packages/database/src/schema/index.ts` (one line added).

The new module declares the two application-owned tables. Declarations only — no relations to the plugin tables, no query helpers, no row-inserting helpers. The PR-3 design adds the composite FKs and the `account_organization_defaults → user` and `account_organization_defaults → member (orgId, userId)` relations; PR-1 does not introduce them so the diff stays small.

```ts
import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const accountOrganizationDefaults = pgTable(
  "account_organization_defaults",
  {
    userId: text("user_id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_organization_defaults_org_idx").on(table.organizationId)],
)

export const accountOrganizationProvisioning = pgTable(
  "account_organization_provisioning",
  {
    userId: text("user_id").primaryKey(),
    operationId: text("operation_id").notNull().unique(),
    organizationId: text("organization_id"),
    requestedName: text("requested_name").notNull(),
    requestedSlug: text("requested_slug").notNull(),
    status: text("status").notNull().default("pending"),
    leaseUntil: timestamp("lease_until"),
    fencingToken: bigint("fencing_token", { mode: "number" })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Single declaration of uniqueness on `operationId`. Do not add
    // `.unique()` on the column AND a `uniqueIndex` on the same column
    // here: the generated migration would emit both a UNIQUE constraint
    // and a unique B-tree index, which is redundant and slows down bulk
    // inserts. The `.unique()` on the column above is the authoritative
    // declaration; the index below would be a duplicate.
  ],
)
```

Three intentional omissions in PR-1 (filled in by PR-2 and PR-3):

- The `account_organization_defaults.userId → user.id` FK with `ON DELETE RESTRICT` lands in PR-3 alongside the last-owner trigger design. Adding it in PR-1 would couple this PR to a decision that PR-3 owns.
- The `account_organization_defaults.organizationId → organization.id` FK and the composite FK to the unique `(organizationId, userId)` member pair land in PR-3 for the same reason.
- The `account_organization_provisioning.status` enum is declared as `text` rather than a Drizzle pgEnum. The four values (`pending`, `organization_created`, `membership_verified`, `completed`) are checked at the application boundary in PR-2; the Drizzle pgEnum couples the schema to the application state machine prematurely.

`packages/database/src/schema/index.ts` gains one line:

```ts
export * from "./organization-state"
```

### 3.7 — Migrations

**Files:** `packages/database/drizzle/0003_organizations.sql` (new), `packages/database/drizzle/0004_organization_application_state.sql` (new), plus the matching snapshots under `packages/database/drizzle/meta/`.

**Generate both migrations with the desired names from the start.** Drizzle Kit's `--name` flag accepts a custom migration label and produces a `.sql` file (and matching snapshot under `meta/`) named `<index>_<name>.sql` directly. Manually renaming the generated file is fragile: the `meta/_journal.json` file is the authority for migration identity, and a SQL rename without a matching journal edit leaves `db:migrate` and `db:check` out of sync.

```bash
# After §3.3 (schema probe integrated) and §3.6 (application tables declared).
pnpm --filter @workspace/database db:generate --name=organizations
# Apply the application migration in the same command if drizzle-kit
# chains them, or run db:generate again after the SQL is verified.
pnpm --filter @workspace/database db:generate --name=organization_application_state
```

The flag is supported by Drizzle Kit 0.22+ (the version pinned in this repo). If a future Drizzle Kit version changes the flag surface, the spec defers to whatever the locked `drizzle-kit` exposes — the contract is "name the file via the generator, not by renaming".

The expected SQL for `0003_organizations.sql`:

- `CREATE TABLE "organization"` with the plugin columns plus the `bootstrap_operation_id text UNIQUE` additional field. The CLI emits the unique constraint inline; preserve it.
- `CREATE TABLE "member"` with `(organization_id, user_id)` composite uniqueness implicit in the Better Auth schema. The CLI emits both columns and a composite unique index `member_organization_id_user_id_uidx`; preserve it.
- `CREATE TABLE "invitation"` with the plugin columns.
- `ALTER TABLE "session" ADD COLUMN "active_organization_id" text` (nullable, no default). Do **not** add a default value or a `NOT NULL` constraint to `active_organization_id`: every existing session in production has no active organization, and a `NOT NULL DEFAULT` would force a write to every row.
- `CREATE INDEX "session_active_organization_id_idx"` on the new column.

The CLI may emit additional indexes for the plugin tables (slug lookup, organization-user lookups, invitation status). Preserve all of them; the runtime uses them.

The expected SQL for `0004_organization_application_state.sql` is two `CREATE TABLE` statements matching the declarations in §3.6, plus the index on `account_organization_defaults.organizationId`. The unique constraint on `account_organization_provisioning.operation_id` is declared exactly once on the column (`.unique()`), and the table callback does **not** redeclare it as a `uniqueIndex` — see §3.6 for the rationale.

After generating, **verify both files together** with `pnpm --filter @workspace/database db:check`. The check confirms the SQL matches the schema and the snapshots under `meta/` are consistent. A non-zero exit at this stage means the journal or the snapshots diverged; resolve before applying.

Apply both migrations to the dev database with `pnpm --filter @workspace/database db:migrate`. Before declaring the PR ready, run a manual `\d organization`, `\d member`, `\d invitation`, `\d account_organization_defaults`, `\d account_organization_provisioning` against the dev database and confirm every column and constraint is present. Verify that `account_organization_provisioning` shows **one** unique index on `operation_id` (a unique constraint and a unique index on the same column is a redundant double-declaration that costs write throughput and confuses later migrations).

## 4. Out of scope for this PR

Explicit non-goals, called out so reviewers do not flag them as missing:

- No `auth.api.createOrganization` calls anywhere in the codebase. The first native call ships in PR-5.
- No UI, no route group changes, no proxy changes, no `apps/app` source changes outside `lib/auth-client.ts`.
- No `apps/app/lib/organization-auth.ts` (server-only guard helpers). PR-2 ships that.
- No `apps/app/app/(onboarding)` route group. PR-4a and PR-5 ship that.
- No `INTERNAL_SWEEP_SECRET` env var, no `/api/internal/repair-being-deleted` route, no `vercel.json` cron entry. PR-3 ships that.
- No `@2toad/profanity` dependency. PR-2 adds the dep and the policy wiring.
- No `safeInvitationRedirect` helper. PR-6 ships that.
- No tests against the new tables. PR-8 ships the integration tests.
- No changes to `DESIGN.md` or `AGENTS.md`. The Organizations V1 design section is appended by PR-8.
- No changes to `.changeset/`. The feature changeset is added by PR-8.

## 5. Verification gates

The PR is merge-ready when **all** of the following pass:

1. `pnpm typecheck` is green across the workspace. The `BetterAuthOptions` annotation on `authConfig` and the `as ReturnType<typeof betterAuth<typeof authConfig>>` cast remain load-bearing (the TS2883 rationale in the existing comment block applies). Verify by removing the cast temporarily and re-running `tsc --noEmit`; the error must reproduce.
2. `pnpm build` succeeds. `@workspace/auth` and `@workspace/database` build without errors; the consuming packages (`apps/app`, `packages/api`) build against the new exports.
3. `pnpm lint` is clean (`--max-warnings=0`).
4. The existing test suite (`pnpm test`) still passes. No test was added or changed in this PR.
5. **Probe↔canonical equivalence under documented customisations.** A plain `git diff --no-index` between the probe and `auth.ts` cannot return empty: the CLI emits the table name `device_code` while the canonical schema preserves `deviceCode`, and the CLI omits **six** runtime-required customisations (the four for `deviceCode` plus the Admin plugin columns on `user` and `session` and the `userRelations.deviceCodes` back-reference). The canonical schema is therefore **expected** to differ from the probe in those six places, and PR-1 does not close the gap. Instead, the implementer runs a **normalised comparison** that re-applies the customisations to the probe and then diffs:

   ```bash
   # 1. Generate the probe
   pnpm --filter @workspace/auth auth:generate

   # 2. Produce a normalised probe by re-applying the six customisations
   #    documented at the top of packages/database/src/schema/auth.ts:
   #    a. `deviceCode` table — rename `pgTable("device_code", …)` to
   #       `pgTable("deviceCode", …)`
   #    b. `deviceCode` FK — add
   #       `userId: text("user_id").references(() => user.id, { onDelete: "cascade" })`
   #    c. `deviceCodeRelations` export — restore
   #    d. `deviceCode` indexes — restore
   #       `index("deviceCode_userId_idx")` and `index("deviceCode_expiresAt_idx")`
   #    e. `user` Admin columns — restore `role`, `banned`, `banReason`, `banExpires`
   #    f. `userRelations` back-reference — add `deviceCodes: many(deviceCode)`
   #    (the `session.impersonatedBy` Admin column is emitted by the CLI and
   #    does not need re-application)
   # The implementer writes a small one-shot script under `scripts/` (or
   # applies the transformations inline) and stores the normalised probe
   # under `packages/database/src/schema/.auth-gen-probe.normalised.ts`
   # (gitignored).

   # 3. Diff the canonical schema against the normalised probe
   git diff --no-index \
     packages/database/src/schema/auth.ts \
     packages/database/src/schema/.auth-gen-probe.normalised.ts
   ```

   The exit code must be `0` (no diff). A non-zero exit at this stage means the canonical schema has drifted from what the CLI would emit plus the customisations; resolve before merging. **The normalisation is a one-shot operation per PR-1**: the `scripts/` helper is not committed (or, if committed, it is named to make its throwaway nature obvious). The gate asserts equivalence under the documented customisations, not a byte-for-byte match.

   **Two-phase discipline** is preserved: §3.3 documents the **non-empty** diff between the raw probe and the canonical `auth.ts` **before** integration — that diff is the source of truth the implementer copies columns from. Gate 5 then asserts the canonical schema is in lock-step with the **normalised** probe (raw probe + six customisations).

6. `pnpm --filter @workspace/database db:generate` produces no new SQL (the canonical schema is in lock-step with the migration history). If it produces a diff, the migration is incomplete; resolve before continuing.
7. `psql $DATABASE_URL -c "\d organization"`, `\d member`, `\d invitation`, `\d account_organization_defaults`, `\d account_organization_provisioning` against the dev database show every column and constraint listed in §3.3 and §3.6. `account_organization_provisioning` shows **one** unique index on `operation_id` (no duplicate unique constraint + unique index).
8. The plugin order assertion: `grep -A20 "plugins: \[" packages/auth/src/auth.ts` shows `deviceAuthorization`, `bearer`, `admin`, `organization`, `nextCookies` in that order. Any other order is a regression.
9. The client plugin order assertion: `grep -A5 "plugins: \[" apps/app/lib/auth-client.ts` shows `deviceAuthorizationClient`, `adminClient`, `organizationClient` in that order. The cast on `createAuthClient` is preserved.
10. The smoke checklist runs **seven** scenarios against the dev database, plus a non-regression check on the existing signin/signout/device/GitHub/bearer/Admin flows. The seven scenarios break down as:

    - **3 create-path scenarios** (malformed slug, well-formed slug, unverified account). They share the `createOrganization` hook entry but assert three distinct code paths: the real `assertOrganizationSlug` validator, the stubbed `prepareOrganizationCreation`, and the plugin-level `allowUserToCreateOrganization` predicate.
    - **2 delete-path scenarios** (status code from the refused delete, observed `activeOrganizationId` after the refused delete). They share a single Drizzle fixture and the same `deleteOrganization` call but assert two different observable properties.
    - **1 invitation scenario** with a Drizzle fixture and a `try/finally` cleanup. The invitation row's persistence after a throw is not committed; the test only asserts the HTTP response.
    - **1 baseline signin** (the existing `signIn.email` flow remains unchanged, used to seed the session cookie for the create/delete/invitation scenarios above).

    **Each request uses `auth.api.X({ ..., asResponse: true })` to retrieve the raw `Response` object** so the smoke checklist can assert on `response.status` and `response.json()` rather than catching a thrown `APIError`. Without `asResponse`, the call throws on failure and the test would have to introspect the exception. The `asResponse` option is the documented pattern in the Better Auth API concepts page. **Each request asserts the contract the stubs actually provide** — see §3.4 for why create is a refusal, not a success, in PR-1:

    - `authClient.signIn.email` (or the existing test login) returns a session. The existing flow is unchanged.

    - **Create with malformed slug** — `auth.api.createOrganization({ body: { name: "PR-1 smoke", slug: "Bad Slug" }, asResponse: true, headers })` returns **400** with body code `invalid_slug`. The hook fires, `assertOrganizationSlug` rejects with the typed `APIError`, Better Auth propagates the status and the code. This is the PR-1 path that uses the real validator. The first row in the `organization` table is **not** created.

    - **Create with well-formed slug** — `auth.api.createOrganization({ body: { name: "PR-1 smoke", slug: "pr-1-smoke" }, asResponse: true, headers })` returns **409** with body code `not_implemented` and the message `prepareOrganizationCreation is not implemented in this increment; ships in a later PR.` The hook fires, `assertOrganizationSlug` passes, `prepareOrganizationCreation` (the stub) raises, Better Auth propagates. The first row in the `organization` table is **not** created — the stub throws before `adapter.createOrganization` is reached.

    - **Unverified create** — `auth.api.createOrganization({ body: { name: "PR-1 smoke", slug: "pr-1-smoke" }, asResponse: true, headers })` called by an unverified account returns **403** with the message `Email verification is required`. The `allowUserToCreateOrganization` predicate fires before the hook; the stub is not reached. This is the plugin-level guard, not the stub.

    - **Delete with fixture** — PR-1 cannot create an organization through the plugin (the stub rejects it). To exercise the delete path, the smoke test inserts an organization row and an owner member row **directly via Drizzle** (not through Better Auth), then calls `auth.api.deleteOrganization({ body: { organizationId }, asResponse: true, headers })`. The Better Auth delete route runs its native `findMemberByOrgId` permission check first, then the `beforeDeleteOrganization` hook. The hook calls `assertOrganizationIsDeletable` (the stub), which raises 409 `not_implemented`. The response is **409** with body code `not_implemented` and the message `assertOrganizationIsDeletable is not implemented…`. The organization row remains in the database (the delete was rejected before `adapter.deleteOrganization` ran).

    - **Delete with fixture — session state after refused delete** — the test above must additionally read the caller's session after the refused delete and assert the state of `activeOrganizationId`. The `deleteOrganization` route in Better Auth **1.7.7** (published 30 September 2026 per the official changelog; release notes do **not** mention a fix for better-auth/better-auth#10590) clears the session's `activeOrganizationId` *before* calling `beforeDeleteOrganization` — the upstream bug at issue #10590. The fix is in canary via PR #10890 but is **not in 1.7.7** (the PR was merged after the 1.7.7 release). The implementer must **re-verify on the implementation branch** by reading the file at the locked version: `node_modules/better-auth/dist/plugins/organization/routes/crud-org.mjs` (or the equivalent in the resolved package), and confirm the ordering matches the issue description. If the resolved 1.7.7 happens to include the backport (an unlikely but possible patch release), the test value flips to the org's id; the spec's `expect.toBeNull()` is a deliberate baseline against the documented 1.7.7 source. The smoke test asserts the **observed** behaviour against the resolved version:

      ```ts
      // After the refused delete:
      const session = await auth.api.getSession({ headers })
      // The session response shape: { user, session: { ..., activeOrganizationId: ... } }
      const activeOrg = session?.session?.activeOrganizationId
      // Observed behaviour on the resolved Better Auth 1.7.7: `null` if
      // #10590 is unfixed (per the 30 Sep 2026 release notes), or the
      // org's id if a backport has shipped. The spec pins `null` because
      // that is what 1.7.7 release notes advertise. The implementer
      // re-confirms on the resolved package and updates the pin if the
      // backport has landed.
      expect(activeOrg).toBeNull()
      ```

      The point of the test is to **pin the observed behaviour against the resolved 1.7.7** so a future Better Auth release that flips the ordering is caught before merge. PR-3 may want the *desired* behaviour (session preserved on refused delete) to apply specifically to the protected-default case; that is a separate decision and lives in PR-3's spec. PR-1 only commits to « no regression on the resolved 1.7.7 ».

    - **Create invitation with fixture** — same Drizzle-bypass pattern as delete, **with cleanup**. Insert the organization and the owner member directly, then call `auth.api.createInvitation({ body: { email, role: "member", organizationId }, asResponse: true, headers })`. The native route creates the invitation row, then invokes the `sendInvitationEmail` callback. The callback calls `sendOrganizationInvitation` (§3.5), which throws `APIError("CONFLICT", { code: "not_implemented" })`. The native route propagates the error. The response is **409** with body code `not_implemented` and the message `sendOrganizationInvitation is not implemented…`. The spec does not commit to whether the `invitation` row persists on throw — the upstream Better Auth throw semantics in 1.7.7 are not stable (the email-failure contract probe in PR-6 handles that). The smoke test runs in a `try/finally` that deletes the fixture and any persisted `invitation` row regardless of the throw outcome:

      ```ts
      const inviteEmail = `pr1-smoke-${crypto.randomUUID()}@example.test`
      const org = await db.insert(organization).values({...}).returning()
      const member = await db.insert(member).values({...}).returning()
      try {
        const res = await auth.api.createInvitation({
          body: { email: inviteEmail, role: "member", organizationId: org[0].id },
          asResponse: true,
          headers,
        })
        expect(res.status).toBe(409)
        const body = await res.json()
        expect(body.code).toBe("not_implemented")
      } finally {
        // The invitation row may or may not exist depending on Better Auth's
        // throw semantics; delete both possibilities, plus the fixture.
        await db.delete(invitation).where(eq(invitation.email, inviteEmail))
        await db.delete(member).where(eq(member.id, member[0].id))
        await db.delete(organization).where(eq(organization.id, org[0].id))
      }
      ```

      The unique email per run (`crypto.randomUUID()`) avoids collisions with any prior smoke run on the same dev database. The `finally` block runs whether the assertion passes, the assertion fails, or the route throws before reaching the assertion — the dev database returns to a clean state.

    - The existing signin / signout / device / GitHub / bearer / Admin flows still work. No regression.

The smoke checklist in gate 10 is the only behavioural test in this PR. The rest are configuration and schema gates; a passing gate set is the merge signal. The first end-to-end successful `createOrganization` ships in PR-5, when the provisioning service and the policy helpers are wired together. A 200 response on the create path with a well-formed slug in PR-1 would be a **regression** — it would mean the stub is silently succeeding, which would let an untracked organization enter the database.

## 6. Failure modes and rollback

The PR has two distinct concerns: the **code** (plugin entry, policy stubs, invitation stub, application schema declarations) and the **database state** (the two new migrations and the schema probe). They roll back differently.

**Code rollback.** Reverting the merge commit removes the plugin entry from `auth.ts`, the stubs from `organization-policy.ts` and `organization-invitation.ts`, the application schema declarations, and the client plugin entry. The diff is a normal git revert; no special procedure. The application returns to the pre-PR-1 state on next build.

**Database rollback.** Reverting the merge commit does **not** un-apply the migrations. Drizzle Kit treats `db:generate` (writes the SQL + snapshots) and `db:migrate` (applies the SQL to a target database) as two separate steps; the generated SQL does not embed a `DROP TABLE` companion. A database that has had `0003_organizations.sql` and `0004_organization_application_state.sql` applied keeps those tables and columns after the code rollback, which leaves a half-state: the application no longer references the tables, but the schema and the column constraints remain. This is the additive pattern by design — V1 ships against an empty user base, and reverting code without the schema is the safe direction.

If a database rollback is required (for example, on a staging environment that must be reset before a re-deploy), ship a **compensating migration** rather than relying on git revert. A plain `db:generate --name=...` produces no SQL because the schema has not changed since the last migration; use the `--custom` flag to generate an empty migration file that the operator hand-fills, per the Drizzle Kit custom-migrations documentation:

```bash
pnpm --filter @workspace/database db:generate --custom --name=drop_organizations_v1
```

The flag combination produces an empty `<index>_drop_organizations_v1.sql` file and the matching snapshot under `meta/`. The operator hand-fills the SQL:

```sql
DROP TABLE IF EXISTS "account_organization_provisioning";
DROP TABLE IF EXISTS "account_organization_defaults";
DROP TABLE IF EXISTS "invitation";
DROP TABLE IF EXISTS "member";
DROP TABLE IF EXISTS "organization";
ALTER TABLE "session" DROP COLUMN IF EXISTS "active_organization_id";
```

**Do not commit this migration to the shared history.** If the operator generates the file, applies it locally, and the file lands in `meta/_journal.json`, every subsequent `db:migrate` against a fresh database — including CI, preview deploys, and new staging environments — runs the migrations in order: `0003_organizations.sql` (creates the tables), `0004_organization_application_state.sql` (creates the application tables), then the compensating migration (drops them). The fresh database ends up with **no Organizations schema**, and the application breaks on first request. Drizzle Kit applies custom migrations as ordinary migrations; the order in the journal is the order of execution. The `IF EXISTS` guards do not save us here: a fresh database that applied the create migrations and then the compensating migration has nothing to drop (the tables were just created), and the migration succeeds — but leaves the schema empty.

The compensating migration is therefore a **targeted reset procedure for a specific database** (the operator's local dev DB, or a particular staging instance that has misbehaving data), **not** a reproducible teardown. The procedure is:

1. On the target database, run the `db:generate --custom` command to produce the empty file.
2. Hand-fill the SQL above.
3. **Apply the file directly with `psql` against the target database, bypassing `db:migrate`**, so the operation does not enter the journal. Alternatively, run the SQL inline in `psql`.
4. Do **not** commit the file. Do **not** run `db:migrate` against a database whose journal contains the compensating migration.
5. If a future deployment needs to recreate the Organizations schema from scratch, ship **new** create migrations (or re-deploy an older revision that still contains `0003` / `0004`) rather than relying on a `DROP` migration in the history.

The compensating migration is **not** part of the PR-1 merge commit under any circumstance. PR-1 ships only the create migrations; the reset procedure is operator-local and out-of-band.

**Smoke test as a canary.** The smoke checklist in gate 10 is the canary: a green run means the plugin is wired, the stubs return the typed errors, and the schema is in place. The seven scenarios cover the five code paths the downstream PRs build on (create, delete, unverified-create, invitation, session-state-on-refused-delete) and one baseline flow (existing signin). A red run means the wiring is broken; a release blocker for the rest of the stack.

If `db:generate` produces a diff in gate 6, the most likely cause is a column the CLI emits that was missed in the integration. Compare the diff against §3.3 column-by-column. Do not regenerate the migrations from the diff — the six runtime-required customisations are not recoverable from the CLI output alone.

If gate 8 (plugin order) fails because `nextCookies()` is no longer the last entry, the dev experience breaks in non-obvious ways (cookie set in a non-final plugin may be clobbered). Reorder the plugins; do not skip the gate.

If `db:check` in §3.7 reports a divergence between the SQL and the schema (a non-zero exit), the journal and the snapshots are out of sync. Do not hand-edit the journal; regenerate the affected migration.

## 7. References

- Implementation epic: GitHub issue #223 — Organizations V1
- Parent spec: `docs/specs/organizations-v1.md` §3 (PR-1 entry), §2 (architecture), §4 (cross-cutting)
- RFC: see `docs/specs/organizations-v1.md` for the v4 RFC content mirrored into the spec
- Better Auth 1.7.7: organization plugin options, `additionalFields` with `input: false`, `organizationHooks`, the create route's `toZodSchema({ isClientSide: true })` filter
- Better Auth upstream history: #7489 (`input: false` / `returned: false` semantics), #7504, #7530, #7531
- Better Auth Admin plugin: how it integrates with the existing user and session columns (preserved verbatim in this PR)
- Schema probe procedure: documented at the top of `packages/database/src/schema/auth.ts`
- Existing customisations preserved: `deviceCode` table name, FK on `userId`, `deviceCodeRelations`, lookup indexes (also documented at the top of `auth.ts`)
- TS2883 rationale: the comment block on `authConfig` in `packages/auth/src/auth.ts` (do not remove the `BetterAuthOptions` annotation or the public-export cast)

## 8. Acceptance criteria

| Scenario | Required result |
|---|---|
| `pnpm typecheck` across the workspace | Green. The `BetterAuthOptions` annotation and the public-export cast remain. |
| `pnpm build` across the workspace | Green. `@workspace/auth`, `@workspace/database`, `apps/app`, `packages/api` all build. |
| `pnpm lint` | Green (`--max-warnings=0`). |
| `pnpm test` | Existing test suite still passes. No test added. |
| `auth:generate` diff against canonical `auth.ts` after normalisation | Empty diff (exit code `0`) between the canonical `auth.ts` and a **normalised** probe that re-applies the six documented customisations (`deviceCode` table name, FK on `userId`, `deviceCodeRelations`, the two `deviceCode` lookup indexes, the Admin plugin columns on `user`, the `userRelations.deviceCodes` back-reference). A plain `git diff --no-index` against the raw probe is not the gate — it is expected to differ in those six places. The implementer runs the one-shot normalisation script under `scripts/` (or applies the transformations inline) before the diff. |
| `db:generate` after migrations are in place | No new SQL emitted. |
| `\d` against dev DB | All five new tables and the new `active_organization_id` column exist with the constraints listed in §3.3 and §3.6. `account_organization_provisioning` has **one** unique index on `operation_id`. |
| Plugin order in `auth.ts` | `deviceAuthorization`, `bearer`, `admin`, `organization`, `nextCookies`. |
| Plugin order in `auth-client.ts` | `deviceAuthorizationClient`, `adminClient`, `organizationClient`. |
| `bootstrapOperationId` additional field config | `type: "string"`, `required: false`, `unique: true`, `input: false`, `returned: false`. Both `input: false` and `returned: false` are present. |
| Native `createOrganization` (verified, well-formed slug) | 409 with body code `not_implemented` and message starting with `prepareOrganizationCreation is not implemented`. **No row inserted.** The first end-to-end successful create ships in PR-5. |
| Native `createOrganization` (verified, malformed slug) | 400 with body code `invalid_slug` and message matching `Organization slug must be 2–38 lowercase ASCII characters…`. The PR-1 `assertOrganizationSlug` validator is reached and rejects. **No row inserted.** The regex `^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$` requires **two or more** characters (the trailing class is mandatory), so a single-character slug like `"a"` is rejected with the same 400 `invalid_slug`. |
| Reserved slug submitted to `createOrganization` (e.g. `account`, `admin`, `deessejs`, `nesalia`) | 400 with body code `invalid_slug`. The reservation list rejects before `prepareOrganizationCreation` is reached. |
| Native `createOrganization` (unverified) | 403 with `Email verification is required`. The plugin rejects before the hook runs. |
| Native `deleteOrganization` (verified, with Drizzle fixture) | 409 with body code `not_implemented` and message starting with `assertOrganizationIsDeletable is not implemented`. The organization row remains; the hook rejected before `adapter.deleteOrganization` ran. |
| Session state after a refused `deleteOrganization` | `session.session.activeOrganizationId` is `null` after the refused delete. The 1.7.7 source (crud-org.ts, deleteOrganization handler) calls `adapter.setActiveOrganization(token, null, ctx)` **before** the hook; the hook's rejection does not restore the session. The smoke checklist asserts `expect(activeOrg).toBeNull()`. A future backport of better-auth/better-auth#10890 that defers the clear would flip this to the org's id; the assertion catches that before merge. PR-3 owns the *desired* behaviour for the protected-default case as a separate decision. |
| Native `createInvitation` (verified, with Drizzle fixture) | 409 with body code `not_implemented` and message starting with `sendOrganizationInvitation is not implemented`. The spec does not commit to a particular state for the `invitation` row on throw (PR-6's email-failure contract probe handles that). |
| Smoke test API call convention | All assertions use `auth.api.X({ ..., asResponse: true })` and read `response.status` + `await response.json()`. The default behaviour (thrown `APIError`) is not used in the smoke test. |
| Browser-supplied `bootstrapOperationId` to `createOrganization` | The body parser (`toZodSchema({ isClientSide: true })`) strips the field because of `input: false`. The value is not persisted. Verify with a follow-up DB read on the `organization` table. |
| `bootstrapOperationId` in response to `createOrganization` | **Never present** in the response body. The adapter's `filterOutputFields` strips it because of `returned: false`. Verify by parsing the response JSON and asserting the key is absent. The field is server-only at read and at write. |
| Existing signin / signout / device / GitHub / bearer / Admin flows | Unchanged. No regression. |
| Proxy and routing | Unchanged. The PR does not touch `apps/app/proxy.ts` or any route file outside `lib/auth-client.ts`. |
| Migration tooling | Both migrations generated via `drizzle-kit generate --name=...`; the SQL files and the snapshots under `meta/` agree; `db:check` exits `0` before applying. |
| Code rollback (operator action) | `git revert` of the merge commit restores `auth.ts` and the application code to the pre-PR-1 state on next build. The database tables remain in place (additive pattern). A compensating migration is the documented path to drop them. |

Acceptance coverage map: server plugin wiring → §3.1; client plugin wiring → §3.2; schema integration → §3.3; policy stub → §3.4; invitation stub → §3.5; application schema → §3.6; migrations → §3.7; failure handling and rollback → §6.

**Test status clarification.** The acceptance criteria above describe a **manual smoke checklist** the implementer runs against the dev database before opening the PR. The checklist produces captured status codes and response bodies that the reviewer reads. It is **not** a committed test suite: §4 lists « No tests against the new tables. PR-8 ships the integration tests. » as an explicit non-goal, and gate 4 asserts the existing test suite still passes without any addition. PR-8 turns this checklist into committed integration tests.
