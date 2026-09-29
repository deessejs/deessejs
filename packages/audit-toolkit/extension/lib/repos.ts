import { z } from "zod"
import type { Octokit } from "@octokit/rest"

import { getInstallationOctokit } from "./octokit-app.js"

const RepositoryProfile = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  default_branch: z.string(),
  topics: z.array(z.string()).optional().default([]),
  language: z.string().nullable(),
})

export type RepositoryProfile = z.infer<typeof RepositoryProfile>

export async function listAuditRepositories(
  installationId: number,
): Promise<RepositoryProfile[]> {
  const octokit = await getInstallationOctokit(installationId)
  const out: RepositoryProfile[] = []
  for await (const response of octokit.paginate.iterator(
    octokit.rest.apps.listReposAccessibleToInstallation,
    { per_page: 100 },
  )) {
    for (const repo of response.data.repositories) {
      const parsed = RepositoryProfile.safeParse(repo)
      if (parsed.success) out.push(parsed.data)
    }
  }
  return out
}

export async function resolveMainSha(
  octokit: Octokit,
  owner: string,
  repo: string,
  defaultBranch: string,
): Promise<string> {
  const { data } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: defaultBranch,
  })
  return data.commit.sha
}