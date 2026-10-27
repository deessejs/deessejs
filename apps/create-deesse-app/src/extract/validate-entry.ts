import path from "node:path"

// Reject any tarball entry whose type is not one of these. PAX produces
// "File" / "Directory" / "SymbolicLink"; "OldFile" is a GNU alias for "File"
// some producers emit. Everything else is rejected.
//
// Reference: https://github.com/isaacs/node-tar#class-entry
const ALLOWED_TYPES = new Set(["File", "OldFile", "Directory", "SymbolicLink"])

// node-tar's entry type strings (what `entry.type` actually holds).
// We don't restrict ourselves to a denylist because new type strings added in
// future tar versions should default to REJECT.
export type EntryType =
  | "File"
  | "OldFile"
  | "Directory"
  | "SymbolicLink"
  | "BlockDevice"
  | "CharacterDevice"
  | "FIFO"
  | "ContiguousFile"
  | "GNUDumpDir"
  | "NextFileHasLongLink"
  | "NextFileHasLongPath"
  | "OldGnuLongLink"
  | "OldGnuLongName"
  | "Link"
  | (string & {})

export type Entry = {
  path: string
  type?: EntryType
  mode?: number
  /** Size in bytes from the tar header. Optional because
   * older tar producers may omit it; readers should fall
   * back to 0 in that case. */
  size?: number
}

export type ValidationFailure = {
  path: string
  reason: string
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; failures: ValidationFailure[] }

/**
 * Validate a single tar entry against the project's safety rules. Returns
 * `{ ok: true }` if the entry is acceptable, or `{ ok: false, failures }`
 * with a list of { path, reason } describing why it was rejected.
 *
 * This function does not write to disk and does not mutate its inputs.
 */
export const validateEntry = (entry: Entry): ValidationResult => {
  const failures: ValidationFailure[] = []
  const rawPath = entry.path

  // 1. Type allowlist.
  if (!entry.type || !ALLOWED_TYPES.has(entry.type)) {
    failures.push({
      path: rawPath,
      reason: `unsupported entry type "${entry.type ?? "unknown"}"`,
    })
  }

  // 2. Symlinks are explicitly rejected — never followed, never written.
  if (entry.type === "SymbolicLink") {
    failures.push({ path: rawPath, reason: "symbolic links are rejected" })
  }

  // 3. Backslashes on POSIX are illegal; tar uses forward slashes.
  if (rawPath.includes("\\")) {
    failures.push({ path: rawPath, reason: "contains backslash (POSIX path)" })
  }

  // 4. Absolute paths / drive letters.
  if (path.posix.isAbsolute(rawPath) || /^[a-zA-Z]:/.test(rawPath)) {
    failures.push({ path: rawPath, reason: "absolute path" })
  }

  // 5. Path traversal — any segment equal to `..` after POSIX normalization.
  // Note that `path.posix.normalize("../../etc/passwd")` returns the same
  // string (parent refs are preserved, not collapsed), so we must check
  // for `..` as a segment rather than relying on normalization.
  const segments = rawPath.split("/")
  if (segments.includes("..")) {
    failures.push({
      path: rawPath,
      reason: `path traversal detected (segment ".." in "${rawPath}")`,
    })
  }
  // Empty segments (e.g. "foo//bar") — POSIX normalization collapses these
  // to "foo/bar" which would silently alias legitimate entries.
  if (rawPath.includes("//")) {
    failures.push({ path: rawPath, reason: "empty path segment (//)" })
  }

  return failures.length === 0 ? { ok: true } : { ok: false, failures }
}
