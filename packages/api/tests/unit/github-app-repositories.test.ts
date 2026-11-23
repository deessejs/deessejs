import { afterEach, describe, expect, it, vi } from "vitest"

import { listGitHubInstallationRepositories } from "../../src/core/github-app/repositories.js"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("listGitHubInstallationRepositories", () => {
  it("returns validated repository summaries from GitHub", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          total_count: 1,
          repositories: [
            {
              id: 12,
              name: "project",
              full_name: "octocat/project",
              private: true,
              description: "Example project",
              html_url: "https://github.com/octocat/project",
              default_branch: "main",
            },
          ],
        })
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      listGitHubInstallationRepositories({
        installationId: "123",
        accessToken: "access-token",
        page: 1,
      })
    ).resolves.toEqual({
      totalCount: 1,
      page: 1,
      perPage: 30,
      repositories: [
        {
          id: 12,
          name: "project",
          fullName: "octocat/project",
          isPrivate: true,
          description: "Example project",
          htmlUrl: "https://github.com/octocat/project",
          defaultBranch: "main",
        },
      ],
    })
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it("maps upstream response failures to the HTTP status without its body", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"message":"private upstream detail"}', {
            status: 403,
          })
        )
    )

    await expect(
      listGitHubInstallationRepositories({
        installationId: "123",
        accessToken: "access-token",
        page: 1,
      })
    ).rejects.toMatchObject({
      name: "GitHubRepositoryRequestError",
      status: 403,
    })
  })
})
