# `@workspace/utils`

The small helpers that do not belong to a domain. There is one of them today, and that is the point: a helper lands here only when no domain owns it.

## What's included

- **`safeRedirect`**: the guard for a redirect target that comes from user input

## Usage

Use it wherever a redirect destination comes from outside: a query parameter, an OAuth `callbackURL`, a `searchParams` value.

```ts
import { safeRedirect } from "@workspace/utils/safe-redirect"

const target = safeRedirect(searchParams.get("redirect"), "/home")

router.push(target)
```

It normalizes the target into a guaranteed-safe relative path, and rejects two vectors:

- the protocol-relative form `//evil.com`, which browsers resolve as a fully qualified URL;
- the backslash form, which some browsers normalize to a slash and turn into the same thing.

It is a defense-in-depth layer on top of the `originCheck` middleware of Better Auth, which validates a `callbackURL` against the trusted origins. That middleware can regress. This helper does not.

## Exports

| Export | Import path | Contents |
|---|---|---|
| `./safe-redirect` | `@workspace/utils/safe-redirect` | `safeRedirect` |

## Commands

```bash
pnpm test
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
```

There is no build script: the package is consumed as source.

## Notes

- The fragment and the query string are not validated for `javascript:` schemes. They cannot trigger a server-side redirect to another origin, and the function does not claim to be a general URL sanitizer.
- A helper moves into a domain package as soon as a domain owns it. A redirect helper specific to the authentication flow belongs in `@workspace/auth`.
- Every helper documents its threat model. A security helper that does not say what it blocks, and what it does not block, is a helper nobody can review.

## Related

- **Used by**: [`apps/app`](../../apps/app/README.md)

The conventions of this package are in [AGENTS.md](AGENTS.md).
