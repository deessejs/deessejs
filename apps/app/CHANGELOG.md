# app

## 0.2.0

### Minor Changes

- 4df3461: Adds the device authorization verification surface on the web side, the consumer-facing counterpart to the CLI's `deesse auth login`.

  - New page at `/(unprotected)/(auth)/device` — a thin Server Component that reads `user_code` from the URL query string, validates the shape with a new Zod `userCodeSchema` (8 chars from the base32 RFC 4648 alphabet sans I, O, 0, 1), and renders the new `DeviceForm` component. Lives in the `(unprotected)/(auth)` sub-group alongside `login`, `signup`, `forgot-password`, `reset-password`, and `verify-email`, and inherits the centered `AuthContainer` layout from `(auth)/layout.tsx`.
  - New `DeviceForm` client component at `apps/app/components/auth/device-form.tsx`, re-exported from the auth barrel. Owns the four device-flow states (not signed in / claimed pending / approved / denied or expired) using `@tanstack/react-query` exclusively: `useQuery` for `authClient.device({ query: { user_code } })`, two `useMutation` for `authClient.device.approve(...)` and `authClient.device.deny(...)`. No raw `useState` or `useEffect` for the state machine.
  - `apps/app/lib/auth-client.ts` adds the `deviceAuthorizationClient()` Better Auth plugin so the four client methods (`authClient.device`, `device.approve`, `device.deny`, plus `device.code` and `device.token` for the CLI) are typed at the call site.
  - `apps/app/app/layout.tsx` mounts a new `QueryClientProvider` at the root, mounted _outside_ the theme and tooltip providers so every consumer is in scope.
  - `apps/app/proxy.ts` adds `/device` to `AUTH_PREFIXES` so a user already signed in is not bounced to `/login` when the CLI opens the browser to the verification URL.

  No user-visible behaviour change in normal operation. A user running `deesse auth login` on a fresh machine sees the verification page open in the browser, signs in (or is already signed in), sees an Approve / Deny panel, clicks Approve, the CLI picks up the session token on its next poll, and the user closes the tab. The page does not gate on `emailVerified`; the existing email-verification gate that protects `/home` and `/settings` is unchanged.

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

- ebd1cd2: Adds the workspace shell: the rail, the organization switcher, the organization's navigation and the account menu.

  The workspace is navigable now. The rail names the organization the page belongs to, lists the organization's own pages under it, and carries the account menu at the bottom. The switcher lists the organizations the caller belongs to, marks the one the page is on, and choosing another one writes the session's active selection and lands the caller in that organization's workspace.

  The selection stays the caller's choice. Nothing in a page view writes it, so opening another organization's page directly shows that organization while the session keeps pointing at the first one, until the caller switches explicitly through the rail. `/home` resolves to the session's selection, so the two can disagree, and the rail is the only thing that settles it.

  The switcher creates an organization too, through the same dialog the empty state uses. The list refreshes itself after a creation, because the creation goes through the API and not through the plugin's own endpoint, so the plugin's invalidation never fires.

  A switch the server refuses, and a switch that never reaches the server, are shown with the same words: the organization could not be selected. The browser cannot tell them apart, and a rail that blamed the caller for the server's absence would be lying.

  The rail's open state survives a reload. The sidebar writes it in a cookie and never read it back, so the layout reads the cookie and hands the value to the sidebar, and the preference applies from the first paint.

  The rail's header is the height of the page's own header and carries the same separator, so the two read as one line across the window. The footer carries its own, and the three parts of the rail carry the page's background, so the rail reads as part of the page rather than as a surface of its own.

  `packages/ui` gains the cookie's name in a module of its own, without the `"use client"` directive, and declares it in the package's exports map. A server component cannot read a constant out of a client module: the React server runtime answers every named export with a proxy around a function that throws when it is called, so the lookup would silently find nothing and the preference would never apply.

  The account settings keep their own rail. The two navigations cover two scopes, on two surfaces, and the workspace's navigation stays organization-scoped.

  The empty state becomes an organizations page. `/organizations` lists every organization the caller belongs to, with a search field, a create action and a grid of cards, and the caller picks one from it. It replaces `/no-organization`, which named what the page was for rather than what it shows. The reserved slug set moves with it: `organizations` is the application's own segment now, and the application owns the URL.

  The account menu names the account. Its trigger shows the avatar, the name and the email, and the menu repeats the identity at its head before the entries. The menu is mounted in the rail's footer and in the header of the surfaces that have no rail, so the identity is hidden on a narrow viewport, where the header has no room for it. The menu itself always names the account.

### Patch Changes

