/**
 * /help Response-times section.
 *
 * <dl> of three dt/dd pairs. Matches the repo convention at
 * `template-detail.tsx:201` and `use-cases/ai-products/page.tsx:359`
 * — <div> wrappers around each dt+dd group are valid in HTML5.2+
 * and widely supported by screen readers.
 */
export function ResponseTimes() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        Response times
      </h2>
      <dl className="flex flex-col gap-2 text-copy-16 text-muted-foreground">
        <div>
          <dt className="font-semibold text-foreground">General</dt>
          <dd>
            two business days, Monday through Friday, business hours CET.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Security</dt>
          <dd>acknowledged within 24 hours, triage within five business days.</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Enterprise</dt>
          <dd>two business days for a first reply.</dd>
        </div>
      </dl>
    </section>
  )
}
