import type { Metadata } from "next"
import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Customers",
  description:
    "Teams building on DeesseJS. Customer stories will land here as we publish them.",
}

/**
 * /customers.
 *
 * Honest placeholder. We do not publish customer stories until we have
 * shipped a few. When a story lands it covers: what the team was
 * building, the templates they used, what they replaced, the outcome.
 */
export default function CustomersPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col gap-4">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Customers
        </p>
        <h1 className="text-heading-56 tracking-tight">
          Teams building on DeesseJS.
        </h1>
        <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
          Customer stories will land here as we publish them. A story covers
          what the team was building, the templates they used, what they
          replaced, and the outcome.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">What this page is, and is not</h2>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          We are not publishing customer stories yet. The reason is simple:
          we want the first ones to be honest, with real numbers from teams
          who chose DeesseJS Pro and shipped something on top of it. A
          placeholder full of fake logos and quote blocks is the opposite of
          what we want on this page.
        </p>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          When a story lands, it will:
        </p>
        <ul className="flex flex-col gap-2 pl-4 text-copy-16 text-muted-foreground">
          <li className="list-disc">
            Name the team and the product they shipped.
          </li>
          <li className="list-disc">
            List the Pro templates they used and what they replaced.
          </li>
          <li className="list-disc">
            Show the outcome with concrete numbers where the team agrees to
            share them.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-24 tracking-tight">Get notified</h2>
        <p className="text-copy-16 text-foreground [&:not(:first-child)]:mt-0">
          If you want a heads-up when a story lands, drop us an email. No
          newsletter, no list, just a one-line note when there is something
          worth reading.
        </p>
        <div>
          <Button asChild>
            <a href="mailto:support@deessejs.com?subject=Customer%20story%20notification">
              Email me when a story lands
            </a>
          </Button>
        </div>
      </section>
    </article>
  )
}
