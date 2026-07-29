import { H1, H2, H3, P, Link } from "@workspace/ui/components/typography"

export function CookiePolicy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Cookie Policy</H1>
      <P>
        This page explains what cookies are, what we use them for, and your choices.
      </P>

      <H2>What are cookies?</H2>
      <P>
        Cookies are small text files stored on your device when you visit a website.
        They help websites remember your preferences and understand how you interact
        with our content.
      </P>

      <H2>How we use cookies</H2>
      <P>
        We use cookies to enhance your browsing experience and analyze our traffic.
        All cookies are opt-in — we never set non-essential cookies without your consent.
      </P>

      <H2>Cookie categories</H2>

      <H3>Strictly Necessary</H3>
      <P>
        These cookies are required for the website to function properly. They cannot be
        disabled. Examples: session cookies for authentication, security cookies.
      </P>

      <H3>Analytics</H3>
      <P>
        These cookies help us understand how visitors interact with our website by
        collecting anonymous information. We use this data to improve our content
        and user experience. Examples: Google Analytics, page view tracking.
      </P>

      <H3>Marketing</H3>
      <P>
        These cookies are used to deliver personalized advertisements. They track
        browsing behavior across websites to show relevant ads. Examples: Google Ads,
        Meta Pixel.
      </P>

      <H2>Your choices</H2>
      <P>
        When you first visit our website, you can choose which cookie categories
        to accept. You can change your preferences at any time by clicking the
        cookie settings in the bottom corner of the page.
      </P>
      <P>
        You can also manage your preferences via your browser settings to block
        or delete cookies. Note that blocking strictly necessary cookies may affect
        website functionality.
      </P>

      <H2>Third-party cookies</H2>
      <P>
        Some cookies on our website are set by third-party services (e.g. Google
        Analytics, advertising platforms). These services have their own privacy
        policies. We encourage you to review them.
      </P>

      <H2>Updates</H2>
      <P>
        We may update this Cookie Policy from time to time. Any changes will be
        posted on this page.
      </P>

      <H2>Contact</H2>
      <P>
        If you have questions about our use of cookies, please contact us at{" "}
        <Link href="mailto:privacy@example.com">privacy@example.com</Link>.
      </P>
    </div>
  )
}
