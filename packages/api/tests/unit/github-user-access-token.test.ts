import { beforeEach, describe, expect, it, vi } from "vitest"

const { selectMock, updateMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  updateMock: vi.fn(),
}))
const { encryptionKey } = vi.hoisted(() => ({
  encryptionKey: Buffer.alloc(32, 7).toString("base64"),
}))

vi.mock("@workspace/database", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@workspace/database")>()
  return { ...actual, db: { select: selectMock, update: updateMock } }
})

vi.mock("@workspace/env/server", () => ({
  serverEnv: {
    GITHUB_APP_TOKEN_ENCRYPTION_KEY: encryptionKey,
    GITHUB_APP_CLIENT_ID: "client-id",
    GITHUB_APP_CLIENT_SECRET: "client-secret",
  },
}))

import {
  encryptGitHubToken,
  getGitHubUserAccessToken,
} from "../../src/core/github-app/user-connection.js"

const validConnection = (overrides: Record<string, unknown> = {}) => ({
  id: "connection-id",
  userId: "user-id",
  githubUserId: "123",
  githubLogin: "octocat",
  accessTokenEncrypted: encryptGitHubToken("access-token"),
  refreshTokenEncrypted: encryptGitHubToken("refresh-token"),
  accessTokenExpiresAt: new Date(Date.now() + 60_000 * 10),
  refreshTokenExpiresAt: new Date(Date.now() + 60_000 * 60),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

function mockConnectionLookup(rows: unknown[]) {
  const query = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  }
  query.from.mockReturnValue(query)
  query.where.mockReturnValue(query)
  query.limit.mockResolvedValue(rows)
  selectMock.mockReturnValue(query)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe("getGitHubUserAccessToken failures", () => {
  it("marks a missing connection as requiring account authorization", async () => {
    mockConnectionLookup([])

    await expect(getGitHubUserAccessToken("user-id")).rejects.toMatchObject({
      name: "GitHubUserAccessTokenError",
      code: "ACCOUNT_REQUIRED",
    })
  })

  it("preserves database lookup failures for the API boundary to classify", async () => {
    const databaseFailure = new Error("database unavailable")
    const query = {
      from: vi.fn(),
      where: vi.fn(),
      limit: vi.fn().mockRejectedValue(databaseFailure),
    }
    query.from.mockReturnValue(query)
    query.where.mockReturnValue(query)
    selectMock.mockReturnValue(query)

    await expect(getGitHubUserAccessToken("user-id")).rejects.toBe(
      databaseFailure
    )
  })

  it("keeps token decryption failures separate from missing authorization", async () => {
    mockConnectionLookup([
      validConnection({ accessTokenEncrypted: "invalid-token-ciphertext" }),
    ])

    await expect(getGitHubUserAccessToken("user-id")).rejects.toMatchObject({
      name: "GitHubUserAccessTokenError",
      code: "TOKEN_DECRYPTION_FAILED",
    })
  })

  it("reports transient refresh failures without asking the user to reconnect", async () => {
    mockConnectionLookup([
      validConnection({
        accessTokenExpiresAt: new Date(Date.now() - 60_000),
      }),
    ])
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))

    await expect(getGitHubUserAccessToken("user-id")).rejects.toMatchObject({
      name: "GitHubUserAccessTokenError",
      code: "TOKEN_REFRESH_FAILED",
    })
  })
})
