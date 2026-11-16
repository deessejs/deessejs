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
    const tags = frontmatter[1].match(/^tags:\s*\[([^\]]*)\]/m)?.[1]
      ?.split(",").map((tag) => tag.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean) ?? []
    output.push({ title: field("title"), description: field("description"), date: field("date"), url: `/${kind === "posts" ? "blog" : "changelog"}/${file.replace(/\.mdx$/, "")}`, ...(kind === "posts" ? { tags } : {}), ...(kind === "releases" ? { version: field("version") } : {}) })
  }
  output.sort((a, b) => kind === "posts"
    ? b.date.localeCompare(a.date)
    : compareVersions(b.version, a.version) || b.date.localeCompare(a.date))
  return output
}
const compareVersions = (left = "0.0.0", right = "0.0.0") => {
  const a = left.split(".").map(Number)
  const b = right.split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0)
    if (difference) return difference
  }
  return 0
}
const posts = await readCollection("posts", "posts")
const releases = await readCollection("releases", "releases")
await writeFile(join(base, "generated-feeds.ts"), `export const posts = ${JSON.stringify(posts)} as const\nexport const releases = ${JSON.stringify(releases)} as const\n`)
