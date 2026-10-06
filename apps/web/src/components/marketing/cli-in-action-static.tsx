import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * Static, mobile-only version of the CLI workbench.
 *
 * On screens smaller than `lg`, the animated IDE-style panel would
 * be unreadable (file tree + editor + terminal stacked vertically
 * on 390px is too dense). This component renders the same
 * information as a simple 3-cell transformation panel — the same
 * data the workbench shows, just without the animated reveal.
 *
 * It is intentionally a Server Component (no Motion, no state) and
 * is only imported by the `<lg` branch in `cli-in-action.tsx`.
 *
 * Source-of-truth: the Init cell mirrors `apps/cli/src/commands/init.ts`
 * — clone, detect PM, install. The CTA routes to the install guide
 * (the same target as the desktop workbench's CTA).
 */
export function CliInActionStatic({
  command,
  installGuideHref,
}: {
  command: string
  installGuideHref: string
}) {
  return (
    <div className="flex flex-col border border-border bg-background">
      <div className="flex flex-col gap-2 border-b border-border p-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          What this command does
        </p>
        <code className="font-mono text-copy-14 leading-6 text-foreground">
          $ {command}
        </code>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-[2fr_3fr_5fr] md:divide-x md:divide-y-0">
        <div className="flex flex-col gap-3 p-6">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Template
          </p>
          <p className="font-mono text-copy-14 leading-6 text-foreground">
            saas-starter
          </p>
        </div>
        <div className="flex flex-col gap-3 p-6">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Init does
          </p>
          <ol className="flex flex-col gap-2 text-copy-14 leading-6 text-foreground">
            <li>Clone the template repo</li>
            <li>Detect your package manager</li>
            <li>Install dependencies</li>
          </ol>
        </div>
        <div className="flex flex-col gap-3 p-6">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Project
          </p>
          <pre className="overflow-x-auto font-mono text-copy-13 leading-6 text-foreground">
            {`saas-starter/
├── package.json
└── src/`}
          </pre>
          <p className="text-label-13 text-muted-foreground">
            Then run <span className="font-mono">pnpm dev</span>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border p-6">
        <p className="text-label-13 text-muted-foreground">
          Inspect: <span className="font-mono text-foreground">deessejs info saas-starter</span>
        </p>
        <Link
          href={installGuideHref}
          className="inline-flex items-center gap-1.5 text-label-13 font-medium text-foreground hover:underline underline-offset-4"
        >
          Read the CLI guide
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
