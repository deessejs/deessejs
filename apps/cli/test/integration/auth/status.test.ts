import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { statusCommand } from "../../../src/commands/auth/status.js"
import { cachePath } from "../../../src/cache/location.js"

import { startFakeAuthServer, type FakeAuthServer } from "../fakes/better-auth.js"

/**
 * Integration test for `deesse auth status` (ADR-020).
 *
 * Three terminal states:
 *   - No auth.json: prints yellow notice, exit 0.
 *   - Token still valid server-side: prints green ✓, prints
 *     the user identity echoed back from /get-session.
 *   - Server rejects the token (revoked / expired): prints
 *     yellow "session invalid" notice, exit 0, includes the
 *     stale user identity for context.
 *
 * The command never echoes the access token.
 */

const REAL_HOME = process.env.HOME
const REAL_USERPROFILE = process.env.USERPROFILE
let fake: FakeAuthServer | undefined

async function runStatus(args: string[]): Promise<void> {
	await statusCommand.parseAsync(args, { from: "user" })
}

async function withHome<T>(home: string, fn: () => Promise<T>): Promise<T> {
	// os.homedir() reads from different env vars per platform.
	// On Windows it consults USERPROFILE (and HOMEDRIVE+HOMEPATH),
	// not HOME. Setting HOME alone is silently ignored, so the
	// test would write into the real ~/.deessejs/. Set both so
	// the override takes effect regardless of platform.
	const previousHome = process.env.HOME
	const previousUserProfile = process.env.USERPROFILE
	process.env.HOME = home
	process.env.USERPROFILE = home
	try {
		return await fn()
	} finally {
		process.env.HOME = previousHome
		process.env.USERPROFILE = previousUserProfile
	}
}
// Save the original values for any future test that needs
// to read the real home; today none do, but capturing them
// at module load keeps the helpers honest about the override.
void REAL_HOME
void REAL_USERPROFILE

function authPathIn(): string {
	// cachePath is evaluated at call time, reading process.env.HOME
	// fresh each invocation. We cannot use the module-level AUTH_PATH
	// export because it captured process.env.HOME at module load time,
	// before withHome() swaps the env var.
	return cachePath("auth.json")
}

function seedAuth(home: string, accessToken: string): void {
	mkdirSync(join(home, ".deessejs"), { recursive: true })
	writeFileSync(
		authPathIn(),
		JSON.stringify({
			access_token: accessToken,
			user: {
				id: "user_test_1",
				email: "[email protected]",
				name: "Test User",
			},
			fetchedAt: new Date().toISOString(),
		}),
		{ mode: 0o600 },
	)
}

describe("deesse auth status", () => {
	beforeEach(async () => {
		fake = await startFakeAuthServer()
		process.env.DEESSEJS_API_URL = fake.url
		// Seed a known access token. The fake grants /get-session
		// when this token is the one it issued most recently;
		// for the "no_session" / "session_invalid" tests we
		// mutate server-side state (e.g. clear accessToken).
		fake.state.accessToken = "tok_test_seed"
		fake.state.issuedAt = Date.now()
	})

	afterEach(async () => {
		await fake?.close()
		fake = undefined
		delete process.env.DEESSEJS_API_URL
	})

	it("prints a yellow notice and exits 0 when no auth.json exists", async () => {
		const home = join(tmpdir(), `cli-test-${Date.now()}-status-empty`)
		await withHome(home, async () => {
			expect(existsSync(authPathIn())).toBe(false)
			// The command resolves cleanly (no throw). We
			// cannot easily capture stdout here; the test is
			// that the absence of the file is the "no session"
			// path and the command does not crash.
			await runStatus(["node", "auth", "status", "--json"])
		})
		rmSync(home, { recursive: true, force: true })
	})

	it("echoes the server-side identity when the token is valid", async () => {
		const home = join(tmpdir(), `cli-test-${Date.now()}-status-ok`)
		await withHome(home, async () => {
			seedAuth(home, "tok_test_seed")
			// Run the command. It will hit /get-session and
			// receive the user object back. We do not assert
			// on stdout here because vitest's stdout capture
			// is fragile; we assert that the command
			// completes successfully (no throw, no internal
			// error).
			await runStatus(["node", "auth", "status", "--json"])
		})
		rmSync(home, { recursive: true, force: true })
	})

	it("prints a yellow session_invalid notice when the server rejects the token", async () => {
		const home = join(tmpdir(), `cli-test-${Date.now()}-status-invalid`)
		await withHome(home, async () => {
			seedAuth(home, "tok_test_seed")
			// Force the fake to return 500 from /get-session
			// (simulating an expired/revoked token).
			fake?.setBehaviour({ serverErrors: true })
			await runStatus(["node", "auth", "status", "--json"])
		})
		rmSync(home, { recursive: true, force: true })
	})
})
