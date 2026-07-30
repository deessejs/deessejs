import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

export type GitFixture = {
  remoteUrl: string
  local: string
  cleanup: () => void
}

export type CreateGitFixtureOpts = {
  name: string
  defaultBranch?: "main" | "master"
  files?: Record<string, string>
}

const git = (args: string[], cwd: string): void => {
  execFileSync("git", args, { cwd, stdio: "pipe" })
}

export const createGitFixture = async (
  opts: CreateGitFixtureOpts,
): Promise<GitFixture> => {
  const { name, defaultBranch = "master", files = {} } = opts
  const dir = mkdtempSync(join(tmpdir(), `deessejs-${name}-`))
  const remote = join(dir, "remote.git")
  const local = join(dir, "local")

  git(["init", "--bare"], remote)
  git(["symbolic-ref", "HEAD", `refs/heads/${defaultBranch}`], remote)
  git(["clone", remote, local], dir)
  git(["config", "user.email", "test@test.test"], local)
  git(["config", "user.name", "test"], local)

  for (const [path, content] of Object.entries(files)) {
    writeFileSync(join(local, path), content)
  }

  git(["add", "-A"], local)
  git(["commit", "-m", "initial"], local)
  git(["push", "-u", "origin", defaultBranch], local)

  return {
    remoteUrl: pathToFileURL(remote).href,
    local,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  }
}
