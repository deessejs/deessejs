import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import {
  fetchUserIdentity,
  openVerificationUrl,
  pollForToken,
  requestDeviceCode,
} from "../../lib/auth/flow/index.js"
import { resolveBaseURL } from "../../lib/auth/store/better-auth-client.js"
import { writeAuth } from "../../lib/auth/store/store.js"
import { CliError } from "../../errors/index.js"
import { printError, printJson } from "../../output/index.js"

function printVerificationInstructions({
  json,
  open,
  verificationUri,
  userCode,
}: {
  json: boolean
  open: boolean
  verificationUri: string
  userCode: string | null
}) {
  if (json) {
    if (!open) {
      printJson({
        event: "device_authorization_pending",
        verification_uri: verificationUri,
        user_code: userCode,
      })
    }
    return
  }

  console.log()
  console.log(
    pc.cyan(
      open
        ? "Open the following URL in your browser if it doesn't open automatically:"
        : "Open this URL in the T3 Code browser:"
    )
  )
  console.log(pc.bold(verificationUri))
  if (userCode) console.log(pc.dim(`User code: ${userCode}`))
  console.log()
}

async function waitForApproval(
  deviceCode: string,
  expiresBy: number,
  json: boolean
) {
  const pollSpinner = json
    ? null
    : ora("Waiting for browser approval...").start()
  try {
    const token = await pollForToken(deviceCode, expiresBy)
    const user = await fetchUserIdentity(token.accessToken)
    writeAuth({
      access_token: token.accessToken,
      user,
      fetchedAt: new Date().toISOString(),
    })
    pollSpinner?.stop()
    if (json) {
      printJson({ ok: true, user })
    } else {
      console.log()
      console.log(
        pc.green("✓ logged in as ") + pc.bold(user.email ?? user.name ?? user.id)
      )
    }
  } finally {
    pollSpinner?.stop()
  }
}

/**
 * deesse auth login.
 *
 * Commander wrapper around the device-flow orchestration in
 * apps/cli/src/lib/auth/flow/. This file owns the command
 * surface: option parsing, spinners, output formatting, and
 * exit-code mapping. The flow itself (request / poll /
 * open-browser) lives in the auth-flow module and is
 * reusable from other commands (e.g. a future `auth
 * reauth`) without duplicating orchestration.
 *
 * Flow summary (full detail in apps/cli/src/lib/auth/flow/):
 *   1. requestDeviceCode: POST /device/code
 *   2. openVerificationUrl: spawn the OS browser
 *   3. pollForToken: poll /device/token until approved
 *   4. fetchUserIdentity: GET /get-session with
 *      `Authorization: Bearer <access_token>` to resolve
 *      the user. Throws cli_device_expired if the server
 *      rejects the token or returns no user — a soft
 *      `?? { id: "" }` fallback would write a fake user to
 *      ~/.deessejs/auth.json and surface as "logged in as
 *      unknown user" downstream (the first regression caught
 *      in production after the device-flow launch).
 *   5. writeAuth: persist ~/.deessejs/auth.json with mode 0600
 */
export const loginCommand = new Command("login")
  .description("Authorize this machine against the DeesseJS server")
  .option("--json", "JSON output for scripting")
  .option("--no-open", "print the verification URL without opening a system browser")
  .option("--verbose", "show human-readable output")
  .action(async (opts: { json?: boolean; open?: boolean; verbose?: boolean }) => {
    const json = !opts.verbose || !!opts.json
    const spinner = json ? null : ora("Requesting device code...").start()
    try {
      const issued = await requestDeviceCode()
      spinner?.stop()

      const verificationUri = new URL(issued.url, resolveBaseURL()).toString()
      const verificationUrl = new URL(verificationUri)
      const userCode = verificationUrl.searchParams.get("user_code")
      printVerificationInstructions({
        json,
        open: !!opts.open,
        verificationUri,
        userCode,
      })

      if (opts.open) await openVerificationUrl(verificationUri)

      await waitForApproval(issued.deviceCode, issued.expiresBy, json)
    } catch (e) {
      spinner?.stop()
      if (e instanceof CliError) {
        const err = e
        if (json) {
          printJson({ ok: false, code: err.code, message: err.message })
        } else {
          printError(err)
        }
        // Rethrow so the index.ts last-resort handler
        // calls process.exit(err.exitCode()). This is
        // also what makes the command testable: vitest
        // catches the throw, asserts on the error shape,
        // and the production path still exits with the
        // right code (via the central handler).
        throw err
      }
      throw e
    }
  })
