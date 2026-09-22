import Link from "next/link"
import { ArrowRight, Globe } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { Section } from "@/app/(marketing)/_components/section"

/**
 * Final CTA — 2-col shared-border block with copy + actions.
 *
 * The `border-b-0` override drops the trailing divider so the page
 * ends flush with the `GlobalLayout` border-card. All other sections
 * keep the default `border-b border-border` from `<Section>`.
 */
export function FinalCta() {
  return (
    <Section className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border border-b-0">
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <p className="text-label-13 text-muted-foreground">Ready to ship?</p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
          Use the templates. Or ship with us.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
          Install the CLI to scaffold a project in under five minutes. Or
          talk to our delivery team. Same templates, same contracts, same
          guarantees.
        </p>
      </div>
      <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
        <Button asChild size="lg">
          <Link href="/knowledge-base/guides/install-deessejs-cli">
            Install the CLI
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/delivery">Talk to delivery</Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link href="/templates">Browse the registry</Link>
        </Button>
        <p className="text-copy-13-mono text-muted-foreground inline-flex items-center gap-2 pt-1">
          <Globe className="size-3.5" aria-hidden />
          <Link
            href="https://github.com/deessejs"
            className="underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/deessejs
          </Link>
        </p>
      </div>
    </Section>
  )
}
