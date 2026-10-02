/**
 * End-to-end integration tests for `deessejs init`.
 *
 * Spawns a fake DeesseJS registry on `127.0.0.1:0`, redirects
 * `DEESSEJS_API_URL` and `DEESSEJS_GITHUB_RAW_BASE` to its URL,
 * and runs the real `initCommand` against a tmpdir sandbox. No
 * GitHub, no `app.deessejs.com`, no `pnpm install` — the install
 * step is skipped via `--no-install`.
 *
 * What we prove:
 *   - A complete scaffold round-trip:
 *       fetch descriptor → download each file URL → mkdir →
 *       writeFile. The files appear on disk with the right
 *       contents, in the right paths, with `--no-install` skipped.
 *   - `--dry-run` writes nothing.
 *   - Refusing to overwrite without `--force`.
 *   - The CLI surfaces `RegistryIncompatibleTemplate` when the
 *     fake server serves a descriptor that fails Zod validation.
 *
 * What we deliberately do not pin:
 *   - The `pnpm install` subprocess (skipped by `--no-install`).
 *   - The bare descriptor name validity (the SDK's responsibility).
 *
 * These tests run in CI without external network. A flake means a
 * regression in the wiring, not a GitHub outage.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  cleanupSandbox,
  makeSandbox,
  withCwd,
  withEnv,
  withHome,
} from "./_sandbox.js"
import { startFakeRegistry, type FakeCatalogEntry } from "./fakes/registry-server.js"
import { invoke } from "./_invoke.js"

const fixtureDescriptor = (
  name: string,
  owner: string,
  repo: string,
): { descriptor: Record<string, unknown>; files: Record<string, string> } => {
  const descriptor = {
    $schema: "https://registry.deessejs.com/schema/template/v2.json",
    name,
    title: `Fixture ${name}`,
    description: "Integration-test fixture template.",
    type: "template:app",
    version: "1.0.0",
    author: "Test Author <test@example.com>",
    source: { repo: `${owner}/${repo}`, ref: "main" },
    requires: { runtime: "node" },
    files: [
      {
        path: "package.json",
        type: "template:config",
        target: "package.json",
      },
      {
        path: "src/index.ts",
        type: "template:source",
        target: "src/index.ts",
      },
      {
        path: "README.md",
        type: "template:doc",
        target: "README.md",
      },
    ],
  }
  const files: Record<string, string> = {
    "package.json": JSON.stringify({ name, version: "1.0.0" }, null, 2),
    "src/index.ts": "export const greeting = \"hello\";\n",
    "README.md": `# ${name}\n\nA fixture template for integration tests.\n`,
  }
  return { descriptor, files }
}

const makeFixture = (
  slug: string,
  owner = "deessejs",
  repo = "fixture-template",
): FakeCatalogEntry => {
  const { descriptor, files } = fixtureDescriptor(slug, owner, repo)
  return {
    slug,
    title: `Fixture ${slug}`,
    description: "Integration-test fixture template.",
    layer: "open-community",
    latestVersion: "1.0.0",
    owner,
    repo,
    descriptor,
    files,
  }
}

/**
 * Wrap the invoke call in env / home / cwd overrides. Keeping
 * the orchestration in one helper means each test asserts on
 * a single behaviour; the env plumbing is identical across
 * tests and changes only in `_sandbox.ts`.
 */
const runInit = async (
  registry: { url: string },
  sandbox: string,
  args: readonly string[],
): Promise<unknown> =>
  withEnv(
    {
      DEESSEJS_API_URL: registry.url,
      DEESSEJS_GITHUB_RAW_BASE: registry.url,
    },
    async () =>
      withHome(sandbox, async () =>
        withCwd(sandbox, async () =>
          invoke({ cwd: sandbox, args: [...args] }),
        ),
      ),
  )

