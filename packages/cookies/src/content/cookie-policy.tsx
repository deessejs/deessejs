import { H1, H2, H3, P, Link } from "@workspace/ui/components/typography"

export function CookiePolicy() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 [&>h2]:mt-10">
      <H1>Cookie Policy</H1>
      <P>
        This page explains what cookies DeesseJS uses and your choices. By
        default only strictly necessary cookies are set. Optional analytics and
        marketing categories are disabled until you opt in via the consent
        banner shown on your first visit.
      </P>

      <H2>What are cookies?</H2>
      <P>
        Cookies are small text files stored on your device when you visit a
        website. They help websites remember your preferences and understand how
        you interact with the content.
      </P>

      <H2>How we use cookies</H2>
      <P>
        DeesseJS uses strictly necessary cookies for authentication (the
        better-auth session cookie) and CSRF protection. Analytics and marketing
        cookies are opt-in only and remain disabled if you do not consent.
      </P>

      <H2>Cookie categories</H2>

      <H3>Strictly Necessary</H3>
      <P>
        These cookies are required for the website to function. They cannot be
        disabled. Examples: the better-auth session cookie that keeps you signed
        in, the CSRF token cookie that protects form submissions, the cookie
        that records your consent choice.
      </P>

      <H3>Analytics</H3>
      <P>
        Optional. If you opt in, we use a self-hosted analytics endpoint that
        records anonymized page views with no cross-site correlation. We do not
        use Google Analytics, Plausible, PostHog, or any third-party analytics
        service.
      </P>

      <H3>Marketing</H3>
      <P>
        Optional. We do not use Google Ads, Meta Pixel, LinkedIn Insight Tag,
        or any third-party advertising tracker. If you opt in to the marketing
        category, it would be reserved for first-party reminders (for example
        a banner that announces a new guide you might find useful).
      </P>

      <H2>Your choices</H2>
      <P>
        On your first visit, the consent banner lets you accept all categories
        or only strictly necessary. You can change your preferences at any time
        via the cookie settings in the page footer.
      </P>
      <P>
        You can also manage cookies via your browser settings to block or
        delete them. Blocking strictly necessary cookies will sign you out and
        may break form-protected actions on the site.
      </P>

      <H2>Third-party cookies</H2>
      <P>
        We do not set third-party cookies. The service does not embed Google
        Analytics, Google Ads, Meta Pixel, or any other advertising tracker.
        If you opt in to a category above, the cookies we describe are first
        party to the domain you visited.
      </P>

      <H2>Updates</H2>
      <P>
        We may update this Cookie Policy from time to time. Any material change
        is announced on the changelog. The current version is always available
        at this URL.
      </P>

      <H2>Contact</H2>
      <P>
        For questions about cookies or to exercise your privacy rights, email{" "}
        <Link href="mailto:support@deessejs.com?subject=Cookie%20policy%20question">
          support@deessejs.com
        </Link>
        .
      </P>
    </div>
  )
}