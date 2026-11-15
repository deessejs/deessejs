import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, describe, it } from "node:test"
import assert from "node:assert/strict"
import { checkRouteHandlers } from "./check-next-route-handlers.mjs"

const roots = []
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "next-route-guard-"))
  roots.push(root)
  await mkdir(join(root, "apps/app"), { recursive: true })
  await mkdir(join(root, "apps/web"), { recursive: true })
  return root
}
after(async () => Promise.all(roots.map((root) => rm(root, { recursive: true, force: true }))))

async function route(root, path) {
  const file = join(root, path)
  await mkdir(join(file, ".."), { recursive: true })
  await writeFile(file, "export {}")
}

describe("Next route handler guard", () => {
  it("allows the app adapter and ignores docs route handlers", async () => {
    const root = await fixture()
    await route(root, "apps/app/app/api/[[...route]]/route.ts")
    await route(root, "apps/docs/src/app/api/search/route.ts")
    await route(root, "apps/app/.next/server/app/api/[[...route]]/route.js")
    const result = await checkRouteHandlers(root)
    assert.deepEqual(result.violations, [])
    assert.equal(result.found.length, 1)
  })

  it("rejects route handlers added to either product app", async () => {
    const root = await fixture()
    await route(root, "apps/app/app/api/[[...route]]/route.ts")
    await route(root, "apps/web/src/app/feed/route.ts")
    await route(root, "apps/app/app/extra/route.tsx")
    const result = await checkRouteHandlers(root)
    assert.deepEqual(result.violations.sort(), [
      "apps/app/app/extra/route.tsx",
      "apps/web/src/app/feed/route.ts",
    ])
  })
})
