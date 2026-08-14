# `@workspace/env` tests

Tests live here, in the `tests/` directory at the package root. The
shared `@workspace/vitest-config` preset's `include` glob is
`tests/**/*.test.ts` (matches ADR-009's directory convention;
`tests/` with an `s`, not `test/`).

## Files

- `integration/loader.no-process-env-mutation.test.ts` (ADR-011
  rank 1): load the built `dist/client.js` in a Node subprocess and
  assert it does not depend on `node:fs` or `loadDotenvSnapshot`.
- `unit/schema.server.alias.test.ts` (ADR-011 rank 2): five cases on
  `serverSchema.safeParse(process.env)` covering the
  `AUTH_SECRET → BETTER_AUTH_SECRET` alias and the production gate.
- `unit/server.alias.test.ts` (ADR-011 rank 3): the consumer-side
  alias resolution at the materialisation boundary in
  `getServerEnv()`.

## Tier breakdown

Unit-tier tests do not touch the filesystem. They exercise the
schema's `.superRefine` directly with synthetic inputs, and the
runtime materialisation via a `vi.spyOn` on `loadDotenvSnapshot`.
Integration-tier tests load the compiled `dist/` because the
contract is "what ships to consumers", not what the source looks
like.
