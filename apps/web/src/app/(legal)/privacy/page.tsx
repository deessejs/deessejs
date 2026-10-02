import type { Metadata } from "next"
import { H1, H2, P, Link } from "@workspace/ui/components/typography"
import { APP_CONFIG } from "@/lib/app-config"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How DeesseJS handles data: auth email, optional GitHub username, and nothing else by default.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy",
    description:
      "How DeesseJS handles data: auth email, optional GitHub username, and nothing else by default.",
    siteName: APP_CONFIG.name,
    locale: "en_US",
    url: "/privacy",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy",
    description:
      "How DeesseJS handles data: auth email, optional GitHub username, and nothing else by default.",
  },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 [&>h2]:mt-10">
      <H1>Privacy Policy</H1>
      <P>
        DeesseJS only stores the data needed to operate the service. We do not
        use third-party analytics, advertising trackers, or social pixels.
        Review this section with your counsel before going to production in
        jurisdictions with specific privacy regulations (GDPR, CCPA, LGPD, ...).
      </P>

      <H2>Data we collect</H2>
      <P>
        Account email (required, used for sign-in via magic link or the better-auth
        session cookie). Optional GitHub or GitLab username (only if you apply for
        the Open Source or Pro Education programs). Billing data for active Pro
        subscriptions is handled by Stripe and never stored on our servers beyond
        a subscription reference. We do not log IPs in a way that can identify a
        user across sessions.
      </P>

      <H2>How we use data</H2>
      <P>
        To operate, secure, and improve the service. Auth email is used to sign
        you in and to send transactional email (password reset, billing receipt,
        critical security notices). We never sell or share data with third
        parties, and we never use it for advertising.
      </P>

      <H2>Cookies</H2>
      <P>
        The cookie categories and your opt-in choices are detailed on our{" "}
        <Link href="/cookies">Cookie Policy</Link>. By default, only strictly
        necessary cookies are set. Analytics and marketing categories are
        disabled until you opt in.
      </P>

      <H2>Your rights</H2>
      <P>
        You can request export or deletion of your account data at any time by
        emailing the address below. We respond within five business days.
      </P>

      <H2>Contact</H2>
      <P>
        For privacy questions, data export, or data deletion requests, email{" "}
        <Link href="mailto:support@deessejs.com?subject=Privacy%20request">
          support@deessejs.com
        </Link>
        .
      </P>
    </div>
  )
}