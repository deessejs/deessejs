import { execa, type ExecaError } from "execa"
import { setTimeout as delay } from "node:timers/promises"

/**
 * Spike server helper (ADR-015).
 *
 * Spawns `next start` on a free port and health-checks it. Stops
 * the process on `stop()`.
 *
 * The server is the local Next.js app (`apps/app`), which serves
 * the API via a Hono catch-all under `/api/[[...route]]`. The
 * healthcheck hits `/api/v1/health`, the public liveness probe
 * defined in `packages/api/src/http/routes/http.ts`.
 */

export type ServerHandle = {
  url: string
  port: number
  stop: () => Promise<void>
}

export type StartOptions = {
  port: number
  hostname: string
}

const HEALTH_TIMEOUT_MS = 60_000
const HEALTH_POLL_MS = 250

export const startLocalServer = async (options: StartOptions): Promise<ServerHandle> => {
  const child = execa("pnpm", ["--filter", "app", "start", "--", "-p", String(options.port), "-H", options.hostname], {
    env: { ...process.env, HOSTNAME: options.hostname },
    stdio: ["ignore", "pipe", "pipe"],
  })

  // Surface server output on test failure. We do not pipe to
  // stdout by default because the spike would otherwise be very
  // noisy. The implementation PR decides the noise level.
  child.stdout?.on("data", () => {})
  child.stderr?.on("data", () => {})

  const url = `http://${options.hostname}:${options.port}`

  // Health-check loop. The server is ready when /api/v1/health
  // returns 200. We poll every 250ms up to a 60s ceiling.
  const deadline = Date.now() + HEALTH_TIMEOUT_MS
  let healthy = false
  let lastError: unknown = null
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/v1/health`)
      if (res.status === 200) {
        healthy = true
        break
      }
    } catch (err) {
      lastError = err
    }
    await delay(HEALTH_POLL_MS)
  }

  if (!healthy) {
    child.kill("SIGTERM")
    throw new Error(
      `Local server did not become healthy within ${HEALTH_TIMEOUT_MS}ms. ` +
        `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    )
  }

  return {
    url,
    port: options.port,
    stop: async () => {
      child.kill("SIGTERM")
      try {
        await child
      } catch (err) {
        const e = err as ExecaError
        if (e.signal !== "SIGTERM" && e.signal !== "SIGKILL") {
          throw e
        }
      }
    },
  }
}
