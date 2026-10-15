import { invalidName } from "../errors/index.js"

// npm-package-name rules for UNSCOPED packages (the only kind this
// initializer emits — `@scope/foo` is rejected per the issue's spec).
// Mirrors the validator used by `npm install <name>`.
//
// Reference: https://github.com/npm/validate-npm-package-name
const NAME_MAX_LEN = 214
const NAME_REGEX = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

/**
 * Validate an unscoped npm package name. Throws invalidName on failure.
 *
 * Disallowed: scoped names (`@scope/foo`), uppercase, leading dot, leading
 * underscore, leading/trailing whitespace, length > 214, or characters
 * outside `[a-z0-9-._~]`.
 */
export const validateProjectName = (name: string): void => {
  if (name.length === 0) {
    throw invalidName(name, "empty name")
  }
  if (name.length > NAME_MAX_LEN) {
    throw invalidName(name, `longer than ${NAME_MAX_LEN} characters`)
  }
  if (name.startsWith(".") || name.startsWith("_")) {
    throw invalidName(name, "leading dot or underscore")
  }
  // Reject scoped names explicitly (even though the regex would match them).
  if (name.startsWith("@")) {
    throw invalidName(name, "scoped names are not accepted in this increment")
  }
  // Strip whitespace for the regex; report if any was present.
  if (name !== name.trim()) {
    throw invalidName(name, "leading or trailing whitespace")
  }
  if (!NAME_REGEX.test(name)) {
    throw invalidName(name, "contains illegal characters")
  }
}