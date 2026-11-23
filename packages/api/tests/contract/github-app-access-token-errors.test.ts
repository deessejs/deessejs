import { beforeEach, describe, expect, it, vi } from "vitest"

const { accessTokenMock, selectMock } = vi.hoisted(() => ({
  accessTokenMock: vi.fn(),
  selectMock: vi.fn(),
}))
const { TokenError } = vi.hoisted(() => ({
  TokenError: class GitHubUserAccessTokenError extends Error {
    constructor(
      readonly code: string,
      message: string
    ) {
      super(message)
    }
  },
}))

vi.mock("@workspace/database", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@workspace/database")>()
  return { ...actual, db: { select: selectMock } }
})

vi.mock("../../src/core/github-app/user-connection.js", () => ({
  getGitHubUserAccessToken: accessTokenMock,
  GitHubUserAccessTokenError: TokenError,
}))

vi.mock("../../src/core/github-app/repositories.js", () => ({
  GitHubRepositoryRequestError: class GitHubRepositoryRequestError extends Error {
    constructor(readonly status: number) {
      super("GitHub repository request failed")
    }
  },
  listGitHubInstallationRepositories: vi.fn(),
}))

vi.mock("../../src/core/github-app/project-config.js", () => ({
  GitHubProjectConfigRequestError: class GitHubProjectConfigRequestError extends Error {
    constructor(readonly status: number) {
      super("GitHub project config request failed")
    }
  },
  inspectGitHubProjectConfig: vi.fn(),
}))

vi.mock("../../src/constants/logger.js", () => ({
  logger: { error: vi.fn() },
}))

import { call } from "@orpc/server"
import { githubAppRouter } from "../../src/orpc/routes/github-app.js"

const context = {
  headers: new Headers(),
  user: { id: "user-id" },
  session: { id: "session-id" },
  requestId: "request-id",
}

function mockOrganizationAndInstallation() {
  let queryNumber = 0
  selectMock.mockImplementation(() => {
    const rows =
      queryNumber++ === 0
        ? [{ id: "organization-id", slug: "acme", role: "owner" }]
        : [{ installationId: "123" }]
    const query = {
      from: vi.fn(),
      innerJoin: vi.fn(),
      where: vi.fn(),
      limit: vi.fn(),
    }
    query.from.mockReturnValue(query)
    query.innerJoin.mockReturnValue(query)
    query.where.mockReturnValue(query)
    query.limit.mockResolvedValue(rows)
    return query
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOrganizationAndInstallation()
})

describe("GitHub access token errors at the API boundary", () => {
  it("asks for a GitHub account only when the connection is missing or expired", async () => {
    accessTokenMock.mockRejectedValue(
      new TokenError("ACCOUNT_REQUIRED", "internal authorization details")
    )

    await expect(
      call(
        githubAppRouter.repositories.list,
        { slug: "acme", page: 1 },
        { context }
      )
    ).rejects.toMatchObject({
      code: "GITHUB_ACCOUNT_REQUIRED",
      message: "Connect or reconnect your GitHub account to list repositories.",
    })
  })

  it.each([
    ["database lookup failure", new Error("private database detail")],
    [
      "token decryption failure",
      new TokenError("TOKEN_DECRYPTION_FAILED", "ciphertext detail"),
    ],
    [
      "temporary refresh failure",
      new TokenError("TOKEN_REFRESH_FAILED", "upstream response detail"),
    ],
  ])("returns a safe retryable API error for %s", async (_label, error) => {
    accessTokenMock.mockRejectedValue(error)

    await expect(
      call(
        githubAppRouter.repositories.list,
        { slug: "acme", page: 1 },
        { context }
      )
    ).rejects.toMatchObject({
      code: "GITHUB_ACCOUNT_UNAVAILABLE",
      message: "Your GitHub connection could not be checked. Try again.",
    })
  })
})
