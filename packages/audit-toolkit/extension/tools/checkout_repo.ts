import { defineTool } from "eve/tools"
import { z } from "zod"

import { getInstallationOctokit } from "../lib/octokit-app.js"

const OWNER_REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const SHA_RE = /^[0-9a-f]{7,40}$/

/**
 * Pin the repository's main commit and expand a tarball of that exact
 * commit into the current specialist's sandbox at /workspace/repo.
 *
 * Why not `git clone` from inside the sandbox? Git does not honour
 * Authorization headers; the App private key would have to land in the
 * sandbox, which violates the trust boundary (eve security-model).
 * Instead, the app runtime (which holds the installation token) downloads
 * the archive and pushes the bytes into the sandbox via the standard
 * writeBinaryFile/run proxies.
 */
export default defineTool({
  description:
    "Download the repository at the pinned commit SHA into the current " +
    "specialist's sandbox at /workspace/repo. Verifies that the SHA " +
    "still points at main before extracting. Returns the pinned SHA and " +
    "the tree SHA of the checked-out commit.",
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

    // Verify the SHA still points at the live main. If main has advanced,
    // refuse to run silently — the coordinator must re-resolve the SHA.
    const ref = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: "heads/main",
    })
    if (ref.data.object.sha !== sha) {
      throw new Error(
        `Main has advanced: pinned ${sha}, current ${ref.data.object.sha}. ` +
          `Re-run after the coordinator re-resolves the SHA.`,
      )
    }

    const commit = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: sha,
    })
    const treeSha = commit.data.tree.sha

    const archive = await octokit.rest.repos.downloadTarballArchive({
      owner,
      repo,
      ref: sha,
      request: { responseType: "arraybuffer" },
    })
    const buffer = archive.data as unknown as ArrayBuffer

    await sandbox.writeBinaryFile({
      path: "/workspace/repo.tar.gz",
      content: buffer,
    })

    const expand = await sandbox.run({
      command: [
        "set -euo pipefail",
        "rm -rf /workspace/repo",
        "mkdir -p /workspace/repo",
        "tar -xzf /workspace/repo.tar.gz -C /workspace/repo --strip-components=1",
        "rm -f /workspace/repo.tar.gz",
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