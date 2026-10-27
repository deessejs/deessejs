import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { ExecOptions, StartedTestContainer } from "testcontainers"

import type { CommandResult } from "./process.js"
import type { PackedArtifact } from "./consumer-stack.js"

/**
 * Publish the packed CLI tarball to Verdaccio.
 *
 * The flow is:
 *   1. Copy the host-built tarball into the consumer container
 *      (host paths are not visible inside the container).
 *   2. cd into the consumer's installDir where the .npmrc is
 *      already configured with the auth token.
 *   3. Run `pnpm publish <file>` from that directory; pnpm picks
 *      up the auth token from .npmrc automatically.
 *
 * No env-based auth overrides: the per-registry auth-token slot
 * is set up by startConsumerForStack() in .npmrc, and publishing
 * from inside the installDir lets pnpm read it.
 */
export const publishToVerdaccio = async (opts: {
  consumer: StartedTestContainer
  installDir: string
  registryUrl: string
  artifact: PackedArtifact
}): Promise<CommandResult> => {
  const { consumer, installDir, registryUrl, artifact } = opts

  // Copy the host-built tarball into the consumer's installDir
  // so pnpm publish sees a real file path.
  const archiveBytes = readFileSync(artifact.path)
  const archiveName = artifact.path.split(/[/\\]/).pop() ?? "cda.tgz"
  const containerArchivePath = join(installDir, archiveName)
  await consumer.copyContentToContainer([
    { content: archiveBytes, target: containerArchivePath },
  ])

  const execOpts: ExecOptions = {
    // Testcontainers v12 types ExecOptions with non-optional
    // workingDir + user. We provide both; the user is the
    // consumer's default (root) and workingDir is the install
    // directory where .npmrc is configured.
    workingDir: installDir,
    user: "root",
    env: {},
  }

  const result = await consumer.exec(
    [
      "sh",
      "-c",
      `pnpm publish ${containerArchivePath} --registry ${registryUrl} --no-git-checks`,
    ],
    execOpts
  )
  return {
    exitCode: result.exitCode,
    signal: null,
    stdout: result.output,
    stderr: "",
    durationMs: 0,
    startedAt: new Date().toISOString(),
    exitedAt: new Date().toISOString(),
  }
}
