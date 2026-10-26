import { describe, expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"

// The probe observes the invitation endpoints with the plugin the
// application actually ships, so it wires `organizationPlugin` itself
// rather than a reconstruction. Only the mailer is replaced: it keeps
// SMTP out of the measurement and is irrelevant to the decision under
// test.
vi.mock("@workspace/email", () => ({
  sendOrganizationInvitationEmail: vi.fn(async () => ({ ok: true })),
}))

// The create hook reads the provisioning operation table, because a
// creation carries the operation it belongs to. The probe's accounts
// live in the memory adapter, so the operation read is substituted as
// well: the probe measures the invitation contract, and the storage
// behind it is not what it measures.
const { probeDb } = vi.hoisted(() => {
  const operation = {
    id: "probe-attempt",
    userId: "probe-owner",
    name: "Probe Org",
    slug: "probe-org",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const where = () => ({ limit: async () => [operation] })
  const from = () => ({ where })
  const select = () => ({ from })
  return { probeDb: { select } }
})

vi.mock("@workspace/database", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/database")>()),
  db: probeDb,
}))

const { createOrganizationPlugin, organizationPlugin } = await import(
  "../../src/organization/plugin.js"
)

/**
 * Endpoint-level measurement of Better Auth 1.7.7's invitation
 * contract: does `requireEmailVerificationOnInvitation: true` actually
 * stop an unverified user from accepting an invitation?
 *
 * This measurement is what selects the route-level mitigation. If the
 * endpoint blocks the acceptance on its own, no matcher in
 * `proxy.ts` is needed. If it does not, the native
 * `/api/v1/auth/organization/accept-invitation` route has to be
 * protected separately, because the plugin's own guard is the only
 * thing standing in front of it.
 *
 * ## What is real here
 *
 * The plugin is the shipped one, so the option under test, the
 * `beforeCreateOrganization` hook, and the invitation expiry are the
 * production values. Every measured call goes through `auth.handler`,
 * which means route matching, body parsing, session middleware, and
 * the HTTP error envelope are Better Auth's own rather than a
 * hand-rolled invocation of the same function.
 *
 * ## What is substituted, and why
 *
 * **Storage.** The memory adapter replaces Drizzle and Postgres. The
 * question is what the endpoint decides, not how rows are stored.
 *
 * **The mailer.** `@workspace/email` is mocked to accept immediately,
 * so no SMTP is involved and the awaited callback settles at once.
 *
 * **`emailAndPassword.requireEmailVerification: false`.** This is a
 * deliberate deviation from production and it is load-bearing. Shipped
 * as `true`, it makes `signUpEmail` skip auto sign-in and
 * `signInEmail` reject unverified accounts, so an unverified user
 * cannot hold a session through email and password at all. The
 * endpoint's verification guard would then be unreachable on that
 * path and the probe would have nothing to measure. Relaxing the
 * setting lets an unverified session exist so the guard can be seen
 * firing.
 *
 * The consequence is a finding rather than a caveat: under the
 * shipped configuration the guard is reachable only through a session
 * obtained some other way, such as a social login whose provider
 * reports an unverified email. It is defence in depth on that path,
 * not the primary control. The guard is still correct to keep, because
 * the social path is real and any future relaxation of the
 * email/password settings would otherwise leave the invitation
 * endpoint unguarded.
 */

const BASE_URL = "http://localhost:3000"
const BASE_PATH = "/api/auth"
const PASSWORD = "Probe-password-1"

const OWNER = { email: "owner@probe.test", password: PASSWORD, name: "Owner" }
const INVITEE = { email: "invitee@probe.test", password: PASSWORD, name: "Invitee" }

/** The code Better Auth raises when the guard fires. */
const GUARD_CODE = "EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION"

/** Minimal cookie jar: the probe drives real HTTP, so it carries the session cookie by hand. */
class CookieJar {
  private readonly cookies = new Map<string, string>()

  absorb(response: Response): void {
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";")[0]
      const separator = pair.indexOf("=")
      if (separator > 0) {
        this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
      }
    }
  }

  header(): string {
    return [...this.cookies]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ")
  }
}

type ApiResponse = {
  status: number
  code?: string
  json: Record<string, unknown> | null
}

async function call(
  auth: ReturnType<typeof betterAuth>,
  jar: CookieJar,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<ApiResponse> {
  const cookie = jar.header()
  const response = await auth.handler(
    new Request(`${BASE_URL}${BASE_PATH}${path}`, {
      method: init.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    }),
  )
  jar.absorb(response)
  const text = await response.text()
  let json: Record<string, unknown> | null = null
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    json = null
  }
  const code = typeof json?.code === "string" ? json.code : undefined
  return { status: response.status, code, json }
}

type Probe = {
  label: string
  auth: ReturnType<typeof betterAuth>
  /** Verification URLs in sign-up order. */
  verificationUrls: string[]
}

/**
 * The memory adapter indexes rows by model name on a plain object and
 * throws on a lookup against a model that has no key at all, so every
 * model the plugin stack can touch has to be present, even when empty.
 */
function createMemoryDb(): Record<string, unknown[]> {
  return {
    user: [],
    session: [],
    account: [],
    verification: [],
    organization: [],
    member: [],
    invitation: [],
    team: [],
  }
}

function createProbe(label: string, plugin: ReturnType<typeof createOrganizationPlugin>): Probe {
  const verificationUrls: string[] = []
  const auth = betterAuth({
    appName: "invitation-contract-probe",
    baseURL: BASE_URL,
    basePath: BASE_PATH,
    secret: "invitation-contract-probe-secret-value-32ch",
    database: memoryAdapter(createMemoryDb()),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ url }) => {
        verificationUrls.push(url)
      },
    },
    session: { expiresIn: 60 * 60 },
    plugins: [plugin],
  })
  return { label, auth, verificationUrls }
}

