import { readFile, readdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const base = resolve(fileURLToPath(new URL("../src", import.meta.url)))
const now = Date.now()
const parseFields = (text) => {
  const opening = text.indexOf("---")
  const closing = opening === 0 ? text.indexOf("\n---", 3) : -1
  const block = closing === -1 ? "" : text.slice(3, closing).trim()
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
const isSkipped = (kind, field) => {
  if (kind === "posts" && field("draft") === "true") return true
  const scheduled = field("scheduled")
  return Boolean(scheduled && Date.parse(scheduled) > now)
}

const parseTags = (block) => block.match(/^tags:\s*\[([^\]]*)\]/m)?.[1]
  ?.split(",").map((tag) => tag.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean) ?? []

const parseAuthorHandles = (field) => field("authors")?.match(/[\w-]+/g)
  ?? (field("author") ? [field("author")] : [])

const createRecord = (file, kind, field, block) => {
  const slug = file.replace(/\.mdx$/, "")
  const isPost = kind === "posts"
  const handles = isPost ? parseAuthorHandles(field) : []
  return {
    title: field("title"),
    description: field("description"),
    date: field("date"),
    slug,
    url: `/${isPost ? "blog" : "changelog"}/${slug}`,
    ...(isPost ? {
      tags: parseTags(block),
      cover: field("cover"),
      author: authors.get(handles[0]),
      authors: handles.map((handle) => authors.get(handle)).filter(Boolean),
    } : {}),
    ...(kind === "releases" ? { version: field("version") } : {}),
  }
}

const readEntry = async (folder, kind, file) => {
  const text = await readFile(join(base, folder, file), "utf8")
  const { field, block } = parseFields(text)
  if (!block || isSkipped(kind, field)) return undefined
  return createRecord(file, kind, field, block)
}

const compareEntries = (kind) => (a, b) => kind === "posts"
  ? b.date.localeCompare(a.date)
  : compareVersions(b.version, a.version) || b.date.localeCompare(a.date)

const readCollection = async (folder, kind) => {
  const entries = (await readdir(join(base, folder))).filter((file) => file.endsWith(".mdx"))
  const records = await Promise.all(entries.map((file) => readEntry(folder, kind, file)))
  return records.filter(Boolean).sort(compareEntries(kind))
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
