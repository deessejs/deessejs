import { createClient, deesseServer } from "deesse/react"

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const page = await fetch(baseURL)
if (!page.ok) throw new Error(`page failed: ${page.status}`)

const anonymousAdmin = await fetch(`${baseURL}/admin`, { redirect: "manual" })
if (
  anonymousAdmin.status !== 307 ||
  new URL(anonymousAdmin.headers.get("location"), baseURL).pathname !== "/"
) {
  throw new Error(
    `anonymous admin request was not redirected to sign-in: ${anonymousAdmin.status}`
  )
}
const anonymousNestedAdmin = await fetch(`${baseURL}/admin/posts`, {
  redirect: "manual",
})
if (
  anonymousNestedAdmin.status !== 307 ||
  new URL(anonymousNestedAdmin.headers.get("location"), baseURL).pathname !== "/"
) {
  throw new Error(
    `anonymous nested admin request was not redirected to sign-in: ${anonymousNestedAdmin.status}`
  )
}

const email = `smoke-${crypto.randomUUID()}@example.test`
const password = "local-smoke-password-123"
const signup = await fetch(`${baseURL}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: baseURL },
  body: JSON.stringify({ name: "Smoke User", email, password }),
})
if (!signup.ok)
  throw new Error(`sign-up failed: ${signup.status} ${await signup.text()}`)
const signupBody = await signup.json()
const cookies = signup.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .join("; ")
if (!cookies) throw new Error("sign-up returned no session cookie")

const memberAdmin = await fetch(`${baseURL}/admin`, {
  headers: { cookie: cookies },
})
if (
  !memberAdmin.ok ||
  !(await memberAdmin.text()).includes("Admin access required")
) {
  throw new Error(
    `non-admin session was not denied by the server-rendered dashboard: ${memberAdmin.status}`
  )
}
const memberNestedAdmin = await fetch(`${baseURL}/admin/posts`, {
  headers: { cookie: cookies },
})
if (
  !memberNestedAdmin.ok ||
  !(await memberNestedAdmin.text()).includes("Admin access required")
) {
  throw new Error(
    `non-admin nested route was not denied by the server-side guard: ${memberNestedAdmin.status}`
  )
}

const authSession = await fetch(`${baseURL}/api/auth/get-session`, {
  headers: { cookie: cookies },
})
if (!authSession.ok)
  throw new Error(`session request failed: ${authSession.status}`)
const session = await authSession.json()
if (session?.user?.id !== signupBody.user.id)
  throw new Error("session user did not match newly created account")

const client = createClient({
  server: deesseServer(),
  baseURL,
  fetch: (input, init) => {
    const headers = new Headers(init?.headers)
    headers.set("cookie", cookies)
    return fetch(input, { ...init, headers })
  },
})
const health = await client.api.health()
if (health.status !== "ok")
  throw new Error("public health procedure returned an unexpected result")
const me = await client.api.posts.me()
if (me.id !== signupBody.user.id)
  throw new Error("authenticated plugin route returned a different user")

const title = `Persistent smoke post ${crypto.randomUUID()}`
const created = await client.api.posts.create({ title })
if (created.title !== title)
  throw new Error("create route returned the wrong post")
const posts = await client.api.posts.list()
if (!posts.some((post) => post.id === created.id && post.title === title))
  throw new Error("created post was not returned by list")

console.log(
  JSON.stringify({
    page: page.status,
    anonymousAdmin: anonymousAdmin.status,
    anonymousNestedAdmin: anonymousNestedAdmin.status,
    signedInNonAdmin: memberAdmin.status,
    signedInNonAdminNested: memberNestedAdmin.status,
    signup: signup.status,
    session: authSession.status,
    publicHealth: health.status,
    authenticatedUser: me.id === signupBody.user.id,
    createdPost: created.id,
    readBack: true,
  })
)
