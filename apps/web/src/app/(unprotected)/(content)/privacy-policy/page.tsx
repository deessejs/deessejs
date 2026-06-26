import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — DeesseJS",
  description: "How DeesseJS collects, uses, and protects your data.",
}

export default function PolicyPage() {
  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-24">
      <div className="mx-auto max-w-2xl px-4 text-left sm:px-6 lg:px-8">
        <h1 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: June 26, 2026
        </p>

        <div className="mt-12 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            This is a dummy placeholder for the DeesseJS Privacy Policy. The
            real document will describe what personal data we collect (account
            info, payment data, usage analytics), how we use it (to provide
            the service, prevent fraud, communicate updates), and the rights
            you have over your data (access, export, deletion).
          </p>
          <p>
            DeesseJS is self-hosted by default — your data stays in your
            infrastructure. The managed Cloud variant (coming Q3 2026) will
            follow GDPR and CCPA requirements, including data processing
            addendums on request.
          </p>
          <p>
            For privacy questions or to exercise your rights, contact{" "}
            <a
              href="mailto:privacy@deessejs.com"
              className="text-foreground underline-offset-4 hover:underline"
            >
              privacy@deessejs.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
