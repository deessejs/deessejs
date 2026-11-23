import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import { bearerFetch } from "../../lib/auth/store/bearer-fetch.js"
import { clearAuth, readAuth } from "../../lib/auth/store/store.js"
import { internal } from "../../errors/index.js"
import { printJson } from "../../output/index.js"

function reportLogoutOutcome(
  json: boolean,
  serverSignOutSucceeded: boolean,
  serverStatus: number
): void {
  if (json) {
    printJson({
      ok: true,
      localTokenCleared: true,
      serverSignOutSucceeded,
      serverStatus,
    })
    return
  }

  console.log(
    pc.green(serverSignOutSucceeded ? "✓ signed out" : "✓ local token cleared")
  )
}

/**
 * deesse auth logout.
 *
 * Sequence:
 *   1. POST /api/v1/auth/sign-out with the stored token to
 *      invalidate the session server-side.
 *   2. Delete ~/.deessejs/auth.json regardless of the
 *      sign-out outcome: a stale file is worse than a
 *      missing one (every subsequent command would silently
 *      use a dead token).
 *
 * Uses bearerFetch (not the typed client) because the
 * client sends the session cookie, not a caller-supplied
 * bearer token. The two helper files (better-auth-client.ts
 * and bearer-fetch.ts) are deliberately complementary: the
 * typed client owns the device-flow HTTP shape; the bearer
 * helper owns the two read-only endpoints that need a
 * caller-supplied token.
 *
 * If the file does not exist, the command exits 0 silently:
 *   there is no session to revoke.
 */

export const logoutCommand = new Command("logout")
  .description("Sign out this machine and remove the stored token")
  .option("--json", "JSON output for scripting")
  .option("--verbose", "show human-readable output")
  .action(async (opts: { json?: boolean; verbose?: boolean }) => {
    const json = !opts.verbose || !!opts.json
    const stored = readAuth()
    if (!stored) {
      if (json) {
        printJson({
          ok: true,
          reason: "no_session",
          localTokenCleared: false,
          serverSignOutSucceeded: null,
          serverStatus: null,
        })
      }
      return
    }

    const spinner = json ? null : ora("Signing out...").start()
    try {
      const res = await bearerFetch("sign-out", stored.access_token, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      const serverSignOutSucceeded = res.ok
      // Local credentials are cleared even when the server cannot
      // revoke the session. Report those outcomes separately.
      spinner?.stop()
      if (!serverSignOutSucceeded && !json) {
        console.log(
          pc.yellow(
            `Server returned HTTP ${res.status} on sign-out; server sign-out was not confirmed.`
          )
        )
      }
      clearAuth()
      reportLogoutOutcome(json, serverSignOutSucceeded, res.status)
    } catch (e) {
      spinner?.stop()
      clearAuth()
      const detail = e instanceof Error ? e.message : String(e)
      throw internal(
        `Server sign-out was not confirmed. The local token was cleared. ${detail}`
      )
    }
  })
