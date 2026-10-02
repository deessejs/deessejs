/**
 * Tests for the install-plan helpers in `apps/cli/src/output/plan.ts`.
 *
 * The plan shape is the structured output of `deessejs init --dry-run`.
 * It must be:
 *   - **Pure**: the build function does not read the FS unless
 *     injected with an `FsProbe`. Tests use an in-memory map.
 *   - **Complete**: every side-effect surface of the install
 *     sequence (files, hooks, deps, prompts) is reflected.
 *   - **Honest**: the `wouldOverwrite` field on each file is the
 *     only place the FS probe is consulted, and a missing probe
 *     returns `false`.
 */
import { resolve } from "node:path"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

import {
  buildInstallPlan,
  printInstallPlan,
  type FsProbe,
  type InstallPlan,
} from "../../src/output/plan.js"
import type { TemplateV2 } from "@workspace/registry-client"

const sampleDescriptor: TemplateV2 = {
  $schema: "https://registry.deessejs.com/schema/template/v2.json",
  name: "saas-template",
  title: "SaaS Template",
  type: "template:app",
  version: "1.4.0",
  description: "A test template.",
  author: "deessejs",
  source: { repo: "deessejs/saas-template" },
  requires: { runtime: "node" },
  dependencies: ["next", "react"] as unknown as TemplateV2["dependencies"],
  devDependencies: ["typescript"] as unknown as TemplateV2["devDependencies"],
  hooks: {
    postInit: ["echo post-init"],
    postInstall: ["echo post-install"],
  },
  prompts: [
    {
      name: "db",
      type: "select",
      message: "Pick a database",
      options: ["postgres", "mysql"],
    },
    {
      name: "name",
      type: "text",
      message: "Project name",
    },
  ],
  files: [
    { path: "package.json", target: "package.json", type: "template:config" },
    {
      path: "src/index.ts",
      target: "src/index.ts",
      type: "template:source",
    },
  ],
} as unknown as TemplateV2

const inMemoryFs: (paths: readonly string[]) => FsProbe = (paths) => {
  const set = new Set(paths)
  return (p) => set.has(p)
}

describe("buildInstallPlan", () => {
  it("returns a plan with all descriptor-derived fields populated", () => {
    const plan = buildInstallPlan(
      sampleDescriptor,
      "saas-starter",
      "/tmp/target",
      () => false,
    )
    expect(plan.slug).toBe("saas-starter")
    expect(plan.title).toBe("SaaS Template")
    expect(plan.version).toBe("1.4.0")
    expect(plan.source).toBe("deessejs/saas-template")
    expect(plan.targetDir).toBe("/tmp/target")
    expect(plan.files.map((f) => f.path)).toEqual(["package.json", "src/index.ts"])
    expect(plan.hooks.postInit).toEqual(["echo post-init"])
    expect(plan.hooks.postInstall).toEqual(["echo post-install"])
    expect(plan.deps.runtime).toEqual(["next", "react"])
    expect(plan.deps.dev).toEqual(["typescript"])
    expect(plan.promptCount).toBe(2)
  })

  it("resolves each file target as an absolute path under targetDir", () => {
    const plan = buildInstallPlan(
      sampleDescriptor,
      "saas-starter",
      "/tmp/target",
      () => false,
    )
    expect(plan.files[0]?.target).toBe(resolve("/tmp/target", "package.json"))
    expect(plan.files[1]?.target).toBe(resolve("/tmp/target", "src/index.ts"))
  })

  it("uses file.target when the descriptor declares it, falling back to path", () => {
    const descriptor = {
      ...sampleDescriptor,
      files: [
        {
          path: "src/foo.ts",
          target: "renamed/foo.ts",
          type: "template:source",
        },
      ],
    } as unknown as TemplateV2
    const plan = buildInstallPlan(
      descriptor,
      "saas-starter",
      "/tmp/target",
      () => false,
    )
    expect(plan.files[0]?.path).toBe("renamed/foo.ts")
    expect(plan.files[0]?.target).toBe(resolve("/tmp/target", "renamed/foo.ts"))
  })

  it("flags wouldOverwrite when the probe says the target file exists", () => {
    const probe = inMemoryFs([resolve("/tmp/target", "package.json")])
    const plan = buildInstallPlan(
      sampleDescriptor,
      "saas-starter",
      "/tmp/target",
      probe,
    )
    expect(plan.files[0]?.wouldOverwrite).toBe(true)
    expect(plan.files[1]?.wouldOverwrite).toBe(false)
  })

  it("flags wouldOverwriteTarget when the target dir exists", () => {
    const probe = inMemoryFs(["/tmp/target"])
    const plan = buildInstallPlan(
      sampleDescriptor,
      "saas-starter",
      "/tmp/target",
      probe,
    )
    expect(plan.wouldOverwriteTarget).toBe(true)
  })

  it("defaults to empty arrays when the descriptor omits fields", () => {
    const minimal = {
      ...sampleDescriptor,
      dependencies: undefined,
      devDependencies: undefined,
      hooks: undefined,
      prompts: undefined,
      files: undefined,
    } as unknown as TemplateV2
    const plan = buildInstallPlan(
      minimal,
      "saas-starter",
      "/tmp/target",
      () => false,
    )
    expect(plan.files).toEqual([])
    expect(plan.deps.runtime).toEqual([])
    expect(plan.deps.dev).toEqual([])
    expect(plan.hooks.postInit).toEqual([])
    expect(plan.hooks.postInstall).toEqual([])
    expect(plan.promptCount).toBe(0)
  })
})

describe("printInstallPlan", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stdoutWrites: string[]

  beforeEach(() => {
    stdoutWrites = []
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk) => {
        stdoutWrites.push(
          typeof chunk === "string" ? chunk : chunk.toString(),
        )
        return true
      })
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
  })

  it("prints a human-readable summary with all sections", () => {
    const plan: InstallPlan = {
      slug: "saas-starter",
      title: "SaaS Template",
      version: "1.4.0",
      source: "deessejs/saas-template",
      targetDir: "/tmp/target",
      files: [
        {
          path: "package.json",
          target: "/tmp/target/package.json",
          wouldOverwrite: false,
        },
      ],
      hooks: { postInit: ["echo x"], postInstall: [] },
      deps: { runtime: ["next"], dev: [] },
      promptCount: 2,
      wouldOverwriteTarget: false,
    }
    printInstallPlan(plan)
    const out = stdoutWrites.join("")
    expect(out).toContain("Plan for")
    expect(out).toContain("SaaS Template")
    expect(out).toContain("v1.4.0")
    expect(out).toContain("Source:")
    expect(out).toContain("deessejs/saas-template")
    expect(out).toContain("Target dir:")
    expect(out).toContain("Files:")
    expect(out).toContain("postInit (1)")
    expect(out).toContain("next")
    expect(out).toContain("Prompts:")
    expect(out).toContain("Run without --dry-run to apply.")
  })

  it("flags target dir collision in the summary", () => {
    const plan: InstallPlan = {
      slug: "saas-starter",
      title: "SaaS Template",
      version: "1.4.0",
      source: "deessejs/saas-template",
      targetDir: "/tmp/existing",
      files: [],
      hooks: { postInit: [], postInstall: [] },
      deps: { runtime: [], dev: [] },
      promptCount: 0,
      wouldOverwriteTarget: true,
    }
    printInstallPlan(plan)
    const out = stdoutWrites.join("")
    expect(out).toContain("target dir already exists")
  })

  it("lists individual files that would be overwritten", () => {
    const plan: InstallPlan = {
      slug: "saas-starter",
      title: "SaaS Template",
      version: "1.4.0",
      source: "deessejs/saas-template",
      targetDir: "/tmp/target",
      files: [
        {
          path: "package.json",
          target: "/tmp/target/package.json",
          wouldOverwrite: true,
        },
        {
          path: "src/index.ts",
          target: "/tmp/target/src/index.ts",
          wouldOverwrite: false,
        },
      ],
      hooks: { postInit: [], postInstall: [] },
      deps: { runtime: [], dev: [] },
      promptCount: 0,
      wouldOverwriteTarget: false,
    }
    printInstallPlan(plan)
    const out = stdoutWrites.join("")
    expect(out).toContain("Would overwrite:")
    expect(out).toContain("/tmp/target/package.json")
    expect(out).not.toContain("/tmp/target/src/index.ts")
  })
})