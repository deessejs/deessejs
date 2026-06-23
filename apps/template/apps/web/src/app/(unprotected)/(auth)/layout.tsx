import Link from "next/link"
import type { PropsWithChildren } from "react"

/**
 * Layout for unauthenticated auth pages (login, signup, forgot-password,
 * reset-password, verify-email, magic-link).
 *
 * Two-column shell:
 *   - Left  (≥ md): the form card + legal footer
 *   - Right (≥ md): brand + headline + 3 value props + social proof line
 *   - < md  (mobile): single column — form first (primary action)
 *
 * The shared top nav (DeesseJS brand + Log in / Sign up) comes from
 * the parent (unprotected)/layout.tsx — no need to repeat it.
 *
 * Pages just render the form — the shell handles the split. Per
 * docs/internal/architecture/03-web-app/pages.md § "Surface: Auth".
 */

// Inline SVG icons so we don't pull lucide-react into apps/web (it lives in
// packages/ui only). Each ~ 24x24, currentColor, viewBox standard.
const IconSparkles = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconShield = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 3l8 3v6c0 4.5-3.2 8.5-8 9-4.8-.5-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const IconBolt = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
)

const valueProps = [
  {
    icon: IconSparkles,
    title: "Production-ready foundation",
    body: "Auth, billing, organisations, and admin tooling already wired — start with product, not plumbing.",
  },
  {
    icon: IconShield,
    title: "Built on proven primitives",
    body: "Next.js 16, React 19, Better Auth, Resend, Drizzle, Hono. The stack real SaaS already trusts.",
  },
  {
    icon: IconBolt,
    title: "Deploy in minutes",
    body: "One click to Vercel. Database, env vars, and secrets handled by the template.",
  },
]

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Left column — form surface (always visible; primary action) */}
      <section className="flex flex-1 flex-col px-4 py-10 sm:px-6 md:px-8 md:py-14">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
            {children}
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-sm text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="/legal/terms"
            className="underline-offset-4 hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      {/* Right column — marketing / visual surface (hidden on mobile) */}
      <aside className="hidden border-l border-border bg-muted/30 md:flex md:w-1/2 md:flex-col md:justify-between md:px-12 md:py-14 lg:px-20">
        <div className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Ship your SaaS,
              <br />
              skip the boilerplate.
            </h2>
            <p className="max-w-md text-base text-muted-foreground lg:text-lg">
              The commercial Next.js template with auth, billing, and org
              tooling already wired. Built on the stack you&rsquo;ve already
              chosen.
            </p>
          </div>

          <ul className="space-y-5">
            {valueProps.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Trusted by indie hackers and small teams building commercial
          software.
        </p>
      </aside>
    </div>
  )
}
