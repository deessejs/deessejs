import { createClient, deesseServer } from "deesse/react"
import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import postgres from "postgres"

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false })
const password = "local-smoke-password-123"
const makeEmail = (label) => `${label}-${crypto.randomUUID()}@example.test`
const authPackage = JSON.parse(readFileSync(new URL("../node_modules/auth/package.json", import.meta.url), "utf8"))
const authCli = fileURLToPath(new URL(`../node_modules/auth/${authPackage.bin.auth}`, import.meta.url))

function sessionCookie(response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ")
}

async function signUp(email, name, extraFields = {}) {
  const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({ name, email, password, ...extraFields }),
  })
  if (!response.ok) {
    throw new Error(`sign-up failed: ${response.status} ${await response.text()}`)
  }
  return response.json()
}

async function signIn(email, signInPassword = password) {
  const response = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({ email, password: signInPassword }),
  })
  if (!response.ok) {
    throw new Error(`sign-in failed: ${response.status} ${await response.text()}`)
  }
  const cookie = sessionCookie(response)
  if (!cookie) throw new Error("sign-in returned no session cookie")
  return cookie
}

async function readSession(cookie) {
  const response = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: { cookie },
  })
  if (!response.ok) throw new Error(`session request failed: ${response.status}`)
  return response.json()
}

