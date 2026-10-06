import type { Metadata } from "next"
import { H1, H2, P, Link } from "@workspace/ui/components/typography"
import { APP_CONFIG } from "@/lib/app-config"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing use of the DeesseJS template catalog, CLI, and cloud runtime.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service",
    description:
      "Terms governing use of the DeesseJS template catalog, CLI, and cloud runtime.",
    siteName: APP_CONFIG.name,
    locale: "en_US",
    url: "/terms",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service",
    description:
      "Terms governing use of the DeesseJS template catalog, CLI, and cloud runtime.",
  },
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 [&>h2]:mt-10">
      <H1>Terms of Service</H1>
      <P>
        By using DeesseJS, you agree to these terms. The templates ship under
        the MIT license; the cloud runtime and CLI are provided as-is. Review
        this section with your counsel before going to production.
      </P>

      <H2>Acceptance</H2>
      <P>
        Using the DeesseJS CLI, the cloud runtime, the docs site, or downloading
        a template from the catalog constitutes acceptance of these Terms of
        Service and agreement to comply with all applicable laws and
        regulations.
      </P>

      <H2>License</H2>
      <P>
        Each template in the catalog ships under the MIT license (see the
        LICENSE file inside the repo). The MIT license governs what you build
        with the template. The CLI tool, the cloud runtime, and the docs site
        are proprietary to DeesseJS and provided as-is, without warranty.
      </P>

      <H2>Acceptable use</H2>
      <P>
        You may use DeesseJS for lawful purposes. You agree not to use the
        service to violate any applicable law or regulation, to infringe on the
        rights of others, to distribute malware, or to attempt to disrupt the
        service for other users.
      </P>

      <H2>Disclaimer</H2>
      <P>
        The service is provided &ldquo;as is&rdquo; without warranties of any kind, either
        express or implied. DeesseJS is not liable for any indirect,
        incidental, special, consequential, or punitive damages arising from
        use of the service.
      </P>

      <H2>Changes</H2>
      <P>
        We may update these Terms from time to time. Material changes will be
        announced on the changelog. Continued use of the service after a
        change constitutes acceptance of the updated terms.
      </P>

      <H2>Contact</H2>
      <P>
        For questions about these Terms, email{" "}
        <Link href="mailto:support@deessejs.com?subject=Terms%20question">
          support@deessejs.com
        </Link>
        .
      </P>
    </div>
  )
}