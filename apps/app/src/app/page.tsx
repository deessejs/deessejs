import { redirect } from "next/navigation"

/**
 * Root route — Cloud is deployed on app.deessejs.com (per
 * [[project-cloud-deployment-domains]]). Unauthenticated visitors
 * hitting the bare domain should land on the sign-in page.
 *
 * Once Better Auth is wired (per [[reference-better-auth-device-flow]]),
 * this should become a smart redirect: /login if no session, /home if
 * authenticated. For now, the unauthenticated-first redirect is the
 * standard SaaS entry pattern.
 */
export default function RootPage() {
  redirect("/login")
}