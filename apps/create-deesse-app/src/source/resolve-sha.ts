import { execFile } from "node:child_process"

import { spawn } from "../utils/spawn.js"
import { gitNotInstalled, sourceFailed } from "../errors/index.js"

const SHA_REGEX = /^[0-9a-f]{40}$/

export type ResolveTemplateShaArgs = {
  owner: string
  repo: string
  ref: string
}

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

  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      // We deliberately let execFile look up `git` on PATH rather than
      // pinning an absolute path (git installs vary per platform). False
      // positive for sonarjs/no-os-command-from-path.
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      "git",
      ["ls-remote", url, ref],
      { shell: false, windowsHide: true },
      (err, out) => {
        if (err) reject(err)
        else resolve(out)
      },
    )
  })

  // First matching line: "<sha>\t<ref>". The ref column is informational; we
  // validate only the SHA.
  const firstLine = stdout.split("\n").find((line) => line.trim().length > 0)
  if (!firstLine) {
    // Probe git presence to give a useful error.
    const probe = await spawn("git", ["--version"], {
      stdio: "ignore",
      reject: false,
    })
    if (probe !== 0) throw gitNotInstalled()
    throw sourceFailed(
      `git ls-remote returned no lines for ${url} ${ref}`,
    )
  }

  const sha = firstLine.split(/\s+/)[0] ?? ""
  if (!SHA_REGEX.test(sha)) {
    throw sourceFailed(
      `git ls-remote returned a malformed SHA for ${url} ${ref}: ${sha}`,
    )
  }
  return sha
}