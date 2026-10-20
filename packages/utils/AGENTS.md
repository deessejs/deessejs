# packages/utils

You own the small helpers that do not belong to a domain. Right now there is one of them, and that is the point: a helper lands here only when no domain owns it.

Read [the root guide](../../AGENTS.md) first. It holds the invariants that apply everywhere.

## Key files

| Path | Owns |
|---|---|
| `src/safe-redirect.ts` | `safeRedirect`, the guard for a redirect target that comes from user input. |

The package exposes a single subpath: `@workspace/utils/safe-redirect`.

## `safeRedirect`

Use it everywhere a redirect destination comes from outside: a query parameter, an OAuth `callbackURL`, a `searchParams` value. Pass the result to `router.push`, `NextResponse.redirect` or `signIn.social`.

It normalizes the target into a guaranteed-safe relative path, and it rejects two vectors:

- the protocol-relative form `//evil.com`, which browsers resolve as a fully qualified URL;
- the backslash form, which some browsers normalize to a slash and turn into the same thing.

It is a defense-in-depth layer on top of the `originCheck` middleware of Better Auth, which validates a `callbackURL` against the trusted origins. That middleware can regress. This helper does not.

The fragment and the query string are not validated for `javascript:` schemes. They cannot trigger a server-side redirect to another origin, and the function does not claim to be a general URL sanitizer.

## Conventions

- **A helper moves into a domain package as soon as a domain owns it.** `safe-redirect` is here because no domain owns it. A redirect helper specific to the authentication flow belongs in `packages/auth`, and a database helper belongs in `packages/database`.
- **Every helper documents its threat model.** A security helper that does not say what it blocks, and what it does not block, is a helper nobody can review.

## Commands

```bash
pnpm test
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
```

There is no build script: the package is consumed as source.

## Related guides

- [Root guide](../../AGENTS.md)
- [apps/app](../../apps/app/AGENTS.md)
