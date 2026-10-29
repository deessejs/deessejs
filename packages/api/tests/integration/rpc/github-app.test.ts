/**
 * @testClass integration
 *
 * Exercises the real Hono and oRPC API with narrow session and database
 * fixtures. All GitHub requests are mocked and fail closed by default.
 */
import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { fakeState, getSessionMock, accessTokenMock, loggerErrorMock } = vi.hoisted(() => ({
  fakeState: {
    sessions: new Map<string, string>(),
    memberships: [] as Array<{
      userId: string
      organizationId: string
      slug: string
      role: string
    }>,
    installations: [] as Array<Record<string, unknown>>,
    projects: new Map<string, Record<string, unknown>>(),
    checks: [] as Array<Record<string, unknown>>,
  },
  getSessionMock: vi.fn(),
  accessTokenMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}))

vi.mock("@workspace/auth", () => ({
  auth: {
    api: { getSession: getSessionMock },
    handler: vi.fn(async () => new Response("Not found", { status: 404 })),
  },
}))

vi.mock("@workspace/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/database")>()
  const tables = {
    member: actual.member,
    githubAppInstallation: actual.githubAppInstallation,
    githubProject: actual.githubProject,
    githubProjectCheck: actual.githubProjectCheck,
  }
  const rowsFor = (table: unknown): Array<Record<string, unknown>> => {
    if (table === tables.member) {
      return fakeState.memberships.map((membership) => ({
        id: membership.organizationId,
        slug: membership.slug,
        role: membership.role,
      }))
    }
    if (table === tables.githubAppInstallation) return fakeState.installations
    if (table === tables.githubProject) {
      return Array.from(fakeState.projects.values())
    }
    if (table === tables.githubProjectCheck) return fakeState.checks
    return []
  }

  const database = {
    select: () => {
      let table: unknown
      const query = {
        from(value: unknown) {
          table = value
          return query
        },
        innerJoin() {
          return query
        },
        where() {
          return query
        },
        limit(count: number) {
          return Promise.resolve(rowsFor(table).slice(0, count))
        },
        orderBy() {
          return Promise.resolve(rowsFor(table))
        },
      }
      return query
    },
    insert: (table: unknown) => {
      let values: Record<string, unknown> | null = null
      const execute = async (): Promise<Array<Record<string, unknown>>> => {
        if (!values) return []
        if (table === tables.githubProject) {
          const key = [
            values.organizationId,
            values.repositoryId,
            values.configurationPath,
          ].join(":")
          if (fakeState.projects.has(key)) return []
          fakeState.projects.set(key, values)
          return [{ id: values.id }]
        }
        if (table === tables.githubProjectCheck) fakeState.checks.push(values)
        if (table === tables.githubAppInstallation) {
          fakeState.installations.push(values)
        }
        return []
      }
      const insertQuery = {
        values(value: Record<string, unknown>) {
          values = value
          return insertQuery
        },
        onConflictDoNothing() {
          return insertQuery
        },
        onConflictDoUpdate() {
          return insertQuery
        },
        returning() {
          return execute()
        },
        then(
          resolve: (value: Array<Record<string, unknown>>) => unknown,
          reject: (reason: unknown) => unknown
        ) {
          return execute().then(resolve, reject)
        },
      }
      return insertQuery
    },
    transaction: async <T>(
      callback: (transaction: typeof database) => Promise<T>
    ) => callback(database),
  }

  return { ...actual, db: database }
})

vi.mock("../../../src/core/github-app/user-connection.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/core/github-app/user-connection.js")>()
  return { ...actual, getGitHubUserAccessToken: accessTokenMock }
})

vi.mock("../../../src/constants/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: loggerErrorMock,
  },
}))

import {
  createGitHubInstallState,
  signGitHubInstallState,
} from "../../../src/core/github-app/install-state.js"
import {
  createGitHubOAuthState,
  signGitHubOAuthState,
} from "../../../src/core/github-app/oauth-state.js"
import { api } from "../../../src/index.js"

const TEST_ORIGIN = "https://app.deessejs.com"
const SESSION_COOKIE_NAME = "better-auth.session_token"
const OAUTH_STATE_COOKIE_NAME = "deesse_github_app_oauth"
const INSTALL_STATE_COOKIE_NAME = "deesse_github_app_install"
const INSTALLATION_ID = "123456"
const REPOSITORY_ID = 9876
const VALID_SHA = "a".repeat(40)
const CHANGED_SHA = "b".repeat(40)

let counter = 0
const uniqueId = (prefix: string): string =>
  `${prefix}-${randomUUID().slice(0, 8)}-${counter++}`

beforeEach(() => {
  accessTokenMock.mockResolvedValue("test-github-access-token")
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Unexpected external request"))
  )
  getSessionMock.mockImplementation(
    async ({ headers }: { headers: Headers }) => {
      const cookie = headers.get("cookie") ?? ""
      const token = cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
        ?.slice(SESSION_COOKIE_NAME.length + 1)
      const userId = token ? fakeState.sessions.get(token) : undefined
      return userId
        ? { user: { id: userId }, session: { id: `session-${userId}` } }
        : null
    }
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  accessTokenMock.mockReset()
  getSessionMock.mockReset()
  loggerErrorMock.mockReset()
  fakeState.sessions.clear()
  fakeState.memberships = []
  fakeState.installations = []
  fakeState.projects.clear()
  fakeState.checks = []
})

type Actor = { id: string; cookie: string }
type Workspace = { id: string; slug: string }

const createActor = (): Actor => {
  const id = uniqueId("github-user")
  fakeState.sessions.set(id, id)
  return { id, cookie: `${SESSION_COOKIE_NAME}=${id}` }
}

const createWorkspace = (actor: Actor, role = "owner"): Workspace => {
  const id = uniqueId("organization")
  const slug = uniqueId("github-projects")
  fakeState.memberships.push({ userId: actor.id, organizationId: id, slug, role })
  return { id, slug }
}

const addInstallation = (workspace: Workspace, actor: Actor): void => {
  fakeState.installations.push({
    id: uniqueId("installation-link"),
    organizationId: workspace.id,
    installationId: INSTALLATION_ID,
    accountId: "1234",
    accountLogin: "octo-org",
    accountType: "Organization",
    linkedByUserId: actor.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

type RepositoryResponse = {
  total_count: number
  repositories: Array<{
    id: number
    name: string
    full_name: string
    private: boolean
    description: string | null
    html_url: string
    default_branch: string | null
  }>
}

type GitHubFixtureOptions = {
  repositoryStatus?: number
  repositoryPayload?: unknown
  installationPayload?: unknown
  branchSha?: string
  configuration?: string | null
}

const repositoryPayload: RepositoryResponse = {
  total_count: 1,
  repositories: [
    {
      id: REPOSITORY_ID,
      name: "project",
      full_name: "octo-org/project",
      private: true,
      description: "Private test project",
      html_url: "https://github.com/octo-org/project",
      default_branch: "main",
    },
  ],
}

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  })

const configContentResponse = (configuration: string): Response => {
  const bytes = Buffer.from(configuration, "utf8")
  return jsonResponse({
    type: "file",
    path: "deesse.json",
    encoding: "base64",
    size: bytes.byteLength,
    content: bytes.toString("base64"),
  })
}

/** Fails closed so an unexpected request cannot reach the network. */
const mockGitHub = (options: GitHubFixtureOptions = {}) => {
  const requests: string[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    requests.push(url.toString())

    if (url.pathname === `/user/installations/${INSTALLATION_ID}/repositories`) {
      return jsonResponse(
        options.repositoryPayload ?? repositoryPayload,
        options.repositoryStatus ?? 200
      )
    }
    if (url.pathname === "/user/installations") {
      return jsonResponse(
        options.installationPayload ?? { total_count: 0, installations: [] }
      )
    }
    if (url.pathname === "/repos/octo-org/project/branches/main") {
      return jsonResponse({ commit: { sha: options.branchSha ?? VALID_SHA } })
    }
    if (url.pathname === "/repos/octo-org/project/contents/deesse.json") {
      if (options.configuration === null) {
        return jsonResponse({ message: "Not Found" }, 404)
      }
      return configContentResponse(
        options.configuration ?? JSON.stringify({ formatVersion: 1 })
      )
    }
    throw new Error(`Unexpected GitHub request: ${url.pathname}`)
  })
  vi.stubGlobal("fetch", fetchMock)
  return { requests, fetchMock }
}

const rpc = async (
  path: string[],
  data: unknown,
  cookie?: string
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const response = await api.request(`/api/v1/rpc/${path.join("/")}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ json: data }),
  })
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  }
}

const errorOf = (body: Record<string, unknown>) =>
  body.json as { code: string; status: number; message: string }

const importProject = (
  workspace: Workspace,
  actor: Actor,
  expectedCommitSha = VALID_SHA
) =>
  rpc(
    ["githubApp", "repositories", "import"],
    {
      slug: workspace.slug,
      repositoryId: REPOSITORY_ID,
      page: 1,
      expectedCommitSha,
    },
    actor.cookie
  )

const cookieWith = (cookieName: string, value: string, sessionValue: string) =>
  `${cookieName}=${encodeURIComponent(value)}; ${sessionValue}`

const oauthCallback = (
  state: string,
  cookieValue: string,
  actorCookie: string
): Promise<Response> =>
  api.request(
    `/api/v1/github-app/oauth/callback?state=${encodeURIComponent(state)}&code=test-code`,
    {
      headers: {
        cookie: cookieWith(OAUTH_STATE_COOKIE_NAME, cookieValue, actorCookie),
        origin: TEST_ORIGIN,
      },
    }
  )

describe("GitHub App API integration", () => {
  it("rejects anonymous and non-manager organization members before import", async () => {
    const actor = createActor()
    const workspace = createWorkspace(actor, "member")
    addInstallation(workspace, actor)

    const anonymous = await rpc(
      ["githubApp", "repositories", "import"],
      {
        slug: workspace.slug,
        repositoryId: REPOSITORY_ID,
        page: 1,
        expectedCommitSha: VALID_SHA,
      }
    )
    expect(anonymous.status).toBe(401)

    const memberRequest = await importProject(workspace, actor)
    expect(memberRequest.status).toBe(403)
    expect(errorOf(memberRequest.body).code).toBe("ORGANIZATION_ACCESS_DENIED")
    expect(accessTokenMock).not.toHaveBeenCalled()
  })

  it.each([
    ["invalid signature", "not-a-signed-state", "state-value"],
    ["mismatched query", null, "different-state"],
  ])("rejects OAuth callback state: %s", async (_label, supplied, query) => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    const state = createGitHubOAuthState({
      organizationId: workspace.id,
      userId: actor.id,
    })
    const signed = supplied ?? signGitHubOAuthState(state)
    const response = await oauthCallback(query, signed, actor.cookie)

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toContain("githubApp=error")
    expect(accessTokenMock).not.toHaveBeenCalled()
  })

  it("rejects expired OAuth state", async () => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    const state = createGitHubOAuthState({
      organizationId: workspace.id,
      userId: actor.id,
    })
    const expired = signGitHubOAuthState({
      ...state,
      expiresAt: Math.floor(Date.now() / 1000) - 1,
    })
    const response = await oauthCallback(state.state, expired, actor.cookie)

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toContain("githubApp=error")
  })

  it("rejects OAuth state initiated by a different signed-in user", async () => {
    const owner = createActor()
    const workspace = createWorkspace(owner)
    const otherActor = createActor()
    const state = createGitHubOAuthState({
      organizationId: workspace.id,
      userId: owner.id,
    })
    const response = await oauthCallback(
      state.state,
      signGitHubOAuthState(state),
      otherActor.cookie
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toContain(
      "githubApp=reauthenticate"
    )
  })

  it("does not associate an installation the user cannot access", async () => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    const state = createGitHubInstallState({
      organizationId: workspace.id,
      userId: actor.id,
    })
    const fixture = mockGitHub({
      installationPayload: { total_count: 0, installations: [] },
    })
    const response = await api.request(
      `/api/v1/github-app/setup?installation_id=${INSTALLATION_ID}&setup_action=install&state=${encodeURIComponent(state.state)}`,
      {
        headers: {
          cookie: cookieWith(
            INSTALL_STATE_COOKIE_NAME,
            signGitHubInstallState(state),
            actor.cookie
          ),
          origin: TEST_ORIGIN,
        },
      }
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toContain(
      "githubApp=installationNotAccessible"
    )
    expect(fixture.requests).toHaveLength(1)
    expect(fakeState.installations).toHaveLength(0)
  })

  it.each([
    ["missing", null, "GITHUB_PROJECT_CONFIG_NOT_VALID"],
    ["invalid JSON", "{", "GITHUB_PROJECT_CONFIG_NOT_VALID"],
  ])("returns a stable public error for %s configuration", async (_label, configuration, code) => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    addInstallation(workspace, actor)
    mockGitHub({ configuration })

    const response = await importProject(workspace, actor)
    expect(response.status).toBe(409)
    expect(errorOf(response.body).code).toBe(code)
    expect(JSON.stringify(response.body)).not.toContain("Private test project")
  })

  it("rejects a changed default-branch commit before importing", async () => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    addInstallation(workspace, actor)
    const fixture = mockGitHub({ branchSha: CHANGED_SHA })

    const response = await importProject(workspace, actor, VALID_SHA)
    expect(response.status).toBe(409)
    expect(errorOf(response.body).code).toBe("GITHUB_PROJECT_CONFIG_CHANGED")
    expect(fixture.requests).toHaveLength(3)
    expect(fakeState.projects.size).toBe(0)
  })

  it("maps GitHub outages to a safe retryable API error", async () => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    addInstallation(workspace, actor)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private transport detail"))
    )

    const response = await importProject(workspace, actor)
    expect(response.status).toBe(502)
    expect(errorOf(response.body).code).toBe("GITHUB_REPOSITORIES_UNAVAILABLE")
    expect(JSON.stringify(response.body)).not.toContain("private transport detail")
  })

  it("does not present a token refresh failure as a successful import", async () => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    addInstallation(workspace, actor)
    accessTokenMock.mockRejectedValueOnce(
      new Error("private refresh response")
    )

    const response = await importProject(workspace, actor)
    expect(response.status).toBe(409)
    expect(errorOf(response.body).code).toBe("GITHUB_ACCOUNT_REQUIRED")
    expect(JSON.stringify(response.body)).not.toContain("private refresh response")
  })

  it("imports valid configuration once under concurrent retries", async () => {
    const actor = createActor()
    const workspace = createWorkspace(actor)
    addInstallation(workspace, actor)
    const fixture = mockGitHub()

    const [first, second] = await Promise.all([
      importProject(workspace, actor),
      importProject(workspace, actor),
    ])

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    const firstResult = first.body.json as {
      projectId: string
      alreadyImported: boolean
    }
    const secondResult = second.body.json as {
      projectId: string
      alreadyImported: boolean
    }
    expect(firstResult.projectId).toBe(secondResult.projectId)
    expect([firstResult.alreadyImported, secondResult.alreadyImported]).toContain(false)
    expect([firstResult.alreadyImported, secondResult.alreadyImported]).toContain(true)
    expect(fakeState.projects.size).toBe(1)
    expect(fakeState.checks).toHaveLength(1)
    expect(
      fixture.requests.every((request) =>
        request.startsWith("https://api.github.com/")
      )
    ).toBe(true)
  })
})
