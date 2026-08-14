import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Open Source Program",
  description:
    "DeesseJS Pro for open source maintainers. The license binds to the project, not the individual.",
}

/**
 * Open Source Program at /oss.
 *
 * Pro Education also covers open source projects: the license is
 * MIT, free, and binds to the repo rather than the individual. This
 * page states the eligibility rules and the application flow.
 *
 * No cash sponsorship, no co-marketing. The offer is the Pro license.
 */
export default function OssPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Open source
        </p>
        <h1 className="text-heading-56 tracking-tight">
          DeesseJS Pro for the project you maintain.
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
          Public open source projects can get a DeesseJS Pro license under
          the same terms as verified students. The license binds to the
          project, not the maintainer. A maintainer change does not
          invalidate the license, and the license does not transfer to
          non-contributors.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">What you get</h2>
        <ul className="flex flex-col gap-3">
          {[
            "Lifetime access to the full Pro catalog, including future templates.",
            "Source code delivered for every Pro template.",
            "Cloud access (auth, repo, CLI clone) for each template.",
            "MIT license, scoped to the project.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <Check
                className="mt-1 size-4 shrink-0 text-foreground"
                aria-hidden="true"
              />
              <span className="text-copy-16 text-foreground">{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">Eligibility</h2>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          The project must satisfy all four:
        </p>
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
          <li className="list-disc">
            Public repo with at least one tagged release.
          </li>
          <li className="list-disc">
            Maintenance activity (commits, releases, or issue triage) within
            the last six months.
          </li>
          <li className="list-disc">
            The applicant is listed in OWNERS, CODEOWNERS, or the equivalent
            maintainer file.
          </li>
          <li className="list-disc">
            The license covers the named project. It does not cover other
            projects owned by the same maintainer, and it does not transfer to
            a third party who is not an OSS contributor to the named project.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">How to apply</h2>
        <ol className="flex flex-col gap-3 pl-4 text-copy-16 text-foreground">
          <li className="list-decimal">
            Email{" "}
            <Link
              href="mailto:support@deessejs.com?subject=OSS%20license%20application"
              className="underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </Link>{" "}
            with the repo URL and a one-sentence description of what it does.
          </li>
          <li className="list-decimal">
            We reply within five business days with a license file scoped to
            the project.
          </li>
          <li className="list-decimal">
            The license file is committed alongside the project so future
            maintainers see it.
          </li>
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">What is not in scope</h2>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          No cash sponsorship, no co-marketing, no swag. The offer is the
          license. If you are looking for those programs,{" "}
          <Link
            href="mailto:support@deessejs.com?subject=Partnership"
            className="underline underline-offset-4 hover:text-foreground"
          >
            email us
          </Link>{" "}
          and we will see what is possible.
        </p>
      </section>

      <div className="flex">
        <Button asChild>
          <a href="mailto:support@deessejs.com?subject=OSS%20license%20application">
            Apply for an OSS license
          </a>
        </Button>
      </div>
    </article>
  )
}
