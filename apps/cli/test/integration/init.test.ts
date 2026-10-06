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
      // The fake mounts raw content at
      // `/raw.githubusercontent.com/...`. Production uses
      // `https://raw.githubusercontent.com` (which already
      // includes the path segment). We mirror the production
      // shape so the test exercises the same URL construction
      // as prod.
      DEESSEJS_GITHUB_RAW_BASE: `${registry.url}/raw.githubusercontent.com`,
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

    // Use the catalogue slug so the SDK routes through the API
    // path (`POST /api/v1/registry/fetch-descriptor`). The fake
    // server forwards the broken descriptor, the SDK's Zod parse
    // fails, and the CLI surfaces `parse_error` to the user.
    await expect(
      runInit(registry, sandbox, [
        "init",
        "broken-template",
        "--no-install",
      ]),
    ).rejects.toThrow(/corrupted|invalid|incompatible|missing|parse_error|internal/i)
  })

  it("--dry-run on a glob descriptor reports the resolved files (V2 API path)", async () => {
    // The V2 init flow resolves `descriptor.includes/excludes/fileTypes`
    // against the API server's tree (or the GitHub tree on the
    // GitHub-direct path). For a catalogue slug with a glob-only
    // descriptor, the API server returns a `files` map built from
    // the recursive tree. The CLI passes that resolved list to
    // `buildInstallPlan`, and the dry-run prints it. This test pins
    // the contract: > 0 files are reported, the README content is
    // observed, nothing is written to disk.
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
        files: {
          "package.json": JSON.stringify(
            { name: "starter-dry", version: "1.0.0" },
            null,
            2,
          ),
          "src/index.ts": "export const greeting = \"hello\";\n",
          "README.md": "# starter-dry\n",
          "src/index.test.ts": "should not be scaffolded (excluded)\n",
        },
      },
    ])

    // Fake server's POST /api/v1/registry/fetch-descriptor already
    // turns the entry's `files` map into a URL map; the SDK on the
    // resolveTemplate path synthesises ResolvedTemplate.files from
    // that URL map. To exercise the API path properly we need the
    // server to return a populated `files` map; the entry above
    // already provides one.

    const result = await runInit(registry, sandbox, [
      "init",
      "starter-dry",
      "--no-install",
      "--dry-run",
      "--json",
    ])
    const parsed = JSON.parse(result.stdout) as {
      plan: { files: Array<{ path: string }> }
    }

    // The API server's fetch-descriptor returns a `files` map
    // (path → URL). The SDK's resolveTemplate synthesises a
    // ResolvedTemplate from that map. The dry-run surfaces the
    // resolved paths. The fake server does not apply the
    // `includes/excludes` pipeline on the API path (it just
    // forwards every `entry.files` key), so the plan lists every
    // declared file. The contract this test pins is: > 0 files
    // are reported, and the explicit `descriptor.files[]`
    // (or `entry.files`) entries appear as resolved targets.
    expect(parsed.plan.files.length).toBeGreaterThan(0)
    expect(parsed.plan.files.some((f) => f.path === "package.json")).toBe(true)
    expect(parsed.plan.files.some((f) => f.path === "src/index.ts")).toBe(true)
    expect(parsed.plan.files.some((f) => f.path === "README.md")).toBe(true)
    // No file content was written to disk under the resolved
    // paths. The dry-run target directory may exist (some
    // implementations create it as a probe) but the actual files
    // must not.
    expect(existsSync(join(sandbox, "starter-dry", "package.json"))).toBe(false)
    expect(existsSync(join(sandbox, "starter-dry", "src/index.ts"))).toBe(false)
  })

  it("scaffolds every resolved file for a glob descriptor (V2 API path)", async () => {
    // End-to-end: a glob-only descriptor scaffolde the resolved
    // file list on disk. Regression guard for the bug fixed in
    // commit 2a02ae4's follow-up: previously `init` used
    // `client.getTemplate(slug)`, which returns `files: {}` for
    // descriptors without an explicit `files[]`, downloading zero
    // files. The fix migrates `init` to `client.resolveTemplate`,
    // which fetches the tree and applies the glob pipeline.
    const descriptor = {
      $schema: "https://registry.deessejs.com/schema/template/v2.json",
      name: "starter-scaffold",
      title: "Starter Scaffold",
      type: "template:starter",
      version: "1.0.0",
      source: { repo: "deessejs/starter-scaffold", ref: "main" },
      includes: ["**"],
      excludes: ["**/*.test.ts", "docs/**"],
    }
    registry.setCatalogue([
      {
        slug: "starter-scaffold",
        title: "Starter Scaffold",
        layer: "open-community",
        latestVersion: "1.0.0",
        owner: "deessejs",
        repo: "starter-scaffold",
        descriptor,
        files: {
          "package.json": JSON.stringify(
            { name: "starter-scaffold", version: "1.0.0" },
            null,
            2,
          ),
          "src/index.ts": "export const greeting = \"hello\";\n",
          "README.md": "# starter-scaffold\n",
        },
      },
    ])

    await runInit(registry, sandbox, [
      "init",
      "starter-scaffold",
      "--no-install",
    ])

    const target = join(sandbox, "starter-scaffold")
    expect(existsSync(join(target, "package.json"))).toBe(true)
    expect(existsSync(join(target, "src/index.ts"))).toBe(true)
    expect(existsSync(join(target, "README.md"))).toBe(true)
    expect(readFileSync(join(target, "package.json"), "utf8")).toContain(
      "starter-scaffold",
    )
  })

  // The GitHub-direct path (`owner/repo` slug → SDK fetches
  // descriptor + tree directly from `api.github.com`) is exercised
  // by the unit tests of `resolveTemplateFromGithub` in
  // `packages/registry-client/tests/github.test.ts`. End-to-end
  // coverage of this path requires a fully-shaped GitHub API
  // mock (existence probe, recursive tree, raw descriptor fetch)
  // and is tracked in a follow-up; the present test suite pins
  // the API path which is what the reported bug (`deessejs/package-template`)
  // exercises.
})