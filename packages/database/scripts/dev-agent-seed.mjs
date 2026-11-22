#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import postgres from "postgres"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { API_AUTH_PATH } from "../../api/dist/constants/base-path.js"

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
)
const localPath = path.join(root, ".env.development.local")
const env = Object.fromEntries(
  readFileSync(localPath, "utf8")
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line)
      return match ? [[match[1], match[2]]] : []
    })
)
const id = createHash("sha256").update(root).digest("hex").slice(0, 12)
const databaseUrl = new URL(env.DATABASE_URL)
if (
  env.NODE_ENV !== "development" ||
  env.DEV_AGENT_WORKTREE_ID !== id ||
  env.DEV_AGENT_DB_NAME !== `deesse_dev_${id}` ||
  databaseUrl.hostname !== "127.0.0.1" ||
  databaseUrl.pathname.slice(1) !== env.DEV_AGENT_DB_NAME
)
  throw new Error(
    "Refusing fixtures: the environment is not this worktree's local development database."
  )

const baseUrl = `http://localhost:${env.DEV_AGENT_PORT}`
const authUrl = `${baseUrl}${API_AUTH_PATH}`
const mailboxPath = env.DEV_AGENT_MAILBOX_FILE
const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false })

function mailboxPosition() {
  try {
    return readFileSync(mailboxPath, "utf8").length
  } catch {
    return 0
  }
}

async function waitForVerification(email, startingPosition) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    let entries = ""
    try {
      entries = readFileSync(mailboxPath, "utf8").slice(startingPosition)
    } catch {}
    for (const line of entries.split(/\r?\n/).filter(Boolean)) {
      const message = JSON.parse(line)
      if (message.to === email && message.subject === "Verify your email") {
        const url = new URL(message.url)
        if (url.hostname !== "localhost" || url.port !== env.DEV_AGENT_PORT) {
          throw new Error(
            "Verification email link did not target this worktree app URL."
          )
        }
        const response = await fetch(url, { redirect: "manual" })
        if (![200, 302, 303, 307].includes(response.status)) {
          throw new Error(
            `Email verification returned HTTP ${response.status} for ${email}.`
          )
        }
        return
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(
    `Timed out waiting for the local verification email for ${email}.`
  )
}

async function createVerifiedAccount({ email, password, name }) {
  const [existing] =
    await sql`select id, email_verified from "user" where email = ${email}`
  if (existing?.email_verified) return existing.id
  const position = mailboxPosition()
  if (existing) {
    await fetch(`${authUrl}/send-verification-email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseUrl },
      body: JSON.stringify({ email, callbackURL: `${baseUrl}/home` }),
    })
  } else {
    const response = await fetch(`${authUrl}/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseUrl },
      body: JSON.stringify({
        email,
        password,
        name,
        callbackURL: `${baseUrl}/home`,
      }),
    })
    if (!response.ok)
      throw new Error(
        `Better Auth signup failed for ${email}: HTTP ${response.status} ${await response.text()}`
      )
  }
  await waitForVerification(email, position)
  const [created] =
    await sql`select id, email_verified from "user" where email = ${email}`
  if (!created?.email_verified)
    throw new Error(`Better Auth did not verify ${email}.`)
  return created.id
}

try {
  const accounts = [
    {
      key: "USER",
      email: env.DEV_AGENT_USER_EMAIL,
      password: env.DEV_AGENT_USER_PASSWORD,
      name: "Agent User",
    },
    {
      key: "ADMIN",
      email: env.DEV_AGENT_ADMIN_EMAIL,
      password: env.DEV_AGENT_ADMIN_PASSWORD,
      name: "Agent Global Admin",
    },
    {
      key: "MEMBER",
      email: env.DEV_AGENT_MEMBER_EMAIL,
      password: env.DEV_AGENT_MEMBER_PASSWORD,
      name: "Agent Member",
    },
  ]
  const users = {}
  for (const account of accounts)
    users[account.key] = await createVerifiedAccount(account)

  await sql.begin(async (tx) => {
    await tx`update "user" set role = 'user' where id = ${users.USER}`
    await tx`update "user" set role = 'admin' where id = ${users.ADMIN}`
    await tx`update "user" set role = 'user' where id = ${users.MEMBER}`
    const organizationId = `agent-org-${id}`
    const slug = `agent-org-${id}`
    await tx`insert into organization (id, name, slug, created_at) values (${organizationId}, 'Agent Readiness Organization', ${slug}, now()) on conflict (id) do update set name = excluded.name, slug = excluded.slug`
    await tx`insert into member (id, organization_id, user_id, role, created_at) values
      (${`agent-owner-${id}`}, ${organizationId}, ${users.USER}, 'owner', now()),
      (${`agent-admin-${id}`}, ${organizationId}, ${users.ADMIN}, 'admin', now()),
      (${`agent-member-${id}`}, ${organizationId}, ${users.MEMBER}, 'member', now())
      on conflict (id) do update set role = excluded.role`
  })
  process.stdout.write(
    `Verified local accounts and seeded organization agent-org-${id}.\n`
  )
} finally {
  await sql.end()
}
