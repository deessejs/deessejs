import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { WireEnvelope } from "../src/envelope.js"
import { TemplateV2 } from "@workspace/contracts/v2"
import { BlockV1 } from "@workspace/contracts/v1"

/**
 * Tests in this file live at `packages/storage/tests/envelope.test.ts`
 * and read fixtures from `packages/contracts/src/v2/template-example.json`
 * and `packages/contracts/src/v1/block-example.json`.
 *
 * Path resolution: import.meta.url points to this test file (a `.ts`
 * source URL via the vitest loader). Walking up three parents lands
 * at the monorepo root, regardless of how vitest was invoked.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const MONOREPO_ROOT = resolve(HERE, "..", "..", "..")
const TEMPLATE_EXAMPLE = resolve(
  MONOREPO_ROOT,
  "packages/contracts/src/v2/template-example.json",
)
const BLOCK_EXAMPLE = resolve(
  MONOREPO_ROOT,
  "packages/contracts/src/v1/block-example.json",
)
const ENVELOPE_SCHEMA =
  "https://registry.deessejs.com/schema/envelope/v1.json" as const

describe("WireEnvelope", () => {
  it("parses a template-shaped envelope", () => {
    const raw = JSON.parse(readFileSync(TEMPLATE_EXAMPLE, "utf8"))
    const env = {
      $schema: ENVELOPE_SCHEMA,
      format: "template" as const,
      template: raw,
    }
    const result = WireEnvelope.parse(env)
    expect(result.format).toBe("template")
    expect(result.template.name).toBe("saas-starter")
  })

  it("parses a block-shaped envelope", () => {
    const raw = JSON.parse(readFileSync(BLOCK_EXAMPLE, "utf8"))
    const env = {
      $schema: ENVELOPE_SCHEMA,
      format: "block" as const,
      block: raw,
    }
    const result = WireEnvelope.parse(env)
    expect(result.format).toBe("block")
    expect(result.block.name).toBe("blog")
  })

  it("rejects when format='template' but body is a block shape", () => {
    const blockRaw = JSON.parse(readFileSync(BLOCK_EXAMPLE, "utf8"))
    // Swap to template discriminator — should fail because the inner
    // body doesn't match TemplateV2.
    const env = {
      $schema: ENVELOPE_SCHEMA,
      format: "template" as const,
      template: blockRaw,
    }
    const result = WireEnvelope.safeParse(env)
    expect(result.success).toBe(false)
  })

  it("rejects when format='block' but body is a template shape", () => {
    const templateRaw = JSON.parse(readFileSync(TEMPLATE_EXAMPLE, "utf8"))
    const env = {
      $schema: ENVELOPE_SCHEMA,
      format: "block" as const,
      block: templateRaw,
    }
    const result = WireEnvelope.safeParse(env)
    expect(result.success).toBe(false)
  })

  it("rejects unknown format values", () => {
    const env = {
      $schema: ENVELOPE_SCHEMA,
      format: "theme" as never,
      body: {},
    }
    const result = WireEnvelope.safeParse(env)
    expect(result.success).toBe(false)
  })

  it("round-trips: parse(templateEnvelope).template is TemplateV2-compliant", () => {
    // Sanity: confirm that what comes out of WireEnvelope is acceptable
    // to the bare TemplateV2 schema (i.e. the discriminated union doesn't
    // add undeclared fields).
    const raw = JSON.parse(readFileSync(TEMPLATE_EXAMPLE, "utf8"))
    const env = WireEnvelope.parse({
      $schema: ENVELOPE_SCHEMA,
      format: "template",
      template: raw,
    })
    expect(() => TemplateV2.parse(env.template)).not.toThrow()
  })

  it("round-trips: parse(blockEnvelope).block is BlockV1-compliant", () => {
    const raw = JSON.parse(readFileSync(BLOCK_EXAMPLE, "utf8"))
    const env = WireEnvelope.parse({
      $schema: ENVELOPE_SCHEMA,
      format: "block",
      block: raw,
    })
    expect(() => BlockV1.parse(env.block)).not.toThrow()
  })
})