async function verifyEmailAt(probe: Probe, index: number): Promise<void> {
  const url = probe.verificationUrls[index]
  if (!url) throw new Error(`probe "${probe.label}": no verification URL at index ${index}`)
  const token = new URL(url).searchParams.get("token")
  if (!token) throw new Error(`probe "${probe.label}": verification URL carries no token`)
  await call(probe.auth, new CookieJar(), `/verify-email?token=${encodeURIComponent(token)}`)
}

type Observation = {
  label: string
  inviteeVerified: boolean
  requireEmailVerificationOnInvitation: boolean
  status: number
  code?: string
  accepted: boolean
}

/**
 * Run one full invitation lifecycle and report what the acceptance
 * endpoint decided.
 */
async function observe(options: {
  label: string
  plugin: ReturnType<typeof createOrganizationPlugin>
  requireEmailVerificationOnInvitation: boolean
  verifyInvitee: boolean
}): Promise<Observation> {
  const probe = createProbe(options.label, options.plugin)
  const ownerJar = new CookieJar()
  const inviteeJar = new CookieJar()

  const signUp = await call(probe.auth, ownerJar, "/sign-up/email", {
    method: "POST",
    body: OWNER,
  })
  if (signUp.status !== 200) {
    throw new Error(`probe "${options.label}": owner sign-up failed (${signUp.status})`)
  }

  // The owner must be verified: `allowUserToCreateOrganization` and
  // `beforeCreateOrganizationHook` both require it.
  await verifyEmailAt(probe, 0)

  const created = await call(probe.auth, ownerJar, "/organization/create", {
    method: "POST",
    // The marker is the operation the creation belongs to, and the
    // create hook refuses a creation that carries none.
    body: {
      name: "Probe Org",
      slug: "probe-org",
      metadata: { provisioningAttempt: "probe-attempt" },
    },
  })
  if (created.status !== 200) {
    throw new Error(`probe "${options.label}": create organization failed (${created.status})`)
  }
  const organizationId = created.json?.id as string

  const invited = await call(probe.auth, ownerJar, "/organization/invite-member", {
    method: "POST",
    body: { email: INVITEE.email, role: "member", organizationId },
  })
  if (invited.status !== 200) {
    throw new Error(`probe "${options.label}": invite failed (${invited.status}) ${JSON.stringify(invited.json)}`)
  }
  const invitationId = invited.json?.id as string

  const inviteeSignUp = await call(probe.auth, inviteeJar, "/sign-up/email", {
    method: "POST",
    body: INVITEE,
  })
  if (inviteeSignUp.status !== 200) {
    throw new Error(`probe "${options.label}": invitee sign-up failed (${inviteeSignUp.status})`)
  }

  if (options.verifyInvitee) {
    await verifyEmailAt(probe, 1)
  }

  const accepted = await call(
    probe.auth,
    inviteeJar,
    "/organization/accept-invitation",
    { method: "POST", body: { invitationId } },
  )

  return {
    label: options.label,
    inviteeVerified: options.verifyInvitee,
    requireEmailVerificationOnInvitation:
      options.requireEmailVerificationOnInvitation,
    status: accepted.status,
    code: accepted.code,
    accepted: accepted.status === 200,
  }
}

const scenarios = [
  {
    label: "shipped config, unverified invitee",
    plugin: organizationPlugin,
    requireEmailVerificationOnInvitation: true,
    verifyInvitee: false,
  },
  {
    label: "shipped config, verified invitee",
    plugin: organizationPlugin,
    requireEmailVerificationOnInvitation: true,
    verifyInvitee: true,
  },
  {
    label: "guard disabled, unverified invitee (control)",
    plugin: createOrganizationPlugin({
      requireEmailVerificationOnInvitation: false,
    }),
    requireEmailVerificationOnInvitation: false,
    verifyInvitee: false,
  },
] as const

// The lifecycle is expensive enough to be worth running once, so all
// three scenarios execute at module load and every assertion reads the
// same result set.
const results = await Promise.all(scenarios.map(observe))

describe("Artifact B: invitation contract probe", () => {
  it("blocks an unverified invitee when requireEmailVerificationOnInvitation is true", () => {
    const observed = results[0]
    expect(observed.status).toBe(403)
    expect(observed.code).toBe(GUARD_CODE)
    expect(observed.accepted).toBe(false)
  })

  it("accepts a verified invitee, so the guard is what blocks, not a broken fixture", () => {
    const observed = results[1]
    expect(observed.status).toBe(200)
    expect(observed.accepted).toBe(true)
  })

  it("accepts an unverified invitee when the option is false, so the option is the deciding input", () => {
    const observed = results[2]
    expect(observed.status).toBe(200)
    expect(observed.accepted).toBe(true)
  })

  it("prints the transcript", () => {
    const lines = results.map((r) => ({
      scenario: r.label,
      "requireEmailVerificationOnInvitation": r.requireEmailVerificationOnInvitation,
      "invitee.emailVerified": r.inviteeVerified,
      status: r.status,
      code: r.code ?? "(none)",
      accepted: r.accepted,
    }))
    console.log(
      "\nArtifact B transcript: better-auth@1.7.7 POST /organization/accept-invitation\n" +
        `${JSON.stringify(lines, null, 2)}\n`,
    )
    expect(lines).toHaveLength(3)
  })
})