import { createHash } from "node:crypto"
import { APIError } from "better-auth/api"

import { RESERVED_SLUGS } from "./reserved-slugs.js"

/**
 * Organization policy helpers.
 *
 * The module owns the two rules of a slug: the format it has to
 * satisfy, and the set of slugs the application reserves for itself.
 * It also owns the generation of the slug a name proposes, because
 * the generation is pure and belongs next to the validation that
 * decides whether what it produced is acceptable.
 *
 * The reserved set itself lives in `./reserved-slugs.ts`, in a module
 * of its own: the request guard needs to read it, and the guard must
 * not pull Better Auth into the browser bundle.
 *
 * The module is reachable from Better Auth's runtime and does
 * **not** import `server-only`, so it can be unit-tested in isolation.
 */

// 2–38 lowercase ASCII characters, must start and end with a letter
// or digit. The trailing character class is **not** optional, so
// single-character slugs are rejected.
const SLUG_FORMAT = /^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$/

/** The longest slug the format accepts. */
const SLUG_MAX_LENGTH = 38

/** How many candidates a name proposes, at most. */
export const ORGANIZATION_SLUG_CANDIDATE_LIMIT = 10

export function assertOrganizationSlug(slug: string): void {
  if (typeof slug !== "string" || !SLUG_FORMAT.test(slug)) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_slug",
      message:
        "Organization slug must be 2–38 lowercase ASCII characters (letters, digits, hyphens), starting and ending with a letter or digit.",
    })
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_slug",
      message: `Organization slug "${slug}" is reserved.`,
    })
  }
}

/**
 * Validate an organization name. The function is **validate-only**:
 * it never mutates its argument. Surrounding whitespace and control
 * characters are rejected; the original string is not modified.
 * The trim-and-retry responsibility belongs to the caller (the
 * Server Action in a downstream PR, not the hook in `plugin.ts`,
 * which is a defensive boundary and intentionally does not trim).
 *
 * Length is measured in code points, not UTF-16 code units, so
 * 100 emoji are within the limit (each emoji is one code point even
 * though `String#length` would count it as two).
 */
export function assertOrganizationName(name: unknown): asserts name is string {
  if (typeof name !== "string") {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_name",
      message: "Organization name must be a string",
    })
  }
  // 1. Reject control characters on the original string. C0
  //    (U+0000–U+001F), DEL (U+007F), C1 (U+0080–U+009F). `for…of`
  //    iterates code points so surrogate pairs are handled correctly.
  for (const ch of name) {
    const cp = ch.codePointAt(0)
    if (cp === undefined) continue
    const isC0Control = cp >= 0x00 && cp <= 0x1f
    const isDelete = cp === 0x7f
    const isC1Control = cp >= 0x80 && cp <= 0x9f
    if (isC0Control || isDelete || isC1Control) {
      throw new APIError("BAD_REQUEST", {
        code: "invalid_name",
        message: "Organization name contains control characters",
      })
    }
  }
  // 2. Reject leading/trailing whitespace. The function does not
  //    trim; it rejects and lets the caller decide.
  if (name !== name.trim()) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_name",
      message: "Organization name must not have leading or trailing whitespace",
    })
  }
  // 3. Length measured in code points. `String#length` counts
  //    UTF-16 code units, which would miscount astral characters
  //    (emoji, CJK extensions B–G) as two. The spread operator
  //    iterates code points.
  const codePoints = [...name]
  if (codePoints.length === 0 || codePoints.length > 100) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_name",
      message: "Organization name must be 1–100 code points",
    })
  }
}

/** Validate an optional organization logo URL without fetching it. */
export function assertOrganizationLogoUrl(logo: unknown): void {
  if (logo === null) return
  if (typeof logo !== "string" || logo.length > 2048) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_logo_url",
      message:
        "Organization logo must be an HTTPS URL no longer than 2048 characters.",
    })
  }

  let url: URL
  try {
    url = new URL(logo)
  } catch {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_logo_url",
      message: "Organization logo must be an HTTPS URL.",
    })
  }

  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password
  ) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_logo_url",
      message: "Organization logo must be an HTTPS URL without credentials.",
    })
  }
}

/**
 * The token a name falls back to when it normalizes to nothing
 * usable.
 *
 * The token is derived from the name with a hash, so it is
 * deterministic: the same name always proposes the same first
 * candidate, and a second account with the same name gets the
 * suffixed form rather than a different base.
 */
const fallbackSlug = (name: string): string => {
  const digest = createHash("sha256").update(name).digest("hex").slice(0, 8)
  return `org-${digest}`
}

/**
 * The value without the separator a cut can leave behind.
 *
 * The truncation happens on the joined runs, so it can land right
 * after a separator. A slug cannot end with one.
 */
const withoutTrailingHyphen = (value: string): string =>
  value.endsWith("-") ? value.slice(0, -1) : value

/**
 * The base slug a name proposes.
 *
 * The name is normalized to what the slug format accepts: lowercase
 * ASCII letters, digits and hyphens, starting and ending with an
 * alphanumeric. The result is at most the format's maximum length.
 *
 * A name that normalizes to nothing usable, or to a single character
 * the format would reject, falls back to a token derived from the
 * name, so the same name always proposes the same base.
 *
 * The function is pure. Whether a slug is taken is a database
 * question, and it is asked by the caller.
 */
export function slugifyOrganizationName(name: string): string {
  // The name is cut into the runs of letters and digits it holds, and
  // the runs are joined with a hyphen. A name with no run at all
  // normalizes to nothing, and a name with a single character
  // normalizes to a character the format would reject.
  const runs = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((run) => run !== "")

  const truncated = runs.join("-").slice(0, SLUG_MAX_LENGTH)
  const base = withoutTrailingHyphen(truncated)

  if (base.length >= 2) return base
  return fallbackSlug(name)
}

/**
 * The candidates a name proposes, in the order they are tried.
 *
 * The sequence is the base, then the base with a numeric suffix. A
 * candidate that does not satisfy the format, or that the
 * application reserves, is skipped: an organization whose name
 * normalizes to a reserved segment still gets one, under the next
 * free form.
 *
 * The sequence is bounded, and the bound is the whole of the retry
 * budget. A name whose candidates are all taken is a failure the
 * caller reports, not an unbounded search.
 */
export function organizationSlugCandidates(name: string): string[] {
  return organizationSlugCandidatesFromSlug(slugifyOrganizationName(name))
}

/**
 * The candidates a CLI-proposed slug may use, in the order they are tried.
 * The server remains authoritative: malformed proposals are rejected,
 * reserved candidates are skipped, and collisions fall through to a
 * bounded numeric suffix.
 */
export function organizationSlugCandidatesFromSlug(slug: string): string[] {
  if (!SLUG_FORMAT.test(slug)) return []

  const candidates: string[] = []

  for (
    let attempt = 1;
    attempt <= ORGANIZATION_SLUG_CANDIDATE_LIMIT;
    attempt++
  ) {
    const suffix = attempt === 1 ? "" : `-${attempt}`
    const candidate = suffix
      ? `${withoutTrailingHyphen(slug.slice(0, SLUG_MAX_LENGTH - suffix.length))}${suffix}`
      : slug
    if (!SLUG_FORMAT.test(candidate)) continue
    if (RESERVED_SLUGS.has(candidate)) continue
    candidates.push(candidate)
  }

  return candidates
}
