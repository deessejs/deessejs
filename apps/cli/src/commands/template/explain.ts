/**
 * `deessejs template explain <field-path>` (ADR-034 §4).
 *
 * Render the field description for a `TemplateV2` schema field
 * from the JSDoc on the Zod definition. The plan is to consume
 * the `.describe(...)` block on every closed-list field and
 * emit a four-section doc (type, valid values, example, common
 * mistake) plus an ADR cross-reference.
 *
 * **Status**: not yet implemented. This file ships as a
 * placeholder. The implementation depends on the JSDoc-on-Zod
 * schema contract landing in `@workspace/contracts` (tracked by
 * ADR-034 §"JSDoc-on-Zod-schema contract"). Until that contract
 * is ratified, the command exits with a structured error
 * pointing the author at ADR-034.
 */

import { Command } from "commander"

import { internal } from "../../errors/index.js"

export const explainCommand = new Command("explain")
  .description(
    "Explain a deesse-template.json field from its Zod schema JSDoc",
  )
  .argument("<field-path>", "dotted path into the descriptor (e.g. files[].type)")
  .action(
  (_fieldPath: string): never => {
    // The argument is parsed by Commander; we don't read it because
    // the impl is deferred. The placeholder still appears in --help.
    void _fieldPath
    throw internal(
      "deessejs template explain is not yet implemented — see ADR-034 §4",
    )
  },
)