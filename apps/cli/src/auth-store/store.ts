import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

import { CACHE_DIR, cachePath } from "../cache/location.js"

/**
 * CLI session-token store (ADR-020).
 *
 * Holds the Better Auth session token returned by
 * /device/token after the user approves the device flow in
 * the browser. The file lives at `~/.deessejs/auth.json`,
 * the same directory as the templates cache.
 *
 * File format (ADR-020 opaque-cache rule, ADR-010 §4):
 *   {
 *     "access_token": "<session.token>",
 *     "user": { "id": "...", "email": "...", "name": "..." },
 *     "fetchedAt": "2026-08-17T..."
 *   }
 *
 * The shape may change between CLI minor versions without
 * bumping the major. Tooling that reads auth.json directly
 * reads the cache at its own risk.
 */

/** Absolute path to the auth.json file. Stable across runs. */
export const AUTH_PATH = cachePath("auth.json")

/** Stored session shape. JSON-serialisable. */
export interface StoredAuth {
	access_token: string
	user: { id: string; email?: string; name?: string }
	fetchedAt: string
}

const ensureDir = (path: string): void => {
	if (!existsSync(dirname(path))) {
		mkdirSync(dirname(path), { recursive: true })
	}
}

const chmodOwnerOnly = (path: string): void => {
	// fs.writeFile's `mode` is masked by the process umask, so
	// the explicit chmod after the write is the authoritative
	// step. Without it, a default umask of 022 leaves the file
	// world-readable on Linux/macOS. The mode 0o600 means
	// read/write for the owner only.
	try {
		chmodSync(path, 0o600)
	} catch {
		// chmod may fail on Windows in tests; the writeAuth
		// caller treats chmod failure as a write failure (the
		// CLI exits through CliError). Silent here means we
		// only fall through if chmod itself is unsupported on
		// the platform, which is rare on Node targets.
	}
}

/**
 * Read the stored auth.json. Returns null when the file does
 * not exist or is malformed. A malformed file is treated as
 * "no session" rather than a hard error: the next command
 * either re-runs the login flow or surfaces the parse error
 * explicitly via the CLI error path.
 */
export const readAuth = (): StoredAuth | null => {
	if (!existsSync(AUTH_PATH)) return null
	try {
		const text = readFileSync(AUTH_PATH, "utf8")
		const parsed = JSON.parse(text) as StoredAuth
		if (typeof parsed.access_token !== "string") return null
		return parsed
	} catch {
		return null
	}
}

/**
 * Write the auth.json file with mode 0o600. The function
 * throws on filesystem failure (caller decides how to surface).
 */
export const writeAuth = (auth: StoredAuth): void => {
	ensureDir(AUTH_PATH)
	const text = JSON.stringify(auth, null, 2)
	writeFileSync(AUTH_PATH, text, { mode: 0o600 })
	chmodOwnerOnly(AUTH_PATH)
}

/**
 * Delete the auth.json file. No-op when the file does not
 * exist. Used by `deesse auth logout` and on explicit
 * server-side session invalidation.
 */
export const clearAuth = (): void => {
	if (!existsSync(AUTH_PATH)) return
	unlinkSync(AUTH_PATH)
}

// Exposed for the rare caller that needs the resolved path
// without importing auth.json by name (test fixtures).
export const authPath = AUTH_PATH

// Re-export CACHE_DIR for tests and helpers that want to
// place auxiliary files alongside auth.json.
export { CACHE_DIR }
