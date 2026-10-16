import type { ExecOptions, StartedTestContainer } from "testcontainers"

import type { CommandResult } from "./process.js"
import type { PackedArtifact } from "./consumer-stack.js"

/**
 * Publish the packed CLI tarball to Verdaccio. The tarball is the
 * pre-built artifact produced by packCli; we do NOT extract it
 * before publishing (that path is what broke the round-trip test in
 * the previous design).
 *
 * The consumer's .npmrc has the auth token for the e2e user
 * already; we pass the same token here so the host-side pnpm
 * publish succeeds.
 */
export const publishToVerdaccio = async (opts: {
  consumer: StartedTestContainer
  registryUrl: string
  registryToken: string
  registryUser: string
  artifact: PackedArtifact
}): Promise<CommandResult> => {
  const { consumer, registryUrl, registryToken, registryUser, artifact } =
    opts

  // We use the consumer's pnpm (already pinned) so the toolchain
  // is identical to the install path. The token is passed via
  // .npmrc-like env, with the per-registry slot key expected by
  // npm/pnpm.
  const execOpts: ExecOptions = {
    // Testcontainers v12 types ExecOptions as non-optional
    // (workingDir + user) even though Partial<> should allow
    // omission. We provide both, defaulting to "root" in the
    // consumer (which is what node:24-alpine uses as the default
    // user). cwd is irrelevant for a single-command invocation
    // but the type demands it.
    workingDir: "/tmp",
    user: "root",
    env: {
      // Force pnpm to authenticate to the local Verdaccio.
      npm_config_registry: registryUrl,
      // Per-registry auth-token slot. pnpm picks the entry whose
      // key matches the resolved registry URL.
      [`npm_config__//${registryUrl.replace(/^https?:\/\//, "")}___authToken`]:
        registryToken,
      // Belt-and-braces: also export the user, in case the
      // registry demands basic auth.
      npm_config_username: registryUser,
      npm_config_user_email: `${registryUser}@example.invalid`,
      npm_config_always_auth: "true",
    },
  }

  const result = await consumer.exec(
    [
      "sh",
      "-c",
      `pnpm publish ${artifact.path} --registry ${registryUrl} --no-git-checks`,
    ],
    execOpts,
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
