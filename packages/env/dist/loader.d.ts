/**
 * Snapshot returned by `loadDotenvSnapshot`. A plain object literal whose
 * keys mirror the names defined in `schema.ts`. Values are strings, the
 * empty string (after `parse()` it would have been `undefined` had
 * `emptyStringAsUndefined` been applied at parse time; here we keep the
 * raw string and let `createEnv`'s `emptyStringAsUndefined: true` flag
 * convert it).
 *
 * No side-effects on `process.env`. The snapshot is the contract.
 */
export type EnvSnapshot = Record<string, string | undefined>;
/**
 * Read the `.env` hierarchy in Next.js precedence and return a plain
 * object snapshot.
 *
 * Precedence (first wins), per the Next.js 16 docs:
 *
 *   1. `process.env` itself (already set by the host shell / CI)
 *   2. `.env.{NODE_ENV}.local`  (skipped when NODE_ENV=test)
 *   3. `.env.local`              (skipped when NODE_ENV=test)
 *   4. `.env.{NODE_ENV}`
 *   5. `.env`
 *
 * `.env.local` is intentionally skipped when `NODE_ENV=test`: tests must
 * produce the same result for every contributor. This mirrors the Next.js
 * docs verbatim.
 *
 * The function does NOT mutate `process.env`. The returned object is the
 * source of truth for `createEnv`'s `runtimeEnv` argument.
 */
export declare function loadDotenvSnapshot(repoRoot?: string): EnvSnapshot;
/**
 * Legacy shim. Calls `loadDotenvSnapshot()` and mirrors the result into
 * `process.env` for callers that still read `process.env` directly
 * (`drizzle.config.ts`, scripts).
 *
 * Idempotent. The mutation happens once per process.
 *
 * New code should call `loadDotenvSnapshot()` directly and pass the
 * returned object to `createEnv` as `runtimeEnv`. The shim is here only
 * to keep the legacy consumers working without a coordinated refactor
 * across the monorepo.
 */
export declare function loadRepoEnv(): void;
//# sourceMappingURL=loader.d.ts.map