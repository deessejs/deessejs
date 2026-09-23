import type { Metadata } from "next"
import { H1, H2, P, Link } from "@workspace/ui/components/typography"

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: false },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <H1>Privacy Policy</H1>
      <P>
        Your privacy matters. This template does not collect any data by default.
        Replace this page with your actual privacy policy before going to production.
      </P>
      <H2>Data We Collect</H2>
      <P>
        When you use this application, we may collect information you provide directly,
        such as when you create an account or contact us.
      </P>
      <H2>How We Use Your Data</H2>
      <P>
        We use the information we collect to operate, improve, and secure our services.
      </P>
      <H2>Contact</H2>
      <P>
        If you have questions about this Privacy Policy, please contact us at{" "}
        <Link href="mailto:privacy@example.com">privacy@example.com</Link>.
      </P>
    </div>
  )
}
