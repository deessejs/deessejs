import { readFile, writeFile } from "node:fs/promises"
import { argv } from "node:process"
import { URL } from "node:url"
import { z } from "zod"
import {
  BLOCK_DESCRIPTOR_SCHEMA_URL,
  BlockDescriptorV1Schema,
} from "../src/v1/block-descriptor.ts"

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

function findDifference(expected, actual, path = "$") {
  if (Object.is(expected, actual)) return null

  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      return { path, expected, actual }
    }
    if (expected.length !== actual.length) {
      return { path, expected: expected.length, actual: actual.length }
    }
    for (let index = 0; index < expected.length; index += 1) {
      const difference = findDifference(
        expected[index],
        actual[index],
        `${path}[${index}]`,
      )
      if (difference) return difference
    }
    return null
  }

  const expectedIsObject =
    expected !== null && typeof expected === "object"
  const actualIsObject = actual !== null && typeof actual === "object"
  if (expectedIsObject || actualIsObject) {
    if (!expectedIsObject || !actualIsObject) return { path, expected, actual }

    const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])]
      .sort()
    for (const key of keys) {
      if (!Object.hasOwn(expected, key) || !Object.hasOwn(actual, key)) {
        return {
          path: `${path}.${key}`,
          expected: expected[key],
          actual: actual[key],
        }
      }
      const difference = findDifference(
        expected[key],
        actual[key],
        `${path}.${key}`,
      )
      if (difference) return difference
    }
    return null
  }

  return { path, expected, actual }
}

if (argv.includes("--check")) {
  const existing = JSON.parse(await readFile(outputPath, "utf8"))
  const difference = findDifference(existing, schema)
  if (difference) {
    throw new Error(
      `The committed block descriptor schema differs at ${difference.path}: ${JSON.stringify(difference.expected)} != ${JSON.stringify(difference.actual)}. Run pnpm --filter @workspace/registry block-schema:generate.`,
    )
  }
} else {
  await writeFile(outputPath, contents)
}
