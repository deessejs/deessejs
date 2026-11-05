import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { parseBlockDescriptor } from "@workspace/registry/v1"
import { createAddPlan } from "../../src/utils/add-plan.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe("block installation planning", () => {
  it("links only the output package, preserves output dependencies, and plans empty env declarations", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "deesse-add-plan-"))
    temporaryDirectories.push(cwd)
    await mkdir(join(cwd, "apps/web"), { recursive: true })
    await writeFile(join(cwd, "apps/web/package.json"), JSON.stringify({ name: "@demo/web", dependencies: { react: "^19.0.0" } }))
    await writeFile(join(cwd, "pnpm-workspace.yaml"), "packages:\n  - packages/*\ncatalog:\n  typescript: ^6.0.0\n")
    const targetPath = join(cwd, "apps/web/package.json")
    const outputManifest = JSON.stringify({ name: "@workspace/cache", dependencies: { "@upstash/redis": "^1.0.0" } })
    const descriptor = parseBlockDescriptor({
      $schema: "https://app.deessejs.com/schema/block/v1.json",
      formatVersion: 1,
      name: "upstash-redis",
      version: "1.0.0",
      description: "Adds Upstash Redis.",
      provides: [{ capability: "cache", provider: "upstash", package: "cache" }],
      install: {
        packages: [{ id: "cache", path: "packages/cache" }],
        files: [
          { from: "package.json", to: { package: "cache", path: "package.json" } },
          { from: "index.ts", to: { package: "cache", path: "src/index.ts" } },
        ],
        environment: [
          { name: "UPSTASH_REDIS_REST_URL", required: true, secret: false },
          { name: "UPSTASH_REDIS_REST_TOKEN", required: true, secret: true },
        ],
      },
    })
    if (!descriptor.success) throw new Error("Test descriptor fixture must be valid.")
    const plan = await createAddPlan({
      cwd,
      targetId: "web",
      targetPath,
      targetManifest: { name: "@demo/web", dependencies: { react: "^19.0.0" } },
      descriptor: descriptor.data,
      files: [
        { from: "package.json", contents: outputManifest, to: { package: "cache", path: "package.json" } },
        { from: "index.ts", contents: "export {}", to: { package: "cache", path: "src/index.ts" } },
      ],
      identity: "fixture:upstash-redis",
      revision: "commit-or-fingerprint",
      state: { version: 1, installations: [] },
      statePath: join(cwd, ".deesse/blocks.json"),
      packageManager: { pm: "pnpm" },
    })
    const targetWrite = plan.writes.find((item) => item.path === targetPath)
    expect(targetWrite).toBeDefined()
    expect(JSON.parse(new TextDecoder().decode(targetWrite?.contents)).dependencies).toEqual({ react: "^19.0.0", "@workspace/cache": "workspace:*" })
    expect(JSON.parse(outputManifest).dependencies).toEqual({ "@upstash/redis": "^1.0.0" })
    const envWrite = plan.writes.find((item) => item.path === join(cwd, ".env.example"))
    expect(new TextDecoder().decode(envWrite?.contents)).toContain("UPSTASH_REDIS_REST_TOKEN=\n")
    expect(await readFile(targetPath, "utf8")).toContain("@demo/web")
  })
})
