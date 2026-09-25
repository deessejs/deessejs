/**
 * Slugify a string into a URL-safe id.
 *
 * Used by the long-form Company pages (/manifesto, /vision) to
 * build the anchor ids that the <TableOfContents> primitive
 * navigates to. Lowercases, replaces whitespace and any
 * non-alphanumeric character with a hyphen, trims leading /
 * trailing hyphens.
 *
 * Stable across re-renders; same input always yields the same
 * output. Doesn't lowercase non-ASCII characters (Latin-1
 * supplements render fine as anchors; non-Latin alphabets
 * would need Unicode handling, but /manifesto and /vision only
 * use English copy today).
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
