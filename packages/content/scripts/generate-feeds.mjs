import { readFile, readdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const base = resolve(fileURLToPath(new URL("../src", import.meta.url)))
const now = Date.now()
const parseFields = (text) => {
  const block = text.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ""
  const field = (key) => block.match(new RegExp(`^${key}:\\s*(?:["']([^"']*)["']|([^\\n#]+))`, "m"))?.slice(1).find(Boolean)?.trim()
  return { field, block }
}
const authors = new Map()
for (const file of await readdir(join(base, "authors")).catch(() => [])) {
  if (!file.endsWith(".md")) continue
  const { field } = parseFields(await readFile(join(base, "authors", file), "utf8"))
  const handle = field("handle")
  if (handle) authors.set(handle, { handle, name: field("name"), role: field("role"), avatar: field("avatar"), bio: field("bio") })
}
const readCollection = async (folder, kind) => {
  const entries = await readdir(join(base, folder))
  const output = []
  for (const file of entries.filter((name) => name.endsWith(".mdx"))) {
    const text = await readFile(join(base, folder, file), "utf8")
    const { field, block } = parseFields(text)
    if (!block) continue
    if (kind === "posts" && field("draft") === "true") continue
    const scheduled = field("scheduled")
    if (scheduled && Date.parse(scheduled) > now) continue
    const tags = block.match(/^tags:\s*\[([^\]]*)\]/m)?.[1]
      ?.split(",").map((tag) => tag.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean) ?? []
    const slug = file.replace(/\.mdx$/, "")
    const handles = field("authors")?.match(/[\w-]+/g) ?? (field("author") ? [field("author")] : [])
    output.push({ title: field("title"), description: field("description"), date: field("date"), slug, url: `/${kind === "posts" ? "blog" : "changelog"}/${slug}`, ...(kind === "posts" ? { tags, cover: field("cover"), author: authors.get(handles[0]), authors: handles.map((handle) => authors.get(handle)).filter(Boolean) } : {}), ...(kind === "releases" ? { version: field("version") } : {}) })
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
