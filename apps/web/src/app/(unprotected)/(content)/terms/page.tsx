import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — DeesseJS",
  description: "The terms and conditions for using DeesseJS.",
}

export default function TermsPage() {
  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-24">
      <div className="mx-auto max-w-2xl px-4 text-left sm:px-6 lg:px-8">
        <h1 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: June 26, 2026
        </p>

        <div className="mt-12 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            This is a dummy placeholder for the DeesseJS Terms of Service. The
            real document will outline the terms and conditions under which
            you may use the DeesseJS template, including license grants,
            acceptable use, liability limitations, and refund policies.
          </p>
          <p>
            By purchasing or downloading DeesseJS, you agree to abide by
            these terms. The full legal copy will be drafted by counsel
            before public launch.
          </p>
          <p>
            For questions in the meantime, contact{" "}
            <a
              href="mailto:legal@deessejs.com"
              className="text-foreground underline-offset-4 hover:underline"
            >
              legal@deessejs.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
