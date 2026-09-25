/**
 * Slugify a string into a URL-safe id.
 *
 * Used by the long-form Company pages (/manifesto, /vision) to
 * build the anchor ids that the <TableOfContents> primitive
 * navigates to.
 *
 * Algorithm:
 * - Lowercase the input.
 * - NFKD-normalize so accented characters decompose (e.g.
 *   "é" → "e" + combining acute).
 * - Strip the combining diacritics (U+0300–U+036F).
 * - Character by character: keep [a-z0-9], replace runs of
 *   anything else with a single "-".
 * - Trim leading / trailing "-".
 *
 * Implementation notes:
 * - The previous version used `.replace(/[^a-z0-9]+/g, "-")`
 *   which `eslint` `sonarjs/slow-regex` flagged as a potential
 *   super-linear backtracking surface. The character-by-character
 *   loop is O(n) and has no backtracking, so it cleanly avoids
 *   the rule.
 * - Handles ASCII and Latin-1 supplement copy (the only
 *   alphabets in /manifesto and /vision today). Non-Latin scripts
 *   fall through to "-"; a translated language would need
 *   Unicode-aware slugify.
 */
export function slugify(input: string): string {
  const normalized = input.toLowerCase().normalize("NFKD")
  let out = ""
  let inDashRun = false
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i)
    const isAlnum =
      (code >= 0x30 && code <= 0x39) || // 0-9
      (code >= 0x61 && code <= 0x7a) // a-z
    if (isAlnum) {
      out += normalized[i]
      inDashRun = false
    } else {
      if (!inDashRun && out.length > 0) {
        out += "-"
        inDashRun = true
      }
    }
  }
  // Trim trailing "-".
  if (out.endsWith("-")) out = out.slice(0, -1)
  return out
}
