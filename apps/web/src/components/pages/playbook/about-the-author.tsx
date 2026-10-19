/**
 * /playbook "Why I wrote it" section.
 *
 * First-person paragraph. Plain prose — the page values directness over
 * polish here. No photo, no badge, no statistics; just the working
 * background that explains the point of view.
 *
 * TODO(v0.2): replace the placeholder paragraph with the real author
 * bio once the author copy is finalised. Keep it short — one
 * paragraph, three sentences max, ends on what the reader gets from
 * the playbook rather than who the author is.
 */
export function AboutTheAuthor() {
  return (
    <section
      aria-labelledby="playbook-author-heading"
      className="border-b border-border px-6 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <h2
          id="playbook-author-heading"
          className="text-heading-32 tracking-tight"
        >
          Why I wrote it
        </h2>
        {/* TODO(v0.2): real author bio goes here. */}
        <p className="text-copy-16 leading-7 text-foreground [&:not(:first-child)]:mt-0">
          {/* Placeholder — first-person working note from the author. */}
          [Author bio — TODO. One short paragraph explaining the
          experience behind the playbook and what changed in the way
          you build with agents. End on what the reader takes away
          from the playbook, not on who you are.]
        </p>
      </div>
    </section>
  )
}
