/**
 * Locks the contract that `@workspace/env/client` does not depend on
 * `node:fs` or on the loader.
 *
 * Why this test exists (ADR-011, rank 1):
 *
 *   PR #49 (commit 4a79e71) had to fix a leak where `client.ts`
 *   imported `loadDotenvSnapshot` from `./loader.js`, and `loader.ts`
 *   loaded `node:fs`. Turbopack refused to bundle `node:fs` into a
 *   client chunk, so the apps/web and apps/app builds failed with:
 *
 *     Error: Turbopack build failed with 1 errors:
 *     ./packages/env/dist/client.js
 *     Caused by: the chunking context (unknown) does not support
 *                external modules (request: node:fs)
 *
 *   The leak surfaced in the CI Build job, not locally. A unit
 *   test that walks the module graph after build catches it in
 *   milliseconds.
 *
 * What this test asserts:
 *
 *   1. Static check on `dist/client.js`:
 *      - No `from "./loader.js"` import.
 *      - No `from "node:fs"` or `from "node:path"` import.
 *      - No string literal `node:fs` in the source.
 *
 *   2. Runtime check in a fresh Node subprocess:
 *      - `require("@workspace/env/client")` returns without throwing.
 *      - The returned module exposes `clientEnv` with the three
 *        `NEXT_PUBLIC_*` keys.
 *
 * The runtime check is integration-tier because it needs the package's
 * compiled `dist/`. It runs as a single test file rather than
 * per-case because both checks share the same setup (loading
 * `dist/` + spawning Node).
 */

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const HERE = fileURLToPath(new URL(".", import.meta.url))
const PACKAGE_ROOT = resolve(HERE, "..", "..")
const DIST_CLIENT_JS = resolve(PACKAGE_ROOT, "dist", "client.js")
// On Windows, Node's ESM loader rejects raw absolute paths unless they
// are valid `file://` URLs. Convert once here so the subprocess
// snippet imports the dist file cleanly across platforms.
const DIST_CLIENT_URL = pathToFileURL(DIST_CLIENT_JS).href

function loadDistSource(): string {
  if (!existsSync(DIST_CLIENT_JS)) {
    throw new Error(
      `dist/client.js missing at ${DIST_CLIENT_JS}. Run \`pnpm --filter @workspace/env build\` before running tests.`
    )
  }
  return readFileSync(DIST_CLIENT_JS, "utf8")
}

describe("@workspace/env/client — client bundle must not pull node:fs", () => {
  it("dist/client.js exists and is non-empty", () => {
    // Pre-condition for the static and runtime checks below.
    expect(existsSync(DIST_CLIENT_JS)).toBe(true)
    const source = loadDistSource()
    expect(source.length).toBeGreaterThan(0)
  })

  it("dist/client.js does not import the loader", () => {
    const source = loadDistSource()
    // The literal `loader.js` or `loader.ts` referenced by the
    // import path is the regression signal. If a future refactor
    // adds the import back, the test fails before the bundler
    // does.
    expect(source).not.toMatch(/from\s+["']\.\/loader/)
  })

  it("dist/client.js does not reference node:fs or node:path", () => {
    const source = loadDistSource()
    // Both `node:fs` and `node:path` are non-importable into a
    // browser chunk. The loader uses both; the client must reach
    // for neither, even as a transitive import.
    expect(source).not.toMatch(/["']node:fs["']/)
    expect(source).not.toMatch(/["']node:path["']/)
    expect(source).not.toMatch(/from\s+["']node:fs/)
    expect(source).not.toMatch(/from\s+["']node:path/)
  })

  it("dist/client.js loads in a fresh Node subprocess without throwing", () => {
    // The runtime check: the module graph compiles, evaluates, and
    // exposes `clientEnv` without pulling `node:fs`. We use a
    // subprocess so the loader side-effect (`loadRepoEnv()` at the
    // top of `server.ts`) is not triggered by this test (we are
    // testing the client-only path).
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { clientEnv } from ${JSON.stringify(DIST_CLIENT_URL)};
          const out = {
            hasName: typeof clientEnv.NEXT_PUBLIC_APP_NAME === "string",
            hasDesc:
              typeof clientEnv.NEXT_PUBLIC_APP_DESCRIPTION === "string",
            hasUrl: typeof clientEnv.NEXT_PUBLIC_APP_URL === "string",
          };
          process.stdout.write(JSON.stringify(out));
        `,
      ],
      { encoding: "utf8" }
    )

    if (result.status !== 0) {
      throw new Error(
        `subprocess exited ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
      )
    }

    const payload = JSON.parse(result.stdout)
    expect(payload).toEqual({
      hasName: true,
      hasDesc: true,
      hasUrl: true,
    })
  })
})
