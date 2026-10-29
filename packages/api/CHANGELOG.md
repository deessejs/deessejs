# @workspace/api

## 0.1.0

### Minor Changes

- bbe9519: Adds 7 new entries to the templates registry in `packages/api/src/templates.ts`, expanding the catalog returned by `GET /api/v1/templates` from 1 entry to 8.

  New entries:

  - `saas-starter-multi-tenant` → `deessejs/saas-template-multi-tenant`
  - `electron-starter` → `deessejs/complete-electron-template`
  - `docs-starter` → `deessejs/documentation-template`
  - `landing-starter` → `deessejs/landing-template`
  - `blog-starter` → `deessejs/blog-template`
  - `package-starter` → `deessejs/package-template`
  - `eve-starter` → `deessejs/eve-template`

  Each entry uses GitHub's canonical `description` when present and a curated editorial fallback otherwise (for repos whose GitHub description is empty). All `layer` values are `open-community` for now; re-classification is a marketing/business decision tracked outside this PR.

  `cli-template` (private) and `pro-template` (private) are intentionally excluded from this PR. The first needs a verified `GITHUB_TOKEN` with read access to private repos; the second needs its visibility/description sorted out before it can ship.

  No breaking change for installed CLI V1 clients: the wire format (`TemplateV1`) is unchanged, only the count of items in the array changes. Apps that iterate the array are unaffected.

- 3f40fd1: Add the `/playbook` lead-magnet landing page: single email field +
  optional consent checkbox + a `Resend Topic` subscription for
  future-marketing opt-in + transactional PDF email via the existing
  `mailer` singleton. Includes in-memory rate-limit and email-dedup
  primitives on the orpc side that mirror the existing Hono
  middleware. Funnel aliases `/ig`, `/x`, `/in` capture social-media
  clicks onto the same page.

  The consent checkbox subscribes the contact to a Resend Topic, which
  models a subscription preference. A Segment is for internal ranking
  and is not used. `RESEND_PLAYBOOK_TOPIC_ID` names the Topic and is
  required in production, so the checkbox cannot look like it works
  while recording nothing.

  The PDF deliverable is at `apps/web/public/playbook.pdf`, and the
  signup email links it at `<WEB_URL>/playbook.pdf`. The three funnel
  pages are force-dynamic and noindex so they never resolve to a stale
  redirect and search engines skip them.

  ## Operational prerequisites
  - `RESEND_PLAYBOOK_TOPIC_ID` must be set in every environment that
    serves production traffic. It is the id of a Resend Topic, created
    in the dashboard under Audience, Topics. The env schema rejects a
    missing value at startup in production, so this is a startup
    failure rather than a silent no-op.
  - The marketing emails go out as Broadcasts or Automations, which
    carry the Resend-managed unsubscribe footer. The PDF email points
    there, since a transactional send carries no unsubscribe link of
    its own.

- 990b38c: Adds the organization access rule as a server-side procedure, and makes the session reach it.

  The rule lives in `packages/api` now, in three procedures mounted under `organization` in the oRPC router: `organization.bySlug` (membership), `organization.settings` (membership and a managing role, `owner` or `admin`) and `organization.active` (the state of the caller's active selection). The check is in the procedure's middleware, so a procedure cannot forget it and a caller cannot reach the data without it.

  The check reads the membership row directly instead of calling a plugin endpoint, and that is the point. Better Auth's `/organization/get-organization` and `/organization/get-full-organization` clear the caller's active organization before refusing, so using one as a check for an arbitrary slug would take away a selection the caller still has every right to. The predicate is the plugin's own, a `member` row exists for this user and this organization, so the procedure and the plugin cannot disagree about who belongs to an organization.

  Only an empty membership read is mapped to `ORGANIZATION_ACCESS_DENIED`. Every other failure propagates, so a database outage is a 500 and not a 403, and there is no blanket catch around the read.

  The two native organization-read endpoints are disabled through Better Auth's `disabledPaths`. Beyond the side effect above, they change the session on a `GET`, and Better Auth's origin check returns early for `GET`, so a third-party page could clear a signed-in user's active organization by navigating to one of them. The application's own procedures replace them.

  The oRPC mount now carries the response status. It spread the response into the new `Response`, and `status` is a prototype getter on a `Response`, so the spread copied nothing and every oRPC error answered `200`. The oRPC client decides whether a response is an error from the HTTP status, so an error that arrived as a `200` was read by the client as a result, and the caller received the error object as if it were the payload.

  Three existing assertions in `packages/api/tests/integration/rpc/templates.test.ts` were vacuous because of this: they asserted `status !== 502` to prove the e2e guard had not fired, and the status was always `200`, so they could not fail. They now assert on the forced failure itself, which is distinguishable by its message. The behaviour they pin is unchanged.

  The same file's routing test asked whether the procedure had answered, and the answer it wanted was a `200`. With the status carried, a GitHub outage answers `502` and the test failed for a reason that had nothing to do with routing. It now asks the question it was written to ask: did the oRPC handler answer at that URL, or did the notFound fallback? The call goes through the e2e guard, so it reaches GitHub zero times, and the test sits outside the GitHub gate, so the routing contract is checked whether the upstream is reachable or not.

  The e2e guard's decision is now a function of the request headers, exported so that its contract can be pinned without a request. Testing it through the handler left the guard closed, so each request continued to the catalog enrichment, which asks GitHub for fourteen requests, and three cases spent forty-two of them outside the quota gate that guards the network test. The behaviour is unchanged: the guard is still closed by default, still closed in production, and still inert when the bypass header does not match.

  `packages/auth` gains the role convention as a module of its own, `src/organization/roles.ts`, exported as `@workspace/auth/organization/roles`. Better Auth stores the roles a member holds as a comma-separated string and every role check in the plugin splits on commas, so a member stored as `"admin,owner"` holds both roles. The comparison lives in one place because the interface has to show an owner-only affordance to exactly the people the API allows to use it. The exported `Session` type also carries the organization plugin's `activeOrganizationId` field, which the procedures read.

  `apps/app` forwards the session cookie through the oRPC link, so a server-side call reaches the API as the caller and not as an anonymous request, and the router import becomes type-only so the API's server-only graph stays out of the app's client bundle.

- 898c8ab: Adds the organization creation flow, and the routing that makes it land somewhere.

  A verified account can now create its first organization by giving a name. The slug is the server's: the procedure's input has no slug field, Zod drops the one a caller sends, and the native `/organization/create` endpoint is disabled so there is no other door. The slug is generated from the name, and a collision is retried against the database over a bounded sequence of candidates, so a name that is already taken gets the next free form rather than an error.

  The creation is not one call. The plugin writes the organization, then its membership, then the caller's active selection, and the process can fail or die between them. `packages/database` gains an `organization_provisioning` table: one row per attempt, with a partial unique index that lets an account hold one attempt in flight at a time. The attempt's id is the marker, and it travels in the organization's own metadata, written by the insert itself, so an organization either carries its attempt's marker or it does not belong to that attempt.

  That marker is what makes the recovery safe. An interrupted creation is found through the operation's slug and the marker, and the flow either adopts it, when it has a membership for the account, or removes it, when it does not. The removal is by the organization's id, never by a slug alone: a slug proves there is one row with that slug, not that this request owns it. A failure that aborts an attempt compensates the same way, and an organization this request never created survives it. The compensation is conditional on the attempt still holding the operation, so it cannot undo a recovery that adopted the organization.

  A recovery holds the account while it runs. The operation it took over stays covered by the account's unique index, so a second attempt cannot start beside it, and the reconciliation ends the operation when it is done. The active selection is restored before the operation is finalized, so a failure in the middle leaves the operation claimable and the next attempt reconciles it again and adopts the same organization, rather than creating a second one.

  The check that stops a superseded attempt from creating anything is in the database, not in the application. A `BEFORE INSERT` trigger reads the marker out of the row being inserted, locks the operation row it names, and refuses the insert when the operation is no longer pending. The lock is what makes the check atomic with the insert: a takeover waits for it, so the loser of the race observes the winner's state rather than a stale copy. The refusal carries the SQLSTATE `D0001`, which the flow reads on the error the way it reads the unique violation's `23505`, and it is a 409 rather than a failure: the attempt was overtaken, not broken.

  The marker's life is protected. The create hook refuses a creation that carries no marker, so the metadata is the application's alone, and the update hook refuses an update that would change or remove the marker of an organization whose operation is not finished. The native update endpoint stays open, because the organization's profile editing is part of the product.

  The refusals are declared, so the client reads a stable code instead of the plugin's own errors: `ORGANIZATION_NAME_INVALID` is a 400, `ORGANIZATION_EMAIL_VERIFICATION_REQUIRED` is a 403, `ORGANIZATION_CREATE_IN_PROGRESS` is a 409, and `ORGANIZATION_CREATE_FAILED` is a 500. An account whose email is not verified gets the 403 rather than the plugin's unrecognised refusal, which would have been reported as a server failure.

  `apps/app` gains the route topology the flow needs. The workspace is `/[organization_slug]/*`, and the layout resolves the slug through the API procedure, so a page under it belongs to that organization and the API refuses a caller who does not belong to it. The empty state is `/no-organization`, and `/home` resolves to the workspace or to the empty state, carrying the query string across the hop. The empty state never repairs the caller's selection by itself: the caller picks, and the pick calls the endpoint that owns that write.

  The request guard classifies a path instead of matching a list, because the workspace tree's first segment is not known in advance. A path whose first segment the application owns is an application route, any other first segment is an organization slug and is protected, and a path with a file extension is a file and is never gated, which is what keeps a nested asset out of the gate. The reserved slug set moves to a module of its own so the guard can read it without pulling the authentication stack into the browser bundle, and it grows with the two segments this change introduces.

  The create dialog is a client component, so it calls a browser oRPC client: the server client is a server module, and the browser is on the same origin as the API, so the session travels on its own.

- f806fc0: Add V1 project configuration parsing and serve its JSON Schema through the API.

### Patch Changes

- 15dd75e: Add admin-only procedures for listing and creating official templates from GitHub.
- 5e9a36a: Add organization-scoped home pages for imported GitHub projects.
- 03eabde: List GitHub repositories in the project import flow.
- eee4493: Redesign the templates index cards (rotated hero image, latest-guides vocabulary) and remove `saas-starter-multi-tenant` from the registry while it is being stabilised.

  - `@workspace/contracts`: adds an optional `image` field to `TemplateV1`. The field is `string | undefined`, so existing clients continue to parse without change.
  - `@workspace/api`: declares the seven remaining templates' cover images in the static registry. The `enrich` step spreads `...entry`, so `image` propagates automatically. `saas-starter-multi-tenant` is removed.
  - `web`: `templates/page.tsx` stylises the "Ship your template" CTA (transparent background, top border only, no radius). `templates/template-card.tsx` and `templates/template-detail.tsx` consume `template.image` and render the hero with the same `-rotate-3 origin-bottom-right translate-x-[10%] translate-y-[10%]` chrome as the homepage latest-guides carousel. Homepage coding-agents h2 used `lg:text-heading-48` (one step above the rest of the homepage) — now aligned at `lg:text-heading-40`.

- ba74f0c: Hardens the wire error contract for the `templates.list` oRPC procedure, in support of issue #81 on the marketing site.

  - `packages/api/src/orpc/routes/templates.ts` now declares the wire-code via `.errors({ TEMPLATES_FETCH_FAILED: ... })` and translates any throw from `enrich()` into `ORPCError("TEMPLATES_FETCH_FAILED", { status: 502 })`. The HTTP status is 502 (Bad Gateway — GitHub is the upstream dependency), not 503 as previously documented. Clients used to the documented 503 should treat any non-2xx as retriable; the status code is informational. The typed client can now branch on `err instanceof ORPCError && err.code === "TEMPLATES_FETCH_FAILED"` to render an "upstream registry unavailable" state distinct from a generic 500.
  - `packages/api/src/http/mount-rpc.ts` now sets `Cache-Control: no-store` on every response from `/rpc/*`. RPC responses are user-/session-derived and time-sensitive; a CDN/proxy in front of the API must not cache them. The header is independent of any route-level fetch cache the client opts into via Next.js ISR directives on `fetch`.
  - `packages/api/src/core/templates/enrich.ts` JSDoc is updated to match the implementation: `enrich()` is intentionally low-level and surfaces raw `Error` instances. Translation to `TEMPLATES_FETCH_FAILED` lives one layer up in the handler — keeping the core layer pure makes both layers individually testable and prevents the wire-code from leaking into the registry.
  - `packages/api/tests/integration/rpc/templates.test.ts` adds a unit-style block that pins this contract: `enrich()` rejects with a plain `Error` when GitHub returns non-OK, and does not translate errors itself.

  No consumer of the templates procedure is required to update. The marketing-site change in PR #85 reads the wire-code through `error.tsx` and the `error.digest` only; the typed client API surface is unchanged.

- fbd06d7: Inspect and review the root deesse.json configuration of a selected GitHub repository.
- 0d0f793: Add GitHub App authorization and organization installation linking.
- 2dd0c6e: Add private organization-owned templates with GitHub repository snapshots.
- a1cf6f8: Persist reviewed GitHub repositories as organization projects and list their validation metadata in the dashboard.
- dc7fd29: Avoid redundant session lookups on Better Auth and public API routes.
- d37a109: Include the organization logo in the member-facing organization summary.
- 468effd: Gives every catalog category a display label and allowlists the deployed template images.

  `CATEGORY_LABELS` held `saas`, `ai` and `landing` while the registry uses seven categories, so
  the intersection was `saas` alone. Six of the seven templates could not be reached through any
  type filter, and `?type=ai` returned nothing even for `eve-starter`, whose curated labels
  include `ai`. Six labels are added: `desktop`, `docs`, `marketing`, `content`, `library` and
  `ai-agent`.

  This is a visible correction, not a behavior-preserving change. The Type filter grows from three
  options to nine. Seven of them now return their row; `ai` and `landing` stay at zero, because no
  template's category is `ai` or `landing`, and `eve-starter`'s category is `ai-agent`, a separate
  key. Both keys are kept: they are the public slugs of two type filters, and removing them would
  change what the sidebar renders for no other reason.

  Adds `packages/api/src/templates-images.ts`, the allowlist of the seven template images deployed
  in `apps/web/public`, exported as the `@workspace/api/templates-images` subpath so a writer can
  validate a submitted filename against the list without accepting a path.

  `packages/api/tests/unit/category-maps.test.ts` pins the map against the registry and the
  allowlist against the deployed files. `apps/web/tests/unit/template-category-filters.test.ts`
  pins the filter itself, which moved out of the page into `apps/web/src/lib/template-filters.ts`
  so it can be asserted on directly.

- 2befd40: Read the public templates catalog and slug resolution from the database-backed catalog.
- e48d446: Fix GitHub App installation verification after setup.
- Updated dependencies [8bc8916]
- Updated dependencies [ac69a68]
- Updated dependencies [3b7120e]
- Updated dependencies [9eb82ec]
- Updated dependencies [eee4493]
- Updated dependencies [af040af]
- Updated dependencies [3f40fd1]
- Updated dependencies [0d0f793]
- Updated dependencies [990b38c]
- Updated dependencies [898c8ab]
- Updated dependencies [ebd1cd2]
- Updated dependencies [2dd0c6e]
- Updated dependencies [f806fc0]
- Updated dependencies [a1cf6f8]
- Updated dependencies [9a78e01]
- Updated dependencies [3ffb41a]
  - @workspace/auth@0.1.0
  - @workspace/env@0.1.0
  - @workspace/registry@0.1.0
  - @workspace/contracts@0.0.2
  - @workspace/email@0.1.0
  - @workspace/database@0.1.0

## 0.0.2

### Patch Changes

- Updated dependencies [83a37b0]
  - @workspace/database@0.0.1
  - @workspace/auth@0.0.2

## 0.0.1

### Patch Changes

- 28f8e6f: fix(api): `/ready` endpoint now pings Postgres before returning 200. The previous handler wrapped `c.json()` in a try/catch, but `c.json()` never throws — it just builds a Response — so the endpoint always returned `{ status: "ready" }`, giving Kubernetes and load balancers a false ready signal when the database was unreachable. Replaced with `await db.execute(sql\`SELECT 1\`)`; connection failures (ECONNREFUSED, ETIMEDOUT, pool exhaustion) now correctly return 503.
- Updated dependencies [03712ca]
  - @workspace/auth@0.0.1
