import { readFile, writeFile } from "node:fs/promises"
import { z } from "zod"
import {
  TEMPLATE_DESCRIPTOR_SCHEMA_URL,
  TemplateDescriptorV1Schema,
} from "../src/v1/template-descriptor.ts"

const outputPath = new URL("../schema/template/v1.json", import.meta.url)
const generatedSchema = z.toJSONSchema(TemplateDescriptorV1Schema, {
  target: "draft-2020-12",
})
const schema = {
  ...generatedSchema,
  $id: TEMPLATE_DESCRIPTOR_SCHEMA_URL,
  title: "DeesseJS template descriptor, format version 1",
}
const contents = `${JSON.stringify(schema, null, 2)}\n`

if (process.argv.includes("--check")) {
  const existing = await readFile(outputPath, "utf8")
  if (existing !== contents) {
    throw new Error(
      "The committed template descriptor schema is out of date. Run pnpm --filter @workspace/registry schema:generate.",
    )
  }
} else {
  await writeFile(outputPath, contents)
}
