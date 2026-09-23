import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { TemplateV2 } from "../../src/v2/template.js"

/**
 * Fixture-mandatory rule per ADR-036 §7: every closed invariant is exercised
 * by at least one negative fixture below. The 5 valid fixtures cover the
 * realistic starter surface; the invalid fixtures each violate exactly one
 * closed invariant and assert the parse error catches it.
 */

const BASE_VALID: Record<string, unknown> = {
  $schema: "https://registry.deessejs.com/schema/template/v2.json",
  name: "saas-starter",
  title: "SaaS Starter",
  description:
    "Production-ready Next.js + Better Auth + Postgres boilerplate for B2B SaaS",
  type: "template:app",
  version: "1.0.0",
  author: "DeesseJS <hello@deessejs.com>",
  license: "MIT",
  category: "saas",
  labels: ["nextjs", "auth", "postgres"],
  source: {
    repo: "deessejs/saas-template",
    ref: "v1.4.0",
  },
}

describe("TemplateV2 — valid fixtures", () => {
  it("parses the canonical example fixture (template-example.json)", () => {
    /**
     * Round-trip the canonical example that ships alongside the schema.
     * The example file is the source of truth that authors copy from;
     * a regression here means the example no longer matches the contract.
     */
    const here = fileURLToPath(import.meta.url)
    const examplePath = resolve(here, "../../../src/v2/template-example.json")
    const raw = JSON.parse(readFileSync(examplePath, "utf8"))
    const result = TemplateV2.parse(raw)
    expect(result.type).toBe("template:app")
    expect(result.name).toBe("saas-starter")
    expect(result.requires?.runtime).toBe("nextjs")
    expect(result.files).toHaveLength(5)
    expect(result.prompts).toHaveLength(4)
    expect(result.prompts?.every((p) => /^[a-z_][a-z0-9_]*$/.test(p.name))).toBe(
      true,
    )
  })

  it("parses the minimum required fields", () => {
    const minimal = {
      $schema: "https://registry.deessejs.com/schema/template/v2.json",
      name: "starter",
      title: "Starter",
      type: "template:app",
      version: "0.1.0",
      source: { repo: "deessejs/saas-template", ref: "v1.0.0" },
    }
    const result = TemplateV2.parse(minimal)
    expect(result.type).toBe("template:app")
  })

  it("parses a full SaaS-like template", () => {
    const result = TemplateV2.parse({
      ...BASE_VALID,
      requires: {
        runtime: "nextjs",
        node: ">=20.0.0",
        packageManager: "pnpm@9",
      },
      dependencies: ["next@^15", "better-auth@^1", "zod@^3.23"],
      devDependencies: ["typescript@^5"],
      files: [
        {
          path: "apps/web/.env.example",
          type: "template:env",
          target: "apps/web/.env",
          transform: "rename",
        },
        {
          path: "apps/web/src/lib/db.ts.template",
          type: "template:source",
          target: "@lib/db.ts",
          transform: "interpolate",
        },
      ],
      prompts: [
        {
          name: "project_name",
          type: "text",
          message: "What is your project name?",
          default: "my-app",
          validate: "^[a-z0-9-_]+$",
        },
        {
          name: "database",
          type: "select",
          message: "Which database?",
          default: "postgresql",
          choices: [
            { label: "PostgreSQL", value: "postgresql" },
            { label: "SQLite", value: "sqlite" },
          ],
        },
      ],
      hooks: {
        postInit: ["{pm} install"],
        postInstall: ["{pm} db:push", "{pm} generate"],
      },
    })
    expect(result.dependencies).toHaveLength(3)
    expect(result.files).toHaveLength(2)
    expect(result.prompts).toHaveLength(2)
  })

  it("accepts the deprecated `postinstall` alias alongside the new `hooks.postInit`", () => {
    const result = TemplateV2.parse({
      ...BASE_VALID,
      type: "template:package",
      postinstall: ["{pm} install"],
    })
    expect(result.postinstall).toEqual(["{pm} install"])
  })

  it("accepts a template:package with templateDependencies", () => {
    const result = TemplateV2.parse({
      ...BASE_VALID,
      type: "template:package",
      templateDependencies: ["crud", "auth"],
    })
    expect(result.templateDependencies).toEqual(["crud", "auth"])
  })

  it("accepts a CLI scaffold with template:cli", () => {
    const result = TemplateV2.parse({
      ...BASE_VALID,
      type: "template:cli",
      name: "my-cli",
      title: "My CLI",
    })
    expect(result.type).toBe("template:cli")
  })
})

describe("TemplateV2 — $schema invariant", () => {
  it("rejects an absent $schema (required field)", () => {
    const broken = { ...BASE_VALID, $schema: undefined }
    expect(() => TemplateV2.parse(broken)).toThrow(/\$schema/)
  })

  it("rejects a $schema pointing to the wrong URL", () => {
    const broken = {
      ...BASE_VALID,
      $schema: "https://registry.deessejs.com/schema/template/v1.json",
    }
    expect(() => TemplateV2.parse(broken)).toThrow()
  })
})

describe("TemplateV2 — `type` closed enum", () => {
  it("rejects an invented `type` value", () => {
    const broken = { ...BASE_VALID, type: "template:blog" }
    expect(() => TemplateV2.parse(broken)).toThrow(/Invalid option/)
  })

  it("rejects a missing `type`", () => {
    const { type: _stripped, ...withoutType } = BASE_VALID
    expect(() => TemplateV2.parse(withoutType)).toThrow(/type/)
  })
})

describe("TemplateV2 — `name` invariant", () => {
  it("rejects an uppercase name", () => {
    const broken = { ...BASE_VALID, name: "Saas-Starter" }
    expect(() => TemplateV2.parse(broken)).toThrow(/name/)
  })

  it("rejects a name with leading or trailing hyphen", () => {
    expect(() => TemplateV2.parse({ ...BASE_VALID, name: "-saas-starter" })).toThrow()
    expect(() => TemplateV2.parse({ ...BASE_VALID, name: "saas-starter-" })).toThrow()
  })
})

describe("TemplateV2 — `version` semver", () => {
  it("rejects a non-semver version", () => {
    const broken = { ...BASE_VALID, version: "v1.4" }
    expect(() => TemplateV2.parse(broken)).toThrow(/semver|version/)
  })

  it("rejects 'latest' as a version", () => {
    const broken = { ...BASE_VALID, version: "latest" }
    expect(() => TemplateV2.parse(broken)).toThrow()
  })
})

describe("TemplateV2 — `license` closed enum", () => {
  it("rejects a copyleft license (GPL-3.0)", () => {
    const broken = { ...BASE_VALID, license: "GPL-3.0" }
    expect(() => TemplateV2.parse(broken)).toThrow(/license|enum/)
  })

  it("rejects a free-form license string", () => {
    const broken = { ...BASE_VALID, license: "MIT License" }
    expect(() => TemplateV2.parse(broken)).toThrow()
  })
})

describe("TemplateV2 — `requires.runtime` mandatory when present", () => {
  it("rejects a `requires` object without `runtime`", () => {
    const broken = {
      ...BASE_VALID,
      requires: { node: ">=20.0.0", packageManager: "pnpm@9" },
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/runtime/)
  })

  it("accepts absence of `requires` entirely (the object is optional)", () => {
    const { requires: _stripped, ...withoutRequires } = BASE_VALID
    expect(() => TemplateV2.parse(withoutRequires)).not.toThrow()
  })

  it("accepts a `requires` with only `runtime`", () => {
    const result = TemplateV2.parse({
      ...BASE_VALID,
      requires: { runtime: "nextjs" },
    })
    expect(result.requires?.runtime).toBe("nextjs")
  })

  it("rejects a `runtime` not matching kebab-case", () => {
    const broken = {
      ...BASE_VALID,
      requires: { runtime: "NextJS" },
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/runtime/)
  })
})

describe("TemplateV2 — `files[].type` mandatory + closed enum", () => {
  it("rejects a file without `type`", () => {
    const broken = {
      ...BASE_VALID,
      files: [{ path: "foo.ts", target: "src/foo.ts" }],
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/type/)
  })

  it("rejects a file with `type` outside the closed 7-value enum", () => {
    const broken = {
      ...BASE_VALID,
      files: [{ path: "foo.ts", type: "block:page", target: "src/foo.ts" }],
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/type|enum/)
  })

  it("accepts every value in the closed 7-value enum", () => {
    const validTypes = [
      "template:env",
      "template:doc",
      "template:config",
      "template:source",
      "template:style",
      "template:test",
      "template:asset",
    ] as const
    for (const type of validTypes) {
      const result = TemplateV2.parse({
        ...BASE_VALID,
        files: [{ path: "foo", type }],
      })
      expect(result.files?.[0]?.type).toBe(type)
    }
  })
})

describe("TemplateV2 — `source` invariants", () => {
  it("rejects an invalid repo slug", () => {
    const broken = {
      ...BASE_VALID,
      source: { repo: "no-slash-here", ref: "v1.0.0" },
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/repo/)
  })

  it("rejects a `ref` that is neither semver, branch, nor SHA", () => {
    const broken = {
      ...BASE_VALID,
      source: { repo: "deessejs/foo", ref: "*@latest" },
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/ref/)
  })
})

describe("TemplateV2 — `prompts` invariants", () => {
  it("rejects a `select` prompt without `choices`", () => {
    const broken = {
      ...BASE_VALID,
      prompts: [{ name: "x", type: "select", message: "x?" }],
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/choices/)
  })

  it("rejects a prompt `name` that is not snake_case", () => {
    const broken = {
      ...BASE_VALID,
      prompts: [
        { name: "ProjectName", type: "text", message: "x?" },
      ],
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/prompt name|name/)
  })

  it("rejects duplicate prompt `name`s", () => {
    const broken = {
      ...BASE_VALID,
      prompts: [
        { name: "project", type: "text", message: "name?" },
        { name: "project", type: "text", message: "name?" },
      ],
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/unique/)
  })
})

describe("TemplateV2 — `template:app` cannot have templateDependencies", () => {
  it("rejects a template:app with templateDependencies", () => {
    const broken = {
      ...BASE_VALID,
      type: "template:app",
      templateDependencies: ["auth"],
    }
    expect(() => TemplateV2.parse(broken)).toThrow(/templateDependencies/)
  })
})

describe("TemplateV2 — `dependencies[]` format", () => {
  it("rejects a bare package name without `@version`", () => {
    const broken = { ...BASE_VALID, dependencies: ["next"] }
    expect(() => TemplateV2.parse(broken)).toThrow()
  })

  it("rejects a git+https URL", () => {
    const broken = {
      ...BASE_VALID,
      dependencies: ["git+https://github.com/foo/bar"],
    }
    expect(() => TemplateV2.parse(broken)).toThrow()
  })
})
