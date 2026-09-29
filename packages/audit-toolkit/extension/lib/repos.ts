import { z } from "zod"

import type { InstallationOctokit } from "./octokit-app.js"
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
    // Paginate iterator yields the endpoint's `data` field directly per
    // page (see @octokit/plugin-paginate-rest). The generated response
    // type for listReposAccessibleToInstallation does not reflect that
    // in @octokit/openapi-types yet, so the local cast keeps tsc strict.
    const page = response.data as unknown as {
      repositories: ReadonlyArray<unknown>
    }
    for (const repo of page.repositories) {
      const parsed = RepositoryProfile.safeParse(repo)
      if (parsed.success) out.push(parsed.data)
    }
  }
  return out
}

export async function resolveMainSha(
  octokit: InstallationOctokit,
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