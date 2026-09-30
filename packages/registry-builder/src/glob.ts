/**
 * A minimal glob matcher used by the registry-builder.
 *
 * Supports the subset of patterns we actually need:
 *   - `*` matches any character except `/`
 *   - `**` matches any character including `/`
 *   - `?` matches a single character except `/`
 *   - everything else is a literal
 *
 * Deliberately **not** a full shell glob. We do not support
 * character classes, brace expansion, or extglob. Templates have
 * predictable paths; adding a dep is overkill.
 *
 * The matcher anchors the pattern against the full path: `*` will
 * not match `/`. To match a sub-tree, use `**`.
 */

/**
 * Convert a glob pattern to a RegExp.
 *
 * Escapes every regex metachar except `*`, `?`. The `**` segment
 * matches zero or more path segments. Single `*` matches any
 * non-slash characters. `?` matches a single non-slash character.
 *
 * Implementation: split the pattern on `/` and translate each
 * segment independently. Simpler than character-by-character
 * and avoids the off-by-one errors of greedy backtracking on
 * `**` followed by `/`.
 *
 * Translation rules per segment:
 *   - `*`  → `[^/]*`  (any non-slash characters)
 *   - `**` → `.*`      (any characters including `/`)
 *   - `?`  → `[^/]`
 *   - literal characters are regex-escaped.
 *
 * The segments are joined by escaped `\/`. `**` becomes a single
 * `.*` segment; a leading `**` after a literal prefix is `.*\/`
 * so `apps/foo` matches `apps/**` (one `.*` group consuming
 * `foo/`), and `apps` matches `apps/**` (zero `.*` groups).
 */
export const globToRegExp = (pattern: string): RegExp => {
  const parts = pattern.split("/").filter((s) => s.length > 0)
  const body = parts
    .map((segment) => {
      if (segment === "**") return ".*"
      let seg = ""
      for (const ch of segment) {
        if (ch === "*") seg += "[^/]*"
        else if (ch === "?") seg += "[^/]"
        else if (/[.+^$|(){}\[\]\\]/.test(ch)) seg += "\\" + ch
        else seg += ch
      }
      return seg
    })
    .join("\\/")
  // Wrap in `(?:...)?` so a trailing `**` can match zero
  // segments — `apps/**` should match `apps` too. The leading
  // `^` anchors against the path; the trailing `$` keeps the
  // match bounded to the path.
  return new RegExp("^(?:" + body + ")$")
}

/**
 * Test a path against a single glob pattern.
 *
 * Anchored match: the path must match the full pattern, not a
 * substring. Paths use `/` as the separator (POSIX-style) — the
 * builder normalises paths to forward slashes before matching.
 */
export const matchGlob = (pattern: string, path: string): boolean =>
  globToRegExp(pattern).test(path)

/**
 * Test a path against an ordered set of glob patterns.
 *
 * Returns `true` if the path matches **any** pattern. Use
 * `firstMatch` instead when a single ordered match matters.
 */
export const matchAnyGlob = (patterns: readonly string[], path: string): boolean =>
  patterns.some((p) => matchGlob(p, path))

/**
 * Match a path against an include set and an exclude set.
 *
 * Behaviour matches `.gitignore` semantics: the path is included
 * iff it matches the include set AND does not match the exclude
 * set. The include set is required; the exclude set is optional.
 */
export const includeExclude = (
  path: string,
  include: readonly string[],
  exclude: readonly string[] = [],
): boolean => matchAnyGlob(include, path) && !matchAnyGlob(exclude, path)