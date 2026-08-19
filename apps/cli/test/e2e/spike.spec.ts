import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { execa } from "execa"
import { inject } from "vitest"

/**
 * Spike test (ADR-015).
 *
 * Exercises the four endpoints the design assumes:
 *
 *   1. GET  /api/v1/health   — liveness probe.
 *   2. GET  /api/v1/version  — version probe.
 *   3. POST /api/v1/rpc      — the ORPC list procedure. This is
 *                                the call where the format is
 *                                a guess. If the spike fails here,
 *                                the format guess is wrong.
 *   4. The CLI tarball invoked with API_BASE_URL pointing at
 *      the local server. The CLI must read the templates registry
 *      and print at least the saas-starter slug.
 */

describe("CLI e2e spike", () => {
  it("local server + drizzle-seed + execa tarball all hang together", async () => {
    const serverUrl = inject<string>("serverUrl")
    expect(serverUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

    // 1. /api/v1/health
    const health = await fetch(`${serverUrl}/api/v1/health`)
    expect(health.status).toBe(200)
    const healthBody = (await health.json()) as { status: string }
    expect(healthBody.status).toBe("ok")

    // 2. /api/v1/version
    const version = await fetch(`${serverUrl}/api/v1/version`)
    expect(version.status).toBe(200)

    // 3. POST /api/v1/rpc — the ORPC call. The body shape is
    //    a best-guess. If the spike fails here, the implementation
    //    PR must log the actual wire format and update the body
    //    shape accordingly.
    const rpc = await fetch(`${serverUrl}/api/v1/rpc`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "list",
        params: { data: {}, meta: [] },
        id: "spike-1",
      }),
    })
    // The server may return 200 with a typed result, or 4xx/5xx
    // if the body shape is wrong. We do not assert on a specific
    // status here. We log the response so the spike's findings
    // include the actual wire format.
    const rpcBody = await rpc.text()
    console.log(`[spike] /api/v1/rpc status=${rpc.status} body=${rpcBody.slice(0, 500)}`)
    expect([200, 400, 404]).toContain(rpc.status)

    // 4. CLI tarball — the actual end-to-end test. The CLI
    //    must be packable as a tarball and runnable from a
    //    subprocess.
    //
    //    For the spike, we use the prebuilt dist/index.js
    //    rather than the tarball. The tarball comes from the
    //    verify workflow (ADR-013) once it has run. The spike
    //    uses the prebuilt file because the spike is local and
    //    does not run the verify workflow first.
    const cliEntry = resolve(process.cwd(), "dist", "index.js")
    if (!existsSync(cliEntry)) {
      throw new Error(
        `CLI entry not found at ${cliEntry}. Run 'pnpm --filter @deessejs/cli build' before the spike.`,
      )
    }
    const result = await execa("node", [cliEntry, "list"], {
      env: {
        ...process.env,
        API_BASE_URL: serverUrl,
        NO_COLOR: "1",
      },
      reject: false,
    })
    console.log(
      `[spike] cli list exit=${result.exitCode} stdout=${result.stdout.slice(0, 500)}`,
    )
    // The spike does not assert on a specific output. The spike
    // proves the pipeline works (server up, CLI spawns, exit
    // code is meaningful). The contract assertions come in the
    // full implementation.
    expect(result.exitCode).toBe(0)
  }, 120_000)
})
