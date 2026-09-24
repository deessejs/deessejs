/**
 * Wire envelope — the discriminated union that the registry serves on
 * every `GET /r/{slug}.json`.
 *
 * The envelope is NOT itself part of the public contract surface (it's
 * an internal transport detail). It exists to:
 *   1. Disambiguate at fetch time without probing file names
 *   2. Carry a per-version `$schema` URL distinct from the descriptor's
 *   3. Allow future shapes (theme bundles, font packs) to be added
 *      without renaming the envelope
 *
 * Schema URLs (immutable per version, per ADR-036 §3):
 *   /schema/envelope/v1.json  — this envelope
 *   /schema/template/v2.json  — TemplateV2
 *   /schema/block/v1.json     — BlockV1
 *
 * The envelope has its own schema URL even though it's "just" a
 * discriminator — this lets a client pin the envelope shape separately
 * from the descriptor shape, which matters when V3 introduces new
 * descriptor kinds.
 */

import { z } from "zod"

import * as v2Contracts from "@workspace/contracts/v2"
import * as v1Contracts from "@workspace/contracts/v1"

const TemplateV2 = v2Contracts.TemplateV2
const BlockV1 = v1Contracts.BlockV1

/**
 * The envelope. The discriminator is `format` per RFC-005 §237.
 *
 * Note that we re-export the parsed descriptor in the discriminated
 * union as `template`/`block` so callers can destructure once. When
 * `BlockV2` ships, we add `z.object({ format: z.literal('block'), block: BlockV2 })`
 * here — no changes to the gateway code.
 */
export const WireEnvelope = z.discriminatedUnion("format", [
  z.object({
    $schema: z.literal(
      "https://registry.deessejs.com/schema/envelope/v1.json",
    ),
    format: z.literal("template"),
    template: TemplateV2,
  }),
  z.object({
    $schema: z.literal(
      "https://registry.deessejs.com/schema/envelope/v1.json",
    ),
    format: z.literal("block"),
    block: BlockV1,
  }),
])

/** Convenience type for the parsed envelope. */
export type WireEnvelope = z.infer<typeof WireEnvelope>
