import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Students",
  description:
    "DeesseJS Pro for verified students. Free under the Pro Education license.",
}

/**
 * /students. Pro Education for verified students, free of charge,
 * under the same terms as Open Source community contributors. The
 * license is MIT, bound to the verified student, and remains valid
 * after graduation for any template downloaded during enrollment.
 */
export default function StudentsPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Students
        </p>
        <h1 className="text-heading-56 tracking-tight">
          DeesseJS Pro, free for students.
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
          Verified students get a DeesseJS Pro license under the Pro Education
          program. The license is MIT, free of charge, and bound to the
          verified student. The access continues for as long as you stay
          enrolled, and stays with you for any template you downloaded before
          graduating.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">What you get</h2>
        <ul className="flex flex-col gap-3">
          {[
            "Lifetime access to every Pro template, including the ones we ship after you verify.",
            "Source code delivered for every Pro template.",
            "Cloud access (auth, repo, CLI clone) for each template.",
            "MIT license, scoped to the verified student.",
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
        <h2 className="text-heading-24 tracking-tight">Verification</h2>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          We accept one of the following:
        </p>
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
          <li className="list-disc">
            A <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-copy-14">.edu</code>{" "}
            email address (or the local equivalent:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-copy-14">.ac.uk</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-copy-14">.edu.au</code>, ...).
          </li>
          <li className="list-disc">
            A school-issued document (student card, enrollment confirmation,
            transcript) at an address that matches your application.
          </li>
        </ul>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          After graduation, the license stays yours for any template you
          downloaded while enrolled. New templates added to the catalog after
          your graduation require a renewed verification.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">What you build</h2>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          Realistic projects for someone learning with DeesseJS Pro:
        </p>
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
          <li className="list-disc">
            Thesis or capstone project with a real backend instead of a
            mock.
          </li>
          <li className="list-disc">
            Side project for a friend, a club, a non-profit.
          </li>
          <li className="list-disc">
            Portfolio piece to show in interviews.
          </li>
          <li className="list-disc">
            Contribution to an open source project that uses DeesseJS.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">How to apply</h2>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          Email{" "}
          <Link
            href="mailto:support@deessejs.com?subject=Pro%20Education%20verification"
            className="underline underline-offset-4 hover:text-foreground"
          >
            support@deessejs.com
          </Link>{" "}
          with the proof above and a GitHub or GitLab username. We reply
          within five business days.
        </p>
      </section>

      <div className="flex">
        <Button asChild>
          <a href="mailto:support@deessejs.com?subject=Pro%20Education%20verification">
            Apply for Pro Education
          </a>
        </Button>
      </div>
    </article>
  )
}
