import { defineTool } from "eve/tools"
import { z } from "zod"

import { getInstallationOctokit } from "../lib/octokit-app.js"

const OWNER_REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const SHA_RE = /^[0-9a-f]{7,40}$/

/**
 * Pin the repository at a specific commit SHA and expand a tarball of
 * that exact commit into the current specialist's sandbox at
 * /workspace/repo.
 *
 * Why not `git clone` from inside the sandbox? Git does not honour
 * Authorization headers; the App private key would have to land in the
 * sandbox, which violates the trust boundary (eve security-model).
 * Instead, the app runtime (which holds the installation token) downloads
 * the archive and pushes the bytes into the sandbox via the standard
 * writeBinaryFile/run proxies.
 *
 * Why we no longer fail when main has advanced: the pinned SHA is the
 * audit contract. Whether main has moved past it is irrelevant — the
 * audit reviews the commit that the coordinator chose. A new commit on
 * main produces a new SHA at the next schedule fire.
 */
export default defineTool({
  description:
    "Download the repository at the pinned commit SHA into the current " +
    "specialist's sandbox at /workspace/repo. Returns the pinned SHA and " +
    "the tree SHA of the checked-out commit. Does NOT verify that the SHA " +
    "is still reachable from main — the SHA is the audit contract.",
  inputSchema: z.object({
    installationId: z.number().int().positive(),
    repository: z.string().regex(OWNER_REPO_RE),
    sha: z.string().regex(SHA_RE),
  }),
  async execute({ installationId, repository, sha }, ctx) {
    const sandbox = await ctx.getSandbox()
    const [owner, repo] = repository.split("/")
    if (!owner || !repo) throw new Error("repository must be owner/name")

    const octokit = await getInstallationOctokit(installationId)

    const commit = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: sha,
    })
    const treeSha = commit.data.tree.sha

    // Octokit returns the tarball as a string-encoded URL by default.
    // Request the raw bytes by switching the media type to raw. This
    // surfaces a Buffer in `data`, which we forward to the sandbox's
    // writeBinaryFile. We do NOT rely on ArrayBuffer — the Octokit type
    // union accepts both, and the sandbox runtime expects bytes, not a
    // URL string.
    const response = await octokit.rest.repos.downloadTarballArchive({
      owner,
      repo,
      ref: sha,
      mediaType: { format: "raw" },
    })
    const raw = response.data
    if (typeof raw === "string") {
      throw new Error(
        "Octokit returned a string where raw bytes were expected. The " +
          "mediaType negotiation did not switch the response to a raw " +
          "tarball; refusing to write non-bytes into the sandbox.",
      )
    }

    // Convert whatever shape Buffer/ArrayBuffer/Uint8Array the response
    // is into a Uint8Array — the only shape the sandbox reliably accepts.
    let bytes: Uint8Array
    if (raw instanceof Uint8Array) {
      bytes = raw
    } else if (ArrayBuffer.isView(raw)) {
      bytes = new Uint8Array(
        raw.buffer,
        raw.byteOffset,
        raw.byteLength,
      )
    } else if (raw instanceof ArrayBuffer) {
      bytes = new Uint8Array(raw)
    } else {
      throw new Error(
        `Unexpected Octokit tarball response type: ${typeof raw}. ` +
          `Expected Buffer or ArrayBuffer.`,
      )
    }

    // Stage as base64 to survive any sandbox-side string handling, then
    // decode inside the sandbox to keep the on-wire format minimal.
    const base64 = bytes.toString("base64")
    await sandbox.writeTextFile({
      path: "/workspace/repo.tar.gz.b64",
      content: base64,
    })

    const expand = await sandbox.run({
      command: [
        "set -euo pipefail",
        "rm -rf /workspace/repo",
        "mkdir -p /workspace/repo",
        "base64 -d /workspace/repo.tar.gz.b64 > /workspace/repo.tar.gz",
        "tar -xzf /workspace/repo.tar.gz -C /workspace/repo --strip-components=1",
        "rm -f /workspace/repo.tar.gz /workspace/repo.tar.gz.b64",
      ].join("\n"),
    })
    if (expand.exitCode !== 0) {
      throw new Error(
        `tar expansion failed (exit ${expand.exitCode}): ${expand.stderr || expand.stdout}`,
      )
    }

    await sandbox.writeTextFile({
      path: "/workspace/.audit-coordinates",
      content: JSON.stringify(
        {
          repository,
          pinnedSha: sha,
          treeSha,
          fetchedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    })

    return { path: "/workspace/repo", pinnedSha: sha, treeSha }
  },
})