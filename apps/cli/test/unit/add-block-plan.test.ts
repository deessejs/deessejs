import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  parseBlockDescriptor,
  type BlockDescriptorV1,
} from "@workspace/registry/v1"
import { createAddPlan } from "../../src/utils/add-plan.js"
import type { AddBlockFile } from "../../src/utils/add-types.js"

type TestFixture = {
  cwd: string
  targetPath: string
  descriptor: BlockDescriptorV1
}

const temporaryDirectories: string[] = []
const outputManifest = JSON.stringify({
  name: "@workspace/cache",
  dependencies: { "@upstash/redis": "^1.0.0" },
})
const blockFiles: AddBlockFile[] = [
  {
    from: "package.json",
    contents: outputManifest,
    to: { package: "cache", path: "package.json" },
  },
  {
    from: "index.ts",
    contents: "export {}",
    to: { package: "cache", path: "src/index.ts" },
  },
]
const descriptorInput = {
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
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

describe("block installation planning", () => {
  it("links only the output package and preserves its own dependencies", async () => {
    const fixture = await createFixture()
    const plan = await createPlan(fixture)
    await expectConsumerLink(plan, fixture)
    expectOutputDependencies()
    await expectEnvironmentDeclaration(plan, fixture)
  })
})

async function createFixture(): Promise<TestFixture> {
  const cwd = await mkdtemp(join(tmpdir(), "deesse-add-plan-"))
  temporaryDirectories.push(cwd)
  const targetPath = join(cwd, "apps/web/package.json")
  await writeProjectFixture(cwd, targetPath)
  return { cwd, targetPath, descriptor: parseDescriptor() }
}

async function writeProjectFixture(cwd: string, targetPath: string) {
  await mkdir(join(cwd, "apps/web"), { recursive: true })
  await writeFile(
    targetPath,
    JSON.stringify({ name: "@demo/web", dependencies: { react: "^19.0.0" } })
  )
  await writeFile(
    join(cwd, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\ncatalog:\n  typescript: ^6.0.0\n"
  )
}

function parseDescriptor() {
  const descriptor = parseBlockDescriptor(descriptorInput)
  if (!descriptor.success)
    throw new Error("Test descriptor fixture must be valid.")
  return descriptor.data
}

async function createPlan(fixture: TestFixture) {
  return createAddPlan({
    cwd: fixture.cwd,
    targetId: "web",
    targetPath: fixture.targetPath,
    targetManifest: { name: "@demo/web", dependencies: { react: "^19.0.0" } },
    descriptor: fixture.descriptor,
    files: blockFiles,
    identity: "fixture:upstash-redis",
    revision: "commit-or-fingerprint",
    state: { version: 1, installations: [] },
    statePath: join(fixture.cwd, ".deesse/blocks.json"),
    packageManager: { pm: "pnpm" },
  })
}

async function expectConsumerLink(
  plan: Awaited<ReturnType<typeof createAddPlan>>,
  fixture: TestFixture
) {
  const targetWrite = plan.writes.find(
    (item) => item.path === fixture.targetPath
  )
  expect(targetWrite).toBeDefined()
  expect(
    JSON.parse(new TextDecoder().decode(targetWrite?.contents)).dependencies
  ).toEqual({ react: "^19.0.0", "@workspace/cache": "workspace:*" })
  expect(await readFile(fixture.targetPath, "utf8")).toContain("@demo/web")
}

function expectOutputDependencies() {
  expect(JSON.parse(outputManifest).dependencies).toEqual({
    "@upstash/redis": "^1.0.0",
  })
}

async function expectEnvironmentDeclaration(
  plan: Awaited<ReturnType<typeof createAddPlan>>,
  fixture: TestFixture
) {
  const envWrite = plan.writes.find(
    (item) => item.path === join(fixture.cwd, ".env.example")
  )
  expect(new TextDecoder().decode(envWrite?.contents)).toContain(
    "UPSTASH_REDIS_REST_TOKEN=\n"
  )
}
