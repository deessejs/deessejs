import { App } from "@octokit/app"
import { Octokit } from "@octokit/rest"

import { getGitHubCredentials } from "./env.js"

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
): Promise<Octokit> {
  return getApp().getInstallationOctokit(installationId)
}