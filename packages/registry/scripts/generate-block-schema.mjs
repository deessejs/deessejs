import { readFile, writeFile } from "node:fs/promises"
import { argv } from "node:process"
import { URL } from "node:url"
import { z } from "zod"
import {
  BLOCK_DESCRIPTOR_SCHEMA_URL,
  BlockDescriptorV1Schema,
} from "../src/v1/block-descriptor.ts"
import { findDifference } from "./json-difference.mjs"

const outputPath = new URL("../schema/block/v1.json", import.meta.url)
const generatedSchema = z.toJSONSchema(BlockDescriptorV1Schema, {
  target: "draft-2020-12",
})
const schema = {
  ...generatedSchema,
  $id: BLOCK_DESCRIPTOR_SCHEMA_URL,
  title: "DeesseJS block descriptor, format version 1",
}
const contents = `${JSON.stringify(schema, null, 2)}\n`

if (argv.includes("--check")) {
  const existing = JSON.parse(await readFile(outputPath, "utf8"))
  const difference = findDifference(existing, schema)
  if (difference) {
    throw new Error(
      `The committed block descriptor schema differs at ${difference.path}: ${JSON.stringify(difference.expected)} != ${JSON.stringify(difference.actual)}. Run pnpm --filter @workspace/registry block-schema:generate.`
    )
  }
} else {
  await writeFile(outputPath, contents)
}
