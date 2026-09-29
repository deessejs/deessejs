import { App } from "@octokit/app"
import { Octokit } from "@octokit/rest"

import { getGitHubCredentials } from "./env.js"

/**
 * The full octokit instance returned by `new Octokit()` from @octokit/rest:
 * core HTTP plus REST endpoint methods plus pagination. Use this type for
 * every function that accepts an installation octokit.
 *
 * @octokit/app's `getInstallationOctokit` is typed as returning the
 * minimal core Octokit, but the runtime object is an @octokit/rest
 * instance because @octokit/app instantiates one internally. The cast
 * below matches what runs and lets `octokit.rest.apps.*` etc. typecheck.
 */
export type InstallationOctokit = InstanceType<typeof Octokit>

let app: App | null = null

function getApp(): App {
  if (app) return app
  const creds = getGitHubCredentials()
  app = new App({
    appId: creds.appId,
    privateKey: creds.appPrivateKey.replace(/\\n/g, "\n"),
    webhooks: { secret: creds.webhookSecret },
  })
  return app
}

export function getInstallationOctokit(
  installationId: number,
): Promise<InstallationOctokit> {
  return getApp().getInstallationOctokit(
    installationId,
  ) as Promise<InstallationOctokit>
}