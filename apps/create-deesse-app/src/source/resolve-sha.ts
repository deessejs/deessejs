import { execFile } from "node:child_process"

import { gitNotInstalled, sourceFailed } from "../errors/index.js"

const SHA_REGEX = /^[0-9a-f]{40}$/

export type ResolveTemplateShaArgs = {
  owner: string
  repo: string
  ref: string
}

// `git ls-remote` prints one line per ref: "<sha>\t<ref>\n". We query
// exactly one ref (`refs/heads/<ref>`) and parse the first matching
// non-empty line. The format is documented and stable across git
// versions, so a single line split is enough — no library required.
const parseLsRemoteFirstLine = (stdout: string): string | null => {
  for (const line of stdout.split("\n")) {
    if (line.trim().length === 0) continue
    const [sha] = line.split("\t")
    return sha ?? null
  }
  return null
}

const execFileP = (cmd: string, args: string[]): Promise<string> =>
  new Promise<string>((resolveFn, rejectFn) => {
    // execFile resolves the command via PATH, which is the documented
    // behaviour we rely on. We pass shell:false so no shell interpolation
    // of args can occur.
    execFile(cmd, args, { shell: false, windowsHide: true }, (err, out) => {
      if (err) rejectFn(err)
      else resolveFn(out)
    })
  })

/**
 * Resolve the current commit SHA for `<owner>/<repo>#<ref>` via `git ls-remote`.
 * The returned SHA is what will be used to fetch the tarball — by downloading
 * `/tar.gz/<sha>`, the URL is immutable and the archive bytes match the SHA
 * reported in the JSON result.
 */
export const resolveTemplateSha = async (
  args: ResolveTemplateShaArgs,
): Promise<string> => {
  const { owner, repo, ref } = args
  const url = `https://github.com/${owner}/${repo}`

  const stdout = await execFileP("git", ["ls-remote", url, ref])

  const sha = parseLsRemoteFirstLine(stdout)
  if (sha === null) {
    // Probe git presence to give a useful error.
    try {
      await execFileP("git", ["--version"])
    } catch {
      throw gitNotInstalled()
    }
    throw sourceFailed(
      `git ls-remote returned no lines for ${url} ${ref}`,
    )
  }

  if (!SHA_REGEX.test(sha)) {
    throw sourceFailed(
      `git ls-remote returned a malformed SHA for ${url} ${ref}: ${sha}`,
    )
  }
  return sha
}
