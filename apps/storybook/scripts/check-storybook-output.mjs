import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const appRoot = path.dirname(fileURLToPath(import.meta.url))
const outputRoot = path.join(appRoot, "..", "storybook-static")
const componentRoot = path.join(
  appRoot,
  "..",
  "..",
  "..",
  "packages",
  "ui",
  "src",
  "components"
)

async function requireJson(filePath, description) {
  let contents
  try {
    contents = await readFile(filePath, "utf8")
  } catch {
    throw new Error(`${description} was not generated at ${filePath}.`)
  }

  try {
    return JSON.parse(contents)
  } catch {
    throw new Error(`${description} is not valid JSON.`)
  }
}

const storyIndex = await requireJson(
  path.join(outputRoot, "index.json"),
  "The Storybook story index"
)
const componentManifest = await requireJson(
  path.join(outputRoot, "manifests", "components.json"),
  "The Storybook component manifest"
)

if (!componentManifest || typeof componentManifest !== "object") {
  throw new Error("The Storybook component manifest is empty.")
}

const sourceComponents = (await readdir(componentRoot))
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => file.slice(0, -4))
  .sort()

const entries = Object.values(storyIndex.entries ?? {})
const storyImportPaths = new Set(
  entries
    .filter((entry) => entry.type === "story")
    .map((entry) => entry.importPath)
    .filter((importPath) => typeof importPath === "string")
)

const missingStories = sourceComponents.filter((component) =>
  ![...storyImportPaths].some((importPath) =>
    importPath.endsWith(`/components/${component}.stories.tsx`)
  )
)

if (missingStories.length > 0) {
  throw new Error(
    `Missing Storybook stories for shared UI components: ${missingStories.join(", ")}`
  )
}

console.log(
  `Storybook output includes a valid component manifest and stories for ${sourceComponents.length} shared UI components.`
)
