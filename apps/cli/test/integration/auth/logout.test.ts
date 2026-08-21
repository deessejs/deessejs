import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { logoutCommand } from "../../../src/commands/auth/logout.js"

import { startFakeAuthServer, type FakeAuthServer } from "../fakes/better-auth.js"

/**
 * Integration test for `deesse auth logout` (ADR-020).
 *
 * Sequence:
 *   1. POST /api/v1/auth/sign-out with the stored token.
 *   2. Delete ~/.deessejs/auth.json regardless of the
 *      sign-out outcome: a stale file is worse than a
 *      missing one (every subsequent command would silently
 *      use a dead token).
 *
 * Terminal states pinned:
 *   - No auth.json: silent exit 0 (no session to revoke).
 *   - Server returns 2xx and the file is cleared: green ✓.
 *   - Server returns 5xx and the file is cleared anyway:
 *     yellow warning + green ✓ (the local state is the
 *     user-facing outcome).
 *   - The /sign-out endpoint is hit exactly once per logout
 *     invocation (no retry, no second call from a second
 *     file read).
 */

const REAL_HOME = process.env.HOME
const REAL_USERPROFILE = process.env.USERPROFILE
let fake: FakeAuthServer | undefined

async function runLogout(args: string[]): Promise<void> {
	await logoutCommand.parseAsync(args, { from: "user" })
}

async function withFakeHome<T>(
	home: string,
	fn: () => Promise<T>,
): Promise<T> {
	// os.homedir() reads from different env vars per platform.
	// On Windows it consults USERPROFILE (and HOMEDRIVE+HOMEPATH),
	// not HOME. Setting HOME alone is silently ignored, so the
	// test would write into the real ~/.deessejs/. Set both so
	// the override takes effect regardless of platform.
	process.env.HOME = home
	process.env.USERPROFILE = home
	try {
		return await fn()
	} finally {
		process.env.HOME = REAL_HOME
		process.env.USERPROFILE = REAL_USERPROFILE
	}
}

function seedAuth(home: string, accessToken: string): void {
	mkdirSync(join(home, ".deessejs"), { recursive: true })
	const path = join(home, ".deessejs", "auth.json")
	writeFileSync(
		path,
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

describe("deesse auth logout", () => {
	beforeEach(async () => {
		fake = await startFakeAuthServer()
		process.env.DEESSEJS_API_URL = fake.url
		// Seed an access token. The fake grants /sign-out
		// regardless of the access_token value (the test
		// asserts only that the call is made once).
		fake.state.accessToken = "tok_test_seed"
		fake.state.issuedAt = Date.now()
	})

	afterEach(async () => {
		await fake?.close()
		fake = undefined
		delete process.env.DEESSEJS_API_URL
	})

	it("exits 0 silently when no auth.json exists", async () => {
		const home = join(tmpdir(), `cli-test-${Date.now()}-logout-empty`)
		await withFakeHome(home, async () => {
			expect(existsSync(join(home, ".deessejs", "auth.json"))).toBe(false)
			await runLogout(["node", "auth", "logout", "--json"])
			expect(fake?.state.counters.signOutRequests).toBe(0)
		})
		rmSync(home, { recursive: true, force: true })
	})

	it("clears the local file when sign-out succeeds", async () => {
		const home = join(tmpdir(), `cli-test-${Date.now()}-logout-ok`)
		await withFakeHome(home, async () => {
			seedAuth(home, "tok_test_seed")
			expect(existsSync(join(home, ".deessejs", "auth.json"))).toBe(true)
			await runLogout(["node", "auth", "logout", "--json"])
			expect(existsSync(join(home, ".deessejs", "auth.json"))).toBe(false)
			expect(fake?.state.counters.signOutRequests).toBe(1)
		})
		rmSync(home, { recursive: true, force: true })
	})

	it("clears the local file even when the server returns an error", async () => {
		const home = join(tmpdir(), `cli-test-${Date.now()}-logout-err`)
		await withFakeHome(home, async () => {
			seedAuth(home, "tok_test_seed")
			fake?.setBehaviour({ serverErrors: true })
			await runLogout(["node", "auth", "logout", "--json"])
			// Stale-token file must be gone: every subsequent
			// command would otherwise send a dead token.
			expect(existsSync(join(home, ".deessejs", "auth.json"))).toBe(false)
			// The server was hit once, even though it returned
			// 500. There is no retry, no second call.
			expect(fake?.state.counters.signOutRequests).toBe(1)
		})
		rmSync(home, { recursive: true, force: true })
	})
})
