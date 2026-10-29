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
  decryptGitHubToken,
  encryptGitHubToken,
  exchangeGitHubAuthorizationCode,
  fetchGitHubUser,
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

describe("successful GitHub App requests", () => {
  it("exchanges an OAuth code and validates the bounded token response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ access_token: "new-access-token" }),
          { status: 200 }
        )
      )
    )

    await expect(
      exchangeGitHubAuthorizationCode({
        code: "oauth-code",
        codeVerifier: "pkce-verifier",
        redirectUri: "https://app.example.test/callback",
      })
    ).resolves.toEqual({ access_token: "new-access-token" })
  })

  it("fetches and validates the connected GitHub profile", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ id: 123, login: "octocat" }))
        )
    )

    await expect(fetchGitHubUser("access-token")).resolves.toEqual({
      id: 123,
      login: "octocat",
    })
  })

  it("refreshes an expired access token and persists the new credentials", async () => {
    mockConnectionLookup([
      validConnection({
        accessTokenExpiresAt: new Date(Date.now() - 60_000),
      }),
    ])
    const updateQuery = {
      set: vi.fn(),
      where: vi.fn().mockResolvedValue([]),
    }
    updateQuery.set.mockReturnValue(updateQuery)
    updateMock.mockReturnValue(updateQuery)
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ access_token: "refreshed-access-token" })
          )
        )
    )

    await expect(getGitHubUserAccessToken("user-id")).resolves.toBe(
      "refreshed-access-token"
    )
    const persisted = updateQuery.set.mock.calls[0]?.[0]
    expect(persisted?.accessTokenEncrypted).toBeDefined()
    if (!persisted?.accessTokenEncrypted) {
      throw new Error("Expected the refreshed token to be persisted")
    }
    expect(decryptGitHubToken(persisted.accessTokenEncrypted)).toBe(
      "refreshed-access-token"
    )
  })
})
