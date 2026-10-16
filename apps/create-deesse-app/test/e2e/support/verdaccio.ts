import { readFileSync } from "node:fs"

import type { StartedTestContainer } from "testcontainers"

import type { CommandResult } from "./process.js"
import type { PackedArtifact } from "./consumer-stack.js"

const commandResultFromExec = (
  exitCode: number,
  output: string,
  startedAt: string,
  exitedAt: string,
): CommandResult => ({
  exitCode,
  signal: null,
  stdout: output,
  stderr: "",
  durationMs: 0,
  startedAt,
  exitedAt,
})

/**
 * Publish a packed CLI artifact to a running Verdaccio instance.
 * Runs entirely inside the consumer container so the registry URL
 * matches the network alias (`http://registry:4873`).
 *
 * The artifact is copied in, extracted, and `pnpm publish` runs
 * against the local Verdaccio URL. The consumer's pnpm is pinned
 * to 11.0.0 by the consumer-stack helper.
 *
 * The default Verdaccio image accepts anonymous publishes. If a
 * private registry is later wired in, an auth token would be set
 * via the per-registry `//registry:4873/:_authToken` env var.
 */
export const publishToVerdaccio = async (opts: {
  consumer: StartedTestContainer
  /** Verdaccio URL from inside the consumer network, e.g.
   *  http://registry:4873. */
  registryUrl: string
  artifact: PackedArtifact
}): Promise<CommandResult> => {
  const { consumer, registryUrl, artifact } = opts
  const archiveName = artifact.path.split(/[/\\]/).pop() ?? "cda.tgz"
  const startedAt = new Date().toISOString()

  // Copy the tarball into the consumer.
  await consumer.copyContentToContainer([
    { content: readFileSync(artifact.path), target: `/tmp/${archiveName}` },
  ])

  // Extract the tarball into a staging dir, then run pnpm publish
  // from there. `--no-git-checks` skips the git-tag requirement
  // (this is a test publish, not a release).
  const result = await consumer.exec([
    "sh",
    "-c",
    [
      "set -e",
      "mkdir -p /tmp/publish-staging",
      "cd /tmp/publish-staging",
      `tar -xzf /tmp/${archiveName}`,
      `pnpm publish --registry ${registryUrl} --no-git-checks`,
    ].join(" && "),
  ])
  const exitedAt = new Date().toISOString()
  return commandResultFromExec(
    result.exitCode,
    result.output,
    startedAt,
    exitedAt,
  )
}
