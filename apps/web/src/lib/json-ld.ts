/**
 * Serialize a JSON-LD payload for safe injection via
 * `dangerouslySetInnerHTML` inside a `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` alone is not safe inside HTML: a string field that
 * contains the substring `</script>` lets the data break out of its
 * `<script>` element and execute arbitrary HTML. This is the classic
 * JSON-in-HTML XSS.
 *
 * The escape sequence below is the one recommended by the React docs
 * and OWASP: replace the three characters that can terminate the
 * surrounding HTML / script context with their Unicode escape form,
 * which JSON parses back to the original character on the client.
 * U+2028 and U+2029 (LINE / PARAGRAPH SEPARATOR) are also escaped —
 * they are valid JSON but break script parsing in legacy browsers.
 * Those escapes use String.fromCharCode so the source file stays pure
 * ASCII and the U+2028 / U+2029 literals do not confuse tooling.
 *
 * Use it like:
 *
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: jsonLdScript(payload) }}
 *   />
 */
export function jsonLdScript(payload: unknown): string {
  const LINE_SEPARATOR = String.fromCharCode(0x2028)
  const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)
  return JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029")
}