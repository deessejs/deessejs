# Better-Auth: Organization Plugin (NOT USED IN THIS REPO)

> ⚠️ **Historical reference only.** This file is preserved as a link target from [`index.md`](./index.md) and downstream docs, but the Better Auth organization plugin is **not** used in this template.

This template is **single-tenant** (see `index.md` "Single-Tenant" + project memory `single-tenant`). There is no concept of organization, no memberships, no invitations, no org-scoped roles.

---

## Why this file exists

Earlier iterations of this template experimented with `organizationPlugin` (org auto-create on signup, invitations, role-based access control, `useActiveOrganization`). The repo was re-scoped to single-tenant; `packages/auth/src/auth.ts` was cleaned to drop the plugin. This file was kept:

- so internal and external links from other guides do not break, and
- as a maintained historical reference for users who want to extend this template with org-scoped behaviour themselves.

---

## What this file used to document

The following sections were archived verbatim. Every pattern described here is **single-tenant-incompatible** and must not be reintroduced without first re-evaluating the schema, proxy rules, and client wiring.

### Plugin registration (archived)

```ts
import { organization } from "better-auth/plugins"
import { organizationPluginOptions } from "./shared-options"

export const auth = betterAuth({
  plugins: [
    organization({ ...organizationPluginOptions }),
    nextCookies(), // must be last
  ],
})
```

### Auto-create org on signup (archived)

`autoCreateOrganizationOnSignUp` was removed upstream in [PR #4755](https://github.com/better-auth/better-auth/pull/4755). The "supported" replacement in many guides used `databaseHooks.session.create.before` to call `auth.api.createOrganization` and stamp the org id onto the new session. That hook is buggy on first signup. See [issue #9070](https://github.com/better-auth/better-auth/issues/9070).

### Invitations, roles, `requireEmailVerificationOnInvitation` (archived)

Three default roles (`owner`, `admin`, `member`) plus custom roles via `createAccessControl`. Invitations went through `auth.api.createInvitation` and a `sendInvitationEmail` callback. `requireEmailVerificationOnInvitation: true` ensured the invitee (not the sender) was verified. None of this is applicable to single-tenant.

### `useActiveOrganization` stale-cache bug, [#9710](https://github.com/better-auth/better-auth/issues/9710) (archived)

`$activeOrgSignal` invalidates only on `/sign-out` and `/organization/*` paths, not on `/sign-in/email`. The recommended workaround was to forward `$sessionSignal` invalidations to `$activeOrgSignal` on the client. With no `organizationClient()` wired here, the workaround is moot. Any new client-side code that needs session reactivity should use `$sessionSignal` directly.

---

## If you need multi-tenant

Do not try to graft the org plugin back into this template. Start from a fresh better-auth setup with `organizationPlugin` configured, and pay attention to the upstream issues referenced above.

---

## Sources

- Plugin docs (kept for link integrity): [better-auth.com/docs/plugins/organization](https://better-auth.com/docs/plugins/organization)
- Closed upstream bugs: [#9070](https://github.com/better-auth/better-auth/issues/9070), [#9710](https://github.com/better-auth/better-auth/issues/9710)
