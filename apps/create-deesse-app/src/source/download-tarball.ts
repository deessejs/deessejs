import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { networkError } from "../errors/index.js"

export type DownloadTarballArgs = {
  owner: string
  repo: string
  sha: string
}

/**
 * Download the codeload tarball for `<owner>/<repo>` at the given commit SHA.
 *
 * The URL is composed with the SHA (not `refs/heads/main`) because the SHA
 * path returns immutable bytes; the branch URL could resolve to a different
 * commit between `git ls-remote` and the fetch.
 *
 * Returns the path to a tempfile in os.tmpdir() and echoes the input SHA so
 * downstream code can carry the same value into the final result.
 */
export const downloadTarball = async (
  args: DownloadTarballArgs,
): Promise<{ path: string; sha: string }> => {
  const { owner, repo, sha } = args
  const url = `https://codeload.github.com/${owner}/${repo}/tar.gz/${sha}`

  const response = await fetch(url, { redirect: "follow" }).catch(
    (err: unknown) => {
      throw networkError(`fetch failed: ${err instanceof Error ? err.message : String(err)}`)
    },
  )

  if (!response.ok) {
    throw networkError(
      `GET ${url} returned status ${response.status} ${response.statusText}`,
    )
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const filename = `create-deesse-app-${sha.slice(0, 12)}-${randomUUID()}.tgz`
  const dir = join(tmpdir(), `create-deesse-app-${randomUUID()}`)
  await mkdir(dir, { recursive: true })
  const path = join(dir, filename)
  await writeFile(path, buffer)

  return { path, sha }
}