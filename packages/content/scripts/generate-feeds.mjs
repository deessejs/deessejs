import { readFile, readdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const base = resolve(fileURLToPath(new URL("../src", import.meta.url)))
const now = Date.now()
const readCollection = async (folder, kind) => {
  const entries = await readdir(join(base, folder))
  const output = []
  for (const file of entries.filter((name) => name.endsWith(".mdx"))) {
    const text = await readFile(join(base, folder, file), "utf8")
    const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---/)
    if (!frontmatter) continue
    const field = (key) => frontmatter[1].match(new RegExp(`^${key}:\\s*(?:["']([^"']*)["']|([^\\n#]+))`, "m"))?.slice(1).find(Boolean)?.trim()
    if (kind === "posts" && field("draft") === "true") continue
    const scheduled = field("scheduled")
    if (scheduled && Date.parse(scheduled) > now) continue
    output.push({ title: field("title"), description: field("description"), date: field("date"), url: `/${kind === "posts" ? "blog" : "changelog"}/${file.replace(/\.mdx$/, "")}`, ...(kind === "releases" ? { version: field("version") } : {}) })
  }
  return output
}
const posts = await readCollection("posts", "posts")
const releases = await readCollection("releases", "releases")
await writeFile(join(base, "generated-feeds.ts"), `export const posts = ${JSON.stringify(posts)} as const\nexport const releases = ${JSON.stringify(releases)} as const\n`)
