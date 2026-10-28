/**
 * Resend's tag contract.
 *
 * A tag name and a tag value may only contain ASCII letters, numbers,
 * underscores and dashes. The API rejects anything else with a 422 that
 * names a field index and nothing else, so a value like "v0.1" fails at
 * the API boundary with a message that points at the wrong thing.
 *
 * The transport checks the payload before it leaves the process, so a
 * bad tag names itself instead of surfacing as an opaque 422.
 */

/** The characters Resend accepts in a tag name and in a tag value. */
export const TAG_FIELD_PATTERN = /^[A-Za-z0-9_-]+$/

export type InvalidTag = {
  /** Position of the offending tag in the payload. */
  index: number
  name: string
  value: string
}

/**
 * Find the first tag the Resend API would reject.
 *
 * Returns `null` when every tag is valid, or when there are no tags.
 */
export function findInvalidTag(
  tags: ReadonlyArray<{ name: string; value: string }> | undefined,
): InvalidTag | null {
  if (!tags) return null

  for (const [index, tag] of tags.entries()) {
    if (
      !TAG_FIELD_PATTERN.test(tag.name) ||
      !TAG_FIELD_PATTERN.test(tag.value)
    ) {
      return { index, name: tag.name, value: tag.value }
    }
  }

  return null
}
