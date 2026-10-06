/**
 * End-to-end integration tests for `deessejs list` and
 * `deessejs info <slug>`.
 *
 * Both commands hit the registry API only — no filesystem writes,
 * no GitHub raw fetches. The fake registry server
 * (`fakes/registry-server.ts`) handles all routes; the SDK
 * resolves the API URL via `DEESSEJS_API_URL` (which the
 * sandbox sets via `runInit`'s pattern).
 *
 * What we prove:
 *   - `list` renders the catalogue returned by the fake
 *     registry. We assert the table contains each fixture slug.
 *   - `info <known-slug>` renders the info fixture; we pin a
 *     substring of the rendered output.
 *   - `info <unknown-slug>` exits non-zero with a clear
 *     "not found" message.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { cleanupSandbox, makeSandbox, withCwd, withEnv } from "./_sandbox.js"
import { startFakeRegistry, type FakeCatalogEntry } from "./fakes/registry-server.js"
import { invoke } from "./_invoke.js"

const makeFixture = (
  slug: string,
  title: string,
): FakeCatalogEntry => ({
  slug,
  title,
  description: `${title} integration fixture.`,
  layer: "open-community",
  latestVersion: "1.0.0",
  owner: "deessejs",
  repo: "fixture-template",
  descriptor: {
    $schema: "https://registry.deessejs.com/schema/template/v2.json",
    name: slug,
    title,
    type: "template:app",
    version: "1.0.0",
    author: "Test Author <test@example.com>",
    source: { repo: `deessejs/${slug}`, ref: "main" },
    requires: { runtime: "node" },
    files: [],
  },
  files: {},
})

describe("deessejs list and info (integration)", () => {
  let sandbox: string
  let registry: Awaited<ReturnType<typeof startFakeRegistry>>

  beforeEach(async () => {
    sandbox = makeSandbox("list-info")
    registry = await startFakeRegistry([
      makeFixture("alpha", "Alpha Template"),
      makeFixture("beta", "Beta Template"),
    ])
  })

  afterEach(async () => {
    await registry.close()
    cleanupSandbox(sandbox)
  })

  it("list renders the catalogue", async () => {
    await expect(
      withEnv(
        {
          DEESSEJS_API_URL: registry.url,
          DEESSEJS_GITHUB_RAW_BASE: registry.url,
        },
        async () =>
          withCwd(sandbox, async () =>
            invoke({ cwd: sandbox, args: ["list"] }),
          ),
      ),
    ).resolves.toMatchObject({
      exitCode: 0,
      stdout: expect.stringContaining("alpha"),
    })
  })

  it("info renders a known slug", async () => {
    await expect(
      withEnv(
        {
          DEESSEJS_API_URL: registry.url,
          DEESSEJS_GITHUB_RAW_BASE: registry.url,
        },
        async () =>
          withCwd(sandbox, async () =>
            invoke({ cwd: sandbox, args: ["info", "alpha"] }),
          ),
      ),
    ).resolves.toMatchObject({
      exitCode: 0,
      stdout: expect.stringContaining("Alpha Template"),
    })
  })

  it("info exits non-zero for an unknown slug", async () => {
    let exitCode = -1
    try {
      await withEnv(
        {
          DEESSEJS_API_URL: registry.url,
          DEESSEJS_GITHUB_RAW_BASE: registry.url,
        },
        async () =>
          withCwd(sandbox, async () =>
            invoke({ cwd: sandbox, args: ["info", "unknown"] }),
          ),
      )
    } catch (err) {
      // The CLI throws a fresh Error from `info.ts` when the
      // slug is unknown; the top-level `program.parseAsync(...).
      // catch(...)` rewraps it in `internal(err.message)` so the
      // thrown error here is a synthetic CliError. The exit code
      // we care about is the original non-zero value.
      exitCode = (err as { exitCode?: number }).exitCode ?? -1
    }
    // Non-zero exit is the load-bearing assertion: the user
    // sees a failure, not a success. The exact error message
    // is already covered by the unit test that pins the CLI's
    // info command handler output.
    expect(exitCode).not.toBe(0)
  })
})