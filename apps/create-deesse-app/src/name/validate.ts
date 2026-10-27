import { invalidName } from "../errors/index.js"

// npm-package-name rules for UNSCOPED packages (the only kind this
// initializer emits — `@scope/foo` is rejected per the issue's spec).
// Mirrors the validator used by `npm install <name>`.
//
// Reference: https://github.com/npm/validate-npm-package-name
const NAME_MAX_LEN = 214
const NAME_REGEX = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

// Per-rule failure reasons. Each entry returns either a `string` reason
// (failure) or `null` (this rule passed). The validator walks the table
// top to bottom and throws on the first hit; the order is the order
// users see in error messages.
const RULES: ReadonlyArray<(name: string) => string | null> = [
  (n) => (n.length === 0 ? "empty name" : null),
  (n) =>
    n.length > NAME_MAX_LEN ? `longer than ${NAME_MAX_LEN} characters` : null,
  (n) =>
    n.startsWith(".") || n.startsWith("_") ? "leading dot or underscore" : null,
  // Reject scoped names explicitly (even though the regex would match them).
  (n) =>
    n.startsWith("@")
      ? "scoped names are not accepted in this increment"
      : null,
  (n) => (n !== n.trim() ? "leading or trailing whitespace" : null),
  (n) => (!NAME_REGEX.test(n) ? "contains illegal characters" : null),
]

/**
 * Validate an unscoped npm package name. Throws invalidName on failure.
 *
 * Disallowed: scoped names (`@scope/foo`), uppercase, leading dot, leading
 * underscore, leading/trailing whitespace, length > 214, or characters
 * outside `[a-z0-9-._~]`.
 */
export const validateProjectName = (name: string): void => {
  for (const rule of RULES) {
    const reason = rule(name)
    if (reason !== null) {
      throw invalidName(name, reason)
    }
  }
}
