import { readFile, writeFile } from "node:fs/promises"
import { argv } from "node:process"
import { URL } from "node:url"
import { z } from "zod"
import {
  PROJECT_CONFIG_SCHEMA_URL,
  ProjectConfigV1Schema,
} from "../src/v1/project-config.ts"
import { findDifference } from "./json-difference.mjs"

const outputPath = new URL("../schema/project/v1.json", import.meta.url)
const generatedSchema = z.toJSONSchema(ProjectConfigV1Schema, {
  target: "draft-2020-12",
})
const schema = {
  ...generatedSchema,
  $id: PROJECT_CONFIG_SCHEMA_URL,
  title: "DeesseJS project configuration, format version 1",
}
const contents = JSON.stringify(schema, null, 2) + "\n"

if (argv.includes("--check")) {
  const existing = JSON.parse(await readFile(outputPath, "utf8"))
  const difference = findDifference(existing, schema)
  if (difference) {
    throw new Error(
      "The committed project configuration schema differs at " +
        difference.path +
        ": " +
        JSON.stringify(difference.expected) +
        " != " +
        JSON.stringify(difference.actual) +
        ". Run pnpm --filter @workspace/registry project-schema:generate."
    )
  }
} else {
  await writeFile(outputPath, contents)
}
