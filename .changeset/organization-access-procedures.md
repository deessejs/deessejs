---
"@workspace/api": minor
"@workspace/auth": minor
"app": minor
---

Adds the organization access rule as a server-side procedure, and makes the session reach it.

The rule lives in `packages/api` now, in three procedures mounted under `organization` in the oRPC router: `organization.bySlug` (membership), `organization.settings` (membership and a managing role, `owner` or `admin`) and `organization.active` (the state of the caller's active selection). The check is in the procedure's middleware, so a procedure cannot forget it and a caller cannot reach the data without it.

The check reads the membership row directly instead of calling a plugin endpoint, and that is the point. Better Auth's `/organization/get-organization` and `/organization/get-full-organization` clear the caller's active organization before refusing, so using one as a check for an arbitrary slug would take away a selection the caller still has every right to. The predicate is the plugin's own, a `member` row exists for this user and this organization, so the procedure and the plugin cannot disagree about who belongs to an organization.

Only an empty membership read is mapped to `ORGANIZATION_ACCESS_DENIED`. Every other failure propagates, so a database outage is a 500 and not a 403, and there is no blanket catch around the read.

The two native organization-read endpoints are disabled through Better Auth's `disabledPaths`. Beyond the side effect above, they change the session on a `GET`, and Better Auth's origin check returns early for `GET`, so a third-party page could clear a signed-in user's active organization by navigating to one of them. The application's own procedures replace them.

The oRPC mount now carries the response status. It spread the response into the new `Response`, and `status` is a prototype getter on a `Response`, so the spread copied nothing and every oRPC error answered `200`. The oRPC client decides whether a response is an error from the HTTP status, so an error that arrived as a `200` was read by the client as a result, and the caller received the error object as if it were the payload.

Three existing assertions in `packages/api/tests/integration/rpc/templates.test.ts` were vacuous because of this: they asserted `status !== 502` to prove the e2e guard had not fired, and the status was always `200`, so they could not fail. They now assert on the forced failure itself, which is distinguishable by its message. The behaviour they pin is unchanged.

The same file's routing test asked whether the procedure had answered, and the answer it wanted was a `200`. With the status carried, a GitHub outage answers `502` and the test failed for a reason that had nothing to do with routing. It now asks the question it was written to ask: did the oRPC handler answer at that URL, or did the notFound fallback? The call goes through the e2e guard, so it reaches GitHub zero times, and the test sits outside the GitHub gate, so the routing contract is checked whether the upstream is reachable or not.

`packages/auth` gains the role convention as a module of its own, `src/organization/roles.ts`, exported as `@workspace/auth/organization/roles`. Better Auth stores the roles a member holds as a comma-separated string and every role check in the plugin splits on commas, so a member stored as `"admin,owner"` holds both roles. The comparison lives in one place because the interface has to show an owner-only affordance to exactly the people the API allows to use it. The exported `Session` type also carries the organization plugin's `activeOrganizationId` field, which the procedures read.

`apps/app` forwards the session cookie through the oRPC link, so a server-side call reaches the API as the caller and not as an anonymous request, and the router import becomes type-only so the API's server-only graph stays out of the app's client bundle.