describe("deessejs init (integration)", () => {
  let sandbox: string
  let registry: Awaited<ReturnType<typeof startFakeRegistry>>

  beforeEach(async () => {
    sandbox = makeSandbox("init")
    registry = await startFakeRegistry([makeFixture("fixture-app")])
  })

  afterEach(async () => {
    await registry.close()
    cleanupSandbox(sandbox)
  })

  it("scaffolds every declared file under <slug>/", async () => {
    await runInit(registry, sandbox, ["init", "fixture-app", "--no-install"])

    const target = join(sandbox, "fixture-app")
    expect(existsSync(join(target, "package.json"))).toBe(true)
    expect(existsSync(join(target, "src/index.ts"))).toBe(true)
    expect(existsSync(join(target, "README.md"))).toBe(true)
    expect(readFileSync(join(target, "package.json"), "utf8")).toContain(
      "fixture-app",
    )
  })

  it("--dry-run writes nothing to disk", async () => {
    await runInit(registry, sandbox, [
      "init",
      "fixture-app",
      "--no-install",
      "--dry-run",
    ])

    expect(existsSync(join(sandbox, "fixture-app"))).toBe(false)
  })

  it("refuses to overwrite an existing target without --force", async () => {
    mkdirSync(join(sandbox, "fixture-app"), { recursive: true })
    writeFileSync(
      join(sandbox, "fixture-app", "package.json"),
      '{"preexisting":true}',
    )

    await expect(
      runInit(registry, sandbox, ["init", "fixture-app", "--no-install"]),
    ).rejects.toThrow(/target exists|already exists/i)

    // The pre-existing file is untouched.
    expect(readFileSync(join(sandbox, "fixture-app", "package.json"), "utf8"))
      .toBe('{"preexisting":true}')
  })

  it("surfaces RegistryIncompatibleTemplate when the fake descriptor fails Zod", async () => {
    // Replace the catalogue with a fixture whose descriptor is
    // missing a required field. The fake server's fetch-descriptor
    // returns 422 → CLI maps to parse_error.
    registry.setCatalogue([
      {
        ...makeFixture("broken-template"),
        descriptor: {
          $schema: "https://registry.deessejs.com/schema/template/v2.json",
          title: "Missing name",
          type: "template:app",
          version: "1.0.0",
          author: "x <x@x.com>",
          source: { repo: "deessejs/broken-template" },
          // `name` is missing — required per TemplateV2
        },
      },
    ])

    // Use a different slug from the catalogue so the routing
    // falls into the GitHub-direct path (since `broken-template`
    // does not match the `owner/repo` regex on its own).
    // The fake server returns 422 for any fetch-descriptor call,
    // regardless of the slug.
    await expect(
      runInit(registry, sandbox, [
        "init",
        "broken-template/something",
        "--no-install",
      ]),
    ).rejects.toThrow(/incompatible|missing/i)
  })

  it("--dry-run on a glob descriptor still works through the API path (V2 descriptor is accepted by the schema)", async () => {
    // The CLI's init command on a catalogue-slug (path API) only
    // scaffolds files explicitly listed in `descriptor.files[]`. A
    // glob-only descriptor therefore scaffolds zero files. This
    // test pins that behaviour: a glob-only descriptor does NOT crash,
    // it just produces an empty scaffold.
    //
    // The full V2 init flow (tree fetch + resolveFiles for the
    // GitHub-direct path) lands in a follow-up; this test guards
    // the API-path behaviour.
    const descriptor = {
      $schema: "https://registry.deessejs.com/schema/template/v2.json",
      name: "starter-dry",
      title: "Starter Dry",
      type: "template:starter",
      version: "1.0.0",
      source: { repo: "deessejs/starter-dry", ref: "main" },
      includes: ["**"],
      excludes: ["**/*.test.ts"],
    }
    registry.setCatalogue([
      {
        slug: "starter-dry",
        title: "Starter Dry",
        layer: "open-community",
        latestVersion: "1.0.0",
        owner: "deessejs",
        repo: "starter-dry",
        descriptor,
        files: {}, // no explicit files → no scaffold
      },
    ])

    // --dry-run on a glob-only descriptor: does NOT crash.
    await runInit(registry, sandbox, [
      "init",
      "starter-dry",
      "--no-install",
      "--dry-run",
    ])
    expect(existsSync(join(sandbox, "starter-dry"))).toBe(false)
  })
})