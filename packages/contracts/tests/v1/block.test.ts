import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { BlockV1 } from "../../src/v1/block.js"

/**
 * Same fixture-mandatory rule per ADR-036 §7: every closed invariant on
 * BlockV1 is exercised by at least one negative fixture. The 5 valid
 * fixtures cover the realistic block surface; the invalids each violate
 * exactly one invariant.
 */

const BASE_VALID: Record<string, unknown> = {
  $schema: "https://registry.deessejs.com/schema/block/v1.json",
  name: "blog",
  title: "Blog",
  description: "A full blog feature: index page, server API, post card, use-blog hook.",
  type: "block:feature",
  version: "1.0.0",
  source: {
    repo: "deessejs/blog-block",
    ref: "v1.0.0",
  },
  files: [
    {
      path: "files/blog-index-page.tsx",
      type: "block:page",
      target: "@routes/blog/page.tsx",
    },
    {
      path: "files/blog-server-api.ts",
      type: "block:lib",
      target: "@lib/blog/server.ts",
    },
    {
      path: "files/use-blog.ts",
      type: "block:hook",
      target: "@hooks/use-blog.ts",
    },
  ],
}

describe("BlockV1 — valid fixtures", () => {
  it("parses the canonical example fixture (block-example.json)", () => {
    /**
     * Round-trip the canonical example that ships alongside the schema.
     * A regression here means the example no longer matches the contract.
     */
    const here = fileURLToPath(import.meta.url)
    const examplePath = resolve(here, "../../../src/v1/block-example.json")
    const raw = JSON.parse(readFileSync(examplePath, "utf8"))
    const result = BlockV1.parse(raw)
    expect(result.type).toBe("block:feature")
    expect(result.name).toBe("blog")
    expect(result.requires?.runtime).toBe("nextjs")
    expect(result.files).toHaveLength(6)
    expect(result.blockDependencies).toEqual(["auth", "crud"])
    expect(result.prompts).toHaveLength(2)
  })

  it("parses the minimum required fields", () => {
    const minimal = {
      $schema: "https://registry.deessejs.com/schema/block/v1.json",
      name: "blog",
      title: "Blog",
      type: "block:feature",
      version: "0.1.0",
      source: { repo: "deessejs/blog-block", ref: "v1.0.0" },
    }
    const result = BlockV1.parse(minimal)
    expect(result.type).toBe("block:feature")
  })

  it("parses a `block:feature` with mixed per-file types", () => {
    const result = BlockV1.parse({
      ...BASE_VALID,
    })
    expect(result.files).toHaveLength(3)
  })

  it("parses a `block:font/theme` block", () => {
    const result = BlockV1.parse({
      ...BASE_VALID,
      type: "block:font/theme",
      name: "inter-font",
      files: [
        {
          path: "Inter-Variable.woff2",
          type: "block:font/theme",
          target: "@assets/fonts/Inter-Variable.woff2",
        },
        {
          path: "inter-font.css",
          type: "block:source",
        },
      ],
    })
    expect(result.type).toBe("block:font/theme")
  })

  it("parses a `block:page` with a single matching file", () => {
    const result = BlockV1.parse({
      ...BASE_VALID,
      type: "block:page",
      name: "about-page",
      files: [
        {
          path: "files/about/page.tsx",
          type: "block:page",
          target: "@routes/about/page.tsx",
        },
        {
          path: "files/about/config.ts",
          type: "block:source",
        },
      ],
    })
    expect(result.type).toBe("block:page")
    expect(result.files).toHaveLength(2)
  })

  it("accepts `blockDependencies` (renamed from `templateDependencies`)", () => {
    const result = BlockV1.parse({
      ...BASE_VALID,
      blockDependencies: ["auth", "crud"],
    })
    expect(result.blockDependencies).toEqual(["auth", "crud"])
  })
})

describe("BlockV1 — `type` closed enum (8 values)", () => {
  it("rejects an invented `type` value", () => {
    const broken = { ...BASE_VALID, type: "block:widget" }
    expect(() => BlockV1.parse(broken)).toThrow(/type|enum/)
  })

  it("accepts every value in the closed 8-value enum", () => {
    const validTypes = [
      "block:feature",
      "block:page",
      "block:component",
      "block:hook",
      "block:lib",
      "block:ui",
      "block:file",
      "block:font/theme",
    ] as const
    for (const type of validTypes) {
      const isFeature = type === "block:feature"
      const result = BlockV1.parse({
        ...BASE_VALID,
        type,
        name: `block-${type.replace(/[^a-z]/g, "")}`,
        // Non-feature blocks require files of matching type (block:source
        // is always allowed and is the only file type when only one file
        // is needed for a non-feature entry).
        files: isFeature
          ? BASE_VALID.files
          : [{ path: `files/${type.replace(/[^a-z]/g, "")}.ts`, type: "block:source" }],
      })
      expect(result.type).toBe(type)
    }
  })
})

describe("BlockV1 — `files[].type` mandatory + closed enum", () => {
  it("rejects a file without `type`", () => {
    const broken = {
      ...BASE_VALID,
      files: [{ path: "foo.tsx", target: "src/foo.tsx" }],
    }
    expect(() => BlockV1.parse(broken)).toThrow(/type/)
  })

  it("rejects a file with `type` outside the closed enum", () => {
    const broken = {
      ...BASE_VALID,
      files: [
        {
          path: "foo.tsx",
          type: "template:source", // wrong namespace
          target: "src/foo.tsx",
        },
      ],
    }
    expect(() => BlockV1.parse(broken)).toThrow(/type|enum/)
  })

  it("accepts `block:source` as a per-file type (the metadata escape hatch)", () => {
    const result = BlockV1.parse({
      ...BASE_VALID,
      type: "block:page",
      files: [
        {
          path: "files/page/config.ts",
          type: "block:source",
        },
        {
          path: "files/page/page.tsx",
          type: "block:page",
          target: "@routes/page.tsx",
        },
      ],
    })
    expect(result.files).toHaveLength(2)
  })
})

describe("BlockV1 — non-feature blocks require per-file type match", () => {
  it("rejects a `block:page` block that mixes page and lib files", () => {
    const broken = {
      ...BASE_VALID,
      type: "block:page",
      name: "broken-block",
      files: [
        {
          path: "files/page/page.tsx",
          type: "block:page",
          target: "@routes/page.tsx",
        },
        {
          path: "files/page/api.ts",
          type: "block:lib",
          target: "@lib/page/api.ts",
        },
      ],
    }
    expect(() => BlockV1.parse(broken)).toThrow(/non-feature blocks/)
  })

  it("accepts a `block:feature` block with mixed per-file types", () => {
    const result = BlockV1.parse({
      ...BASE_VALID,
      type: "block:feature",
    })
    expect(result.files).toHaveLength(3)
  })

  it("accepts a `block:font/theme` block where one file is `block:source`", () => {
    const result = BlockV1.parse({
      ...BASE_VALID,
      type: "block:font/theme",
      name: "inter-font",
      files: [
        {
          path: "Inter-Variable.woff2",
          type: "block:font/theme",
          target: "@assets/fonts/Inter-Variable.woff2",
        },
        {
          path: "inter-font.css",
          type: "block:source",
        },
      ],
    })
    expect(result.type).toBe("block:font/theme")
  })
})

describe("BlockV1 — `$schema` and `version` invariants", () => {
  it("rejects the wrong `$schema` URL", () => {
    const broken = {
      ...BASE_VALID,
      $schema: "https://registry.deessejs.com/schema/template/v2.json",
    }
    expect(() => BlockV1.parse(broken)).toThrow()
  })

  it("rejects a non-semver version", () => {
    const broken = { ...BASE_VALID, version: "v1" }
    expect(() => BlockV1.parse(broken)).toThrow(/semver|version/)
  })
})

describe("BlockV1 — `requires.runtime` mandatory when present", () => {
  it("rejects a `requires` object without `runtime`", () => {
    const broken = {
      ...BASE_VALID,
      requires: { node: ">=20.0.0" },
    }
    expect(() => BlockV1.parse(broken)).toThrow(/runtime/)
  })

  it("accepts absence of `requires` entirely", () => {
    const { requires: _stripped, ...withoutRequires } = BASE_VALID
    expect(() => BlockV1.parse(withoutRequires)).not.toThrow()
  })
})

describe("BlockV1 — `prompts` invariants", () => {
  it("rejects duplicate prompt `name`s", () => {
    const broken = {
      ...BASE_VALID,
      prompts: [
        { name: "x", type: "text", message: "x?" },
        { name: "x", type: "text", message: "y?" },
      ],
    }
    expect(() => BlockV1.parse(broken)).toThrow(/unique/)
  })

  it("rejects a snake_case violation in prompt names", () => {
    const broken = {
      ...BASE_VALID,
      prompts: [{ name: "X", type: "text", message: "x?" }],
    }
    expect(() => BlockV1.parse(broken)).toThrow(/name/)
  })
})