async function requestAdminPage(path, cookie) {
  return fetch(`${baseURL}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  })
}

async function expectDenied(path, cookie) {
  const response = await requestAdminPage(path, cookie)
  const body = await response.text()
  if (
    response.status !== 200 ||
    !body.includes("Admin access required") ||
    body.includes("Your admin dashboard is ready") ||
    body.includes("Create post")
  ) {
    throw new Error(`expected server denial without protected content at ${path}: ${response.status}`)
  }
  return response.status
}

async function expectAllowed(path, cookie, marker) {
  const response = await requestAdminPage(path, cookie)
  const body = await response.text()
  if (response.status !== 200 || !body.includes(marker)) {
    throw new Error(`expected admin page ${path} with marker ${marker}: ${response.status}`)
  }
  return response.status
}

function runCreateAdmin(email) {
  const adminPassword = randomBytes(24).toString("base64url")
  const result = spawnSync(
    process.execPath,
    [
      authCli,
      "create-admin",
      "--config",
      "./.deesse/tooling/auth.config.ts",
      "--email",
      email,
      "--name",
      "Bootstrap administrator",
      "--password",
      adminPassword,
      "--yes",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  )
  if (result.error) throw result.error
  return { result, password: adminPassword }
}

try {
  const home = await fetch(baseURL)
  if (!home.ok) throw new Error(`home page failed: ${home.status}`)

  const anonymous = {}
  for (const path of ["/admin", "/admin/blog"]) {
    const response = await requestAdminPage(path)
    if (
      response.status !== 307 ||
      new URL(response.headers.get("location"), baseURL).pathname !== "/"
    ) {
      throw new Error(`anonymous request was not redirected from ${path}: ${response.status}`)
    }
    anonymous[path] = response.status
  }

  const ordinaryEmail = makeEmail("ordinary")
  const ordinarySignup = await signUp(ordinaryEmail, "Ordinary User")
  const [ordinaryRow] = await sql`
    select id, role from "user" where email = ${ordinaryEmail}
  `
  if (!ordinaryRow || ordinaryRow.id !== ordinarySignup.user.id || ordinaryRow.role !== "user") {
    throw new Error(`new account did not persist the ordinary role: ${ordinaryRow?.role ?? "missing"}`)
  }

  const ordinaryCookie = await signIn(ordinaryEmail)
  const ordinarySession = await readSession(ordinaryCookie)
  if (ordinarySession?.user?.role !== "user") {
    throw new Error(`ordinary sign-in returned an unexpected role: ${ordinarySession?.user?.role}`)
  }
  const ordinaryDenied = {
    "/admin": await expectDenied("/admin", ordinaryCookie),
    "/admin/blog": await expectDenied("/admin/blog", ordinaryCookie),
  }

  // Better Auth must reject client-supplied privilege fields during signup.
  const roleInjectionEmail = makeEmail("role-injection")
  const roleInjection = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({
      name: "Role Injection Attempt",
      email: roleInjectionEmail,
      password,
      role: "admin",
    }),
  })
  const roleInjectionBody = await roleInjection.json()
  const [roleInjectionRow] = await sql`
    select id from "user" where email = ${roleInjectionEmail}
  `
  if (
    roleInjection.status !== 400 ||
    roleInjectionBody?.code !== "FIELD_NOT_ALLOWED" ||
    roleInjectionRow
  ) {
    throw new Error("sign-up accepted or persisted a client-supplied admin role")
  }

  const bootstrapEmail = makeEmail("bootstrap-admin")
  const { result: bootstrapResult, password: bootstrapPassword } = runCreateAdmin(bootstrapEmail)
  if (bootstrapResult.status !== 0 || !bootstrapResult.stdout.includes("Admin user created successfully.")) {
    throw new Error(`Better Auth create-admin failed: ${bootstrapResult.stderr || bootstrapResult.stdout}`)
  }
  const [bootstrapRow] = await sql`
    select id, role from "user" where email = ${bootstrapEmail}
  `
  if (bootstrapRow?.role !== "admin") {
    throw new Error(`create-admin did not persist the admin role: ${bootstrapRow?.role ?? "missing"}`)
  }
  const { result: duplicateBootstrap } = runCreateAdmin(bootstrapEmail)
  if (duplicateBootstrap.status === 0 || duplicateBootstrap.stdout.includes("Admin user created successfully.")) {
    throw new Error("create-admin unexpectedly replaced an existing account")
  }
  const [afterDuplicateBootstrap] = await sql`
    select id, role from "user" where email = ${bootstrapEmail}
  `
  if (afterDuplicateBootstrap?.id !== bootstrapRow.id || afterDuplicateBootstrap?.role !== "admin") {
    throw new Error("duplicate create-admin attempt changed the existing account")
  }
  const bootstrapCookie = await signIn(bootstrapEmail, bootstrapPassword)
  const bootstrapSession = await readSession(bootstrapCookie)
  if (bootstrapSession?.user?.role !== "admin") {
    throw new Error("bootstrap administrator could not sign in with the persisted admin role")
  }

  const forbiddenRoleAssignment = await fetch(`${baseURL}/api/auth/admin/set-role`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseURL,
      cookie: ordinaryCookie,
    },
    body: JSON.stringify({ userId: ordinaryRow.id, role: "admin" }),
  })
  const [stillOrdinaryRow] = await sql`
    select role from "user" where id = ${ordinaryRow.id}
  `
  if (forbiddenRoleAssignment.status !== 403 || stillOrdinaryRow?.role !== "user") {
    throw new Error("ordinary user could assign the admin role")
  }

  const roleAssignment = await fetch(`${baseURL}/api/auth/admin/set-role`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseURL,
      cookie: bootstrapCookie,
    },
    body: JSON.stringify({ userId: ordinaryRow.id, role: "admin" }),
  })
  if (!roleAssignment.ok) {
    throw new Error(`Better Auth admin role assignment failed: ${roleAssignment.status}`)
  }
  const assigned = await roleAssignment.json()
  const [adminRow] = await sql`
    select id, role from "user" where id = ${ordinaryRow.id}
  `
  if (
    assigned?.user?.id !== adminRow?.id ||
    assigned?.user?.role !== "admin" ||
    adminRow?.role !== "admin"
  ) {
    throw new Error("Better Auth admin role assignment was not persisted")
  }

  const adminCookie = await signIn(ordinaryEmail)
  const adminSession = await readSession(adminCookie)
  if (adminSession?.user?.id !== adminRow.id || adminSession?.user?.role !== "admin") {
    throw new Error(`admin sign-in did not return the persisted admin role: ${adminSession?.user?.role}`)
  }
  const adminAllowed = {
    "/admin": await expectAllowed("/admin", adminCookie, "Your admin dashboard is ready"),
    "/admin/blog": await expectAllowed("/admin/blog", adminCookie, "Create post"),
  }
  const unknownAdminPage = await requestAdminPage("/admin/not-configured", adminCookie)
  if (unknownAdminPage.status !== 404) {
    throw new Error(`unknown admin page did not return not found: ${unknownAdminPage.status}`)
  }

  const roleCases = [
    { label: "null", role: null, allowed: false },
    { label: "empty", role: "", allowed: false },
    { label: "unknown token", role: "administrator", allowed: false },
    { label: "unknown combined token", role: "user,administrator", allowed: false },
    { label: "whitespace malformed tokens", role: " user, admin ", allowed: false },
    { label: "Better Auth combined roles", role: "user,admin", allowed: true },
  ]
  const malformedRoleResults = {}
  for (const testCase of roleCases) {
    if (testCase.role === null) {
      await sql`update "user" set role = null where id = ${adminRow.id}`
    } else {
      await sql`update "user" set role = ${testCase.role} where id = ${adminRow.id}`
    }
    const [persisted] = await sql`select role from "user" where id = ${adminRow.id}`
    if (persisted?.role !== testCase.role) {
      throw new Error(`database role fixture did not persist the ${testCase.label} value`)
    }
    for (const path of ["/admin", "/admin/blog"]) {
      if (testCase.allowed) {
        await expectAllowed(path, adminCookie, path === "/admin" ? "Your admin dashboard is ready" : "Create post")
      } else {
        await expectDenied(path, adminCookie)
      }
    }
    malformedRoleResults[testCase.label] = testCase.allowed ? "allowed" : "denied"
  }
  await sql`update "user" set role = 'admin' where id = ${adminRow.id}`

  const ordinaryClient = createClient({
    server: deesseServer(),
    baseURL,
    fetch: (input, init) => {
      const headers = new Headers(init?.headers)
      headers.set("cookie", ordinaryCookie)
      return fetch(input, { ...init, headers })
    },
  })
  const health = await ordinaryClient.api.health()
  if (health.status !== "ok") throw new Error("public health procedure returned an unexpected result")
  const publishedPosts = await ordinaryClient.api.blog.published.list({ limit: 10 })
  if (!Array.isArray(publishedPosts)) throw new Error("published posts route returned an invalid result")
  let ordinaryManagementDenied = false
  try {
    await ordinaryClient.api.blog.management.list({ limit: 10 })
  } catch (error) {
    ordinaryManagementDenied = error?.code === "FORBIDDEN"
  }
  if (!ordinaryManagementDenied) throw new Error("ordinary user accessed the Blog management API")

  const adminClient = createClient({
    server: deesseServer(),
    baseURL,
    fetch: (input, init) => {
      const headers = new Headers(init?.headers)
      headers.set("cookie", adminCookie)
      return fetch(input, { ...init, headers })
    },
  })

  const title = `Persistent smoke post ${crypto.randomUUID()}`
  const created = await adminClient.api.blog.management.create({ title, content: `# ${title}` })
  if (created.title !== title) throw new Error("create route returned the wrong post")
  const published = await adminClient.api.blog.management.publish({ id: created.id })
  if (published.status !== "published" || !published.publishedAt) throw new Error("publish transition failed")
  const publicPost = await ordinaryClient.api.blog.published.getBySlug({ slug: created.slug })
  if (publicPost.id !== created.id) throw new Error("published post was not readable by slug")
  const unpublished = await adminClient.api.blog.management.unpublish({ id: created.id })
  if (unpublished.status !== "draft" || unpublished.publishedAt !== null) throw new Error("unpublish transition failed")
  await adminClient.api.blog.management.delete({ id: created.id })

  console.log(JSON.stringify({
    home: home.status,
    anonymous,
    signupRoleInjection: "rejected",
    ordinaryRolePersisted: ordinaryRow.role,
    ordinaryDenied,
    operatorBootstrap: bootstrapRow.role,
    duplicateBootstrap: "refused without changing existing account",
    adminRolePersisted: adminRow.role,
    ordinaryRoleAssignment: forbiddenRoleAssignment.status,
    betterAuthRoleAssignment: roleAssignment.status,
    adminAllowed,
    unknownAdminPage: unknownAdminPage.status,
    malformedRoleResults,
    publicHealth: health.status,
    ordinaryBlogManagementDenied: ordinaryManagementDenied,
    publishedBlogApi: true,
    blogLifecycle: true,
  }))
} finally {
  await sql.end()
}
