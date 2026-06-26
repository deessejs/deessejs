import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@workspace/ui/components/ui/button";

/**
 * ArticleCta — closing call-to-action block at the bottom of every article
 * (blog post + changelog release).
 *
 * Sits below the "Related reading" section. The glow + centered headline
 * pattern is reused from the home page CTA (see apps/web/src/app/(unprotected)/(marketing)/page.tsx).
 *
 * Two actions:
 * - Primary: "Get DeesseJS" → /pricing
 * - Secondary: "Read the docs" → /docs
 *
 * Both target the conversion surface. The agentic copy is intentional —
 * "Build on the template your agents run on" reinforces the wedge.
 */
export function ArticleCta() {
  return (
    <section className="relative mt-16 overflow-hidden rounded-xl border border-border/40 bg-card/30 px-6 py-10 text-center sm:px-10 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/10 opacity-40 blur-[80px]"
      />

      <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Build on the template your agents run on.
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-pretty text-sm text-muted-foreground">
        Auth, billing, jobs, storage, notifications, API — every surface your
        agents need, wired from day one. 14-day money-back guarantee.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button
          size="sm"
          className="h-9 gap-1.5 rounded-full px-5 text-sm font-semibold shadow-sm transition-transform hover:scale-105"
          nativeButton={false}
          render={<Link href="/pricing" />}
        >
          Get DeesseJS
          <ArrowRight className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-1.5 rounded-full px-5 text-sm font-medium shadow-sm backdrop-blur-md"
          nativeButton={false}
          render={<Link href="/docs" />}
        >
          <BookOpen className="size-3.5" />
          Read the docs
        </Button>
      </div>
    </section>
  );
}