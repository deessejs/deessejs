import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"

const TURBO_VERSION = "2.10.4"
const TARGETS = new Set(["app", "web", "@workspace/docs", "agent"])
const GLOBAL_PATHS = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.json",
  ".npmrc",
])
const GLOBAL_PREFIXES = ["scripts/", ".github/"]

function git(args, cwd) {
  return spawnSync("/usr/bin/git", args, { cwd, encoding: "utf8" })
}

function changedFiles(base, head, cwd) {
  const result = git(["diff", "--name-only", `${base}...${head}`], cwd)
  if (result.status !== 0) throw new Error(result.stderr || "Unable to inspect changed files")
  return result.stdout.split(/\r?\n/).filter(Boolean)
}

function hasGlobalChange(files) {
  return files.some((file) => GLOBAL_PATHS.has(file) || !file.includes("/") || GLOBAL_PREFIXES.some((prefix) => file.startsWith(prefix)))
}

function queryAffected(target, base, head, cwd) {
  const result = spawnSync(path.join(path.dirname(process.execPath), "npx"), ["--yes", `turbo@${TURBO_VERSION}`, "query", "affected", "--base", base, "--head", head, "--tasks", "build", "--packages", target, "--no-update-notifier"], { cwd, encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr || `Turbo exited with ${result.status}`)
  const response = JSON.parse(result.stdout)
  const items = response?.data?.affectedTasks?.items
  if (!Array.isArray(items)) throw new Error("Turbo returned no affected task result")
  return items.some((item) => item.fullName === `${target}#build`)
}

export function shouldBuild({ target, base, head, cwd, gitCommand = git, query = queryAffected }) {
  if (!TARGETS.has(target) || !base || !head) return true
  const exists = gitCommand(["cat-file", "-e", `${base}^{commit}`], cwd)
  if (exists.status !== 0) return true
  const ancestor = gitCommand(["merge-base", "--is-ancestor", base, head], cwd)
  if (ancestor.status !== 0) return true
  let files
  try {
    files = changedFiles(base, head, cwd)
  } catch {
    return true
  }
  if (hasGlobalChange(files)) return true
  if (base === head && files.length === 0) return false
  try {
    return query(target, base, head, cwd)
  } catch {
    return true
  }
}

function main() {
  if (process.env.VERCEL_TARGET_ENV !== "production" && process.env.VERCEL_TARGET_ENV !== "staging") process.exit(0)
  const target = process.argv[2]
  const cwd = process.cwd()
  const base = process.env.VERCEL_GIT_PREVIOUS_SHA
  const head = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD"
  process.exit(shouldBuild({ target, base, head, cwd }) ? 1 : 0)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
