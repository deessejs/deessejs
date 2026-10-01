import { Card } from "@workspace/ui/components/card"

/**
 * /help Response-times section.
 *
 * Single Card containing a <dl> of three dt/dd pairs (General,
 * Security, Enterprise). Matches the repo convention at
 * `template-detail.tsx:201` and `use-cases/ai-products/page.tsx:359`
 * — <div> wrappers around each dt+dd group are valid in
 * HTML5.2+ and widely supported by screen readers.
 *
 * The body of the dl is text-foreground (was muted), with the
 * <dt> labels emphasized via font-semibold. This rebalances
 * the foreground/muted hierarchy (commit 6 in the same PR) and
 * stops the page reading as washed-out.
 */
export function ResponseTimes() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Response times
      </h2>
      <Card className="p-6">
        <dl className="space-y-4 text-copy-16 text-foreground">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold">General</dt>
            <dd className="text-muted-foreground">
              two business days, Monday through Friday, business hours CET.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold">Security</dt>
            <dd className="text-muted-foreground">
              acknowledged within 24 hours, triage within five business days.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold">Enterprise</dt>
            <dd className="text-muted-foreground">
              two business days for a first reply.
            </dd>
          </div>
        </dl>
      </Card>
    </section>
  )
}
