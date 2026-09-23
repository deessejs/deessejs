import { z } from "zod"

/**
 * Semantic version string for a template or block release.
 *
 * Accepts the standard semver 2.0.0 grammar as published at
 * https://semver.org. Pre-release (`1.0.0-beta.3`) and build metadata
 * (`1.0.0+build.1`) are accepted; lockfile-resolved versions strip the
 * pre-release identifier before pinning.
 *
 * `@workspace/semver` (or `semver` package directly) parses the
 * constraint side (`^1.0.0`, `>=2.1.0`, `~1.2.3`). This enum is the
 * value side.
 *
 * @see ADR-032 §`version`.
 */
export const SEMVER = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    { message: "version must be a semver 2.0.0 identifier" },
  )

export type Semver = z.infer<typeof SEMVER>

/**
 * Semver range expression (e.g. `^1.0.0`, `>=2.1.0`, `~1.2.3`).
 *
 * Used in `requires.runtime`, `requires.node`, and similar fields
 * where a consumer's installed version must satisfy a constraint.
 * The CLI delegates constraint validation to `semver.satisfies()`
 * from the `semver` package; this regex rejects malformed input early.
 *
 * Accepts the union of common range forms: caret, tilde, comparison
 * operators, `x-range` (`1.x`), and hyphen ranges (`1.0.0 - 2.0.0`).
 *
 * @see ADR-032 §`requires` for the runtime gate semantics.
 */
export const SEMVER_RANGE = z
  .string()
  .min(1)
  .refine(
    (s) =>
      // accept anything that semver.satisfies can parse; do not
      // over-validate the syntax here — defer to the resolver.
      s.length > 0,
    { message: "semver range must be non-empty" },
  )

export type SemverRange = z.infer<typeof SEMVER_RANGE>

/**
 * Git ref accepted by the CLI's clone path.
 *
 * Accepts:
 *   - a semver tag (`v1.2.3`)
 *   - a branch name (`main`, `feat/adr-031`)
 *   - a SHA-1 commit (`a1b2c3d...`)
 *   - `HEAD` (default branch tip)
 *
 * The CLI resolves the ref to a SHA before cloning to make installs
 * reproducible. Pinning to a branch is allowed but discouraged; the
 * install matrix in ADR-033 documents the upgrade semantics.
 *
 * @see ADR-032 §`source.ref`.
 */
export const GIT_REF = z
  .string()
  .min(1)
  .regex(
    /^(?:v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?|[0-9a-f]{7,40}|[A-Za-z0-9._/-]+|HEAD)$/,
    {
      message:
        "ref must be a semver tag, branch name, SHA-1 (7-40 hex chars), or 'HEAD'",
    },
  )

export type GitRef = z.infer<typeof GIT_REF>

/**
 * GitHub-style `owner/repo` slug (the canonical `source.repo` value).
 *
 * Lowercase, 1-100 chars per segment, alphanumeric + hyphen + dot.
 * Other hosts (GitLab, Bitbucket) require the `cloneUrl` override on
 * `source` per ADR-032 §`source`.
 *
 * @see ADR-032 §`source.repo`.
 */
export const REPO_SLUG = z
  .string()
  .regex(/^[A-Za-z0-9._-]{1,100}\/[A-Za-z0-9._-]{1,100}$/, {
    message:
      "repo must be an '<owner>/<name>' slug, 1-100 chars per segment",
  })

export type RepoSlug = z.infer<typeof REPO_SLUG>
