/**
 * /delivery page hero. Single column, centered, eyebrow + h1 +
 * lead + CTA. Same shape as `/enterprise` Hero but with delivery-
 * specific copy: "Production delivery backed by the team that
 * built the engine." positions the engagement as a direct
 * extension of the Pro templates, not a parallel agency offering.
 */
export function Hero() {
  return (
    <div className="flex flex-col items-center gap-6 border-b border-border p-6 text-center lg:p-16">
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <p className="text-label-13 tracking-wider text-muted-foreground uppercase">
          Delivery
        </p>
        <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56 [&:not(:first-child)]:mt-0">
          Production delivery backed by the team that built the engine.
        </h1>
        <p className="max-w-2xl text-copy-18 leading-7 text-balance text-muted-foreground sm:text-copy-20 [&:not(:first-child)]:mt-0">
          We take your specific business logic, data models, and workflows, and
          scaffold them directly on top of our Pro architectures. You get a
          production-ready codebase deployed on your own infrastructure.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#intake"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Book an Engineering Scoping Call (20 min)
          </a>
        </div>
      </div>
    </div>
  )
}
