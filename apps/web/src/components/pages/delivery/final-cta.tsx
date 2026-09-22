/**
 * Final CTA. Single CTA, no Install CLI / Browse registry.
 *
 * The /delivery page sells engineering services to CTOs. Linking
 * to self-service products at the bottom (the pattern used on
 * /pricing) would undermine the engagement promise. The CTA here
 * is a single mailto to the engineering team.
 */
export function FinalCta() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
      <div className="flex flex-col gap-4 p-6 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Ready to ship?
        </p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
          Skip 3 months of senior engineer salary.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
          Book a 20-minute scoping call. We scope the engagement in
          plain English, you decide. No proposal deck, no obligation.
        </p>
      </div>
      <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
        <a
          href="mailto:support@deessejs.com?subject=Delivery%20scoping%20call"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
        >
          Book an Engineering Scoping Call
        </a>
      </div>
    </div>
  )
}