- 5e9a36a: Add organization-scoped home pages for imported GitHub projects.
- 03eabde: List GitHub repositories in the project import flow.
- fad984b: ci: enforce strict Oxlint and suppression bans
- af040af: Implements first-class inter-app URLs in `@workspace/env`,
  removing the relative-path construction in three consumers.

  User-visible:

  - `https://deessejs.com/templates` and
    `https://deessejs.com/templates/[slug]` now render the populated
    catalog and the detail page respectively. Previously, the
    marketing site's oRPC client fetched `/api/v1/rpc/templates/list`
    relative to `deessejs.com`, which does not host the backend (the
    catch-all lives in `apps/app/app/api/[[...route]]/route.ts` on
    `app.deessejs.com`). The marketing site was showing the documented
    empty state and `/templates/[slug]` returned a Next.js 500.
  - `npx @deessejs/cli list` (and every other published CLI command)
    now resolves the API host to `https://app.deessejs.com` by
    default, instead of failing because it resolved the URL against
    the user's working directory.

  API surface:

  - `@workspace/env` gains four server fields (`WEB_URL`, `APP_URL`,
    `DOCS_URL`, `API_BASE_URL`) and four client fields
    (`NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`,
    `NEXT_PUBLIC_DOCS_URL`, `NEXT_PUBLIC_API_BASE_URL`). Defaults are
    localhost ports in dev and the canonical Vercel domains in
    production. A `.refine` rejects trailing slashes at parse time.
  - `apps/web/src/lib/orpc.ts` builds the oRPC URL via
    `new URL(API_RPC_PATH, clientEnv.NEXT_PUBLIC_API_BASE_URL)`.
  - `apps/app/proxy.ts` builds the auth probe URL via
    `new URL(path, serverEnv.API_BASE_URL)`.
  - `apps/cli/src/api/client.ts` and `apps/cli/src/version/check.ts`
    read `process.env.API_BASE_URL` directly (the published tarball
    cannot depend on the private `@workspace/env` package). Override
    via shell env (`API_BASE_URL=https://staging.example.com
deessejs list`).

  Tests:

  - New unit suite at `packages/env/tests/unit/schema.urls.test.ts`
    pins the URL contract (defaults parse, production URLs parse,
    trailing slashes rejected, non-URLs rejected).

  Vercel env (operational, no code change):

  - Production: `API_BASE_URL=https://app.deessejs.com` and the
    `NEXT_PUBLIC_API_BASE_URL` mirror must be set on `apps/web`'s
    Vercel project.
  - Production: `ALLOWED_ORIGINS` on `apps/app`'s Vercel project must
    include `https://deessejs.com` for the cross-origin
    no-credentials fetch from the marketing site (see the
    Cross-origin considerations section of the inter-app URL
    config).
  - Preview deployments: each Vercel preview defaults to
    `https://app.deessejs.com` (the schema default). A future
    write-up covers preview-vs-preview wiring.

- b6a2a06: Fixes the device verification page redirecting authenticated users to `/home` when the CLI opens the browser to `/device?user_code=XXX`. The CLI's `deesse auth login` command opens the verification URL via the OS-default browser; users already signed in to `app.deessejs.com` were bounced to `/home` instead of seeing the approve / deny panel.

  Root cause: `apps/app/proxy.ts` listed `/device` in `AUTH_PREFIXES`. After the device-auth fixes PR added `/device` to the proxy's `config.matcher` so the page-level redirect (anonymous → `/login?redirect=...`) could run, the existing bounce-to-`/home` branch for authenticated users on auth pages started firing on `/device` as well — contradicting both the inline comment ("a user already signed in lands directly on the approve / deny view") and the second bug noted in the device-auth fixes write-up, which records the bounce direction as wrong for this route.

  Fix: remove `/device` from `AUTH_PREFIXES`. The proxy still intercepts `/device` (the matcher entry is preserved) so it can self-fetch `/api/v1/auth/get-session` and forward the session cookie, but the page-level Server Component at `app/(unprotected)/(auth)/device/page.tsx` owns the routing decision:

  - Anonymous visitor → `redirect("/login?redirect=/device?user_code=<code>")` (unchanged).
  - Authenticated visitor → renders `<DeviceForm userCode={userCode}>` with the approve / deny state (now reachable in practice).

  No public consumer-facing API change. No new dependency. The `AUTH_PREFIXES` array's purpose — bounce authenticated users away from form-based auth pages (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`) — is unchanged; `/device` is a transactional page inside the auth flow, not an auth entry point, so it does not belong on that list. Inline comments on both `AUTH_PREFIXES` and `config.matcher` are updated to reflect the new invariant and point future readers at the device-auth fixes write-up for the rationale.

- fbd06d7: Inspect and review the root deesse.json configuration of a selected GitHub repository.
- 0d0f793: Add GitHub App authorization and organization installation linking.
- 2dd0c6e: Add private organization-owned templates with GitHub repository snapshots.
- f806fc0: Add V1 project configuration parsing and serve its JSON Schema through the API.
- a1cf6f8: Persist reviewed GitHub repositories as organization projects and list their validation metadata in the dashboard.
- 7d736ce: Migrate workspace linting and formatting from ESLint and Prettier to Oxlint and Oxfmt.
- d425018: Load account and session settings through TanStack Query.
- Updated dependencies [15dd75e]
- Updated dependencies [8bc8916]
- Updated dependencies [ac69a68]
- Updated dependencies [5e9a36a]
- Updated dependencies [03eabde]
- Updated dependencies [eee4493]
- Updated dependencies [bbe9519]
- Updated dependencies [af040af]
- Updated dependencies [3f40fd1]
- Updated dependencies [ba74f0c]
- Updated dependencies [fbd06d7]
- Updated dependencies [0d0f793]
- Updated dependencies [990b38c]
- Updated dependencies [898c8ab]
- Updated dependencies [ebd1cd2]
- Updated dependencies [2dd0c6e]
- Updated dependencies [f806fc0]
- Updated dependencies [a1cf6f8]
- Updated dependencies [dc7fd29]
- Updated dependencies [d37a109]
- Updated dependencies [468effd]
- Updated dependencies [2befd40]
- Updated dependencies [3ffb41a]
- Updated dependencies [e48d446]
  - @workspace/api@0.1.0
  - @workspace/auth@0.1.0
  - @workspace/env@0.1.0
  - @workspace/contracts@0.0.2
  - @workspace/ui@0.1.0
  - @workspace/analytics@0.0.2
  - @workspace/cookies@0.0.2

## 0.1.2

### Patch Changes

- @workspace/api@0.0.2
- @workspace/auth@0.0.2

## 0.1.1

### Patch Changes

- Updated dependencies [03712ca]
- Updated dependencies [28f8e6f]
  - @workspace/auth@0.0.1
  - @workspace/api@0.0.1
