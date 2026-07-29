import type { Metadata } from "next"
import { H1, H2, P, Link } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false, follow: false },
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Terms of Service</H1>
      <P>
        By using this application, you agree to these terms. Replace this page with
        your actual terms of service before going to production.
      </P>
      <H2>Acceptance of Terms</H2>
      <P>
        By accessing or using the service, you agree to be bound by these Terms of
        Service and to comply with all applicable laws and regulations.
      </P>
      <H2>Use of the Service</H2>
      <P>
        You may use our service only for lawful purposes and in accordance with these
        Terms. You agree not to use the service in any way that violates any
        applicable law or regulation.
      </P>
      <H2>Disclaimer</H2>
      <P>
        The service is provided &ldquo;as is&rdquo; without warranties of any kind, either
        express or implied.
      </P>
      <H2>Contact</H2>
      <P>
        If you have questions about these Terms, please contact us at{" "}
        <Link href="mailto:terms@example.com">terms@example.com</Link>.
      </P>
    </div>
  )
}
