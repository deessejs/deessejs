import Link from "next/link"

/**
 * /help Email-the-team section.
 *
 * <ul> of four contact rows (General / Security / Pro Education /
 * Enterprise). Each row pairs a <strong> label with a mailto: link
 * and a muted-foreground qualifier. The Security row also links to
 * the internal /security page.
 *
 * All four rows share `support@deessejs.com` today; the labels
 * disambiguate routing on the team side. Splitting them when the
 * team grows is a copy change only.
 *
 * Rhythm:
 * - Outer `space-y-4` (16px) between heading and the rows list.
 * - Inter-row `space-y-3` (12px) between rows. The prior `gap-2`
 *   (8px) merged the four rows visually into a single block,
 *   especially the Security row which has 5 lines of wrap with
 *   an inline <Link>. 12px keeps each row distinct without
 *   over-spacing the short rows.
 */
export function Email() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Email the team
      </h2>
      <ul className="space-y-3 text-copy-16">
        <li>
          <strong className="text-foreground">General:</strong>{" "}
          <a
            href="mailto:support@deessejs.com"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            support@deessejs.com
          </a>{" "}
          <span className="text-muted-foreground">
            questions, sales, anything else.
          </span>
        </li>
        <li>
          <strong className="text-foreground">Security:</strong>{" "}
          <a
            href="mailto:support@deessejs.com"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            support@deessejs.com
          </a>{" "}
          <span className="text-muted-foreground">
            vulnerability reports. See{" "}
            <Link
              href="/security"
              className="underline underline-offset-4 hover:text-foreground"
            >
              security policy
            </Link>{" "}
            for disclosure rules.
          </span>
        </li>
        <li>
          <strong className="text-foreground">Pro Education:</strong>{" "}
          <a
            href="mailto:support@deessejs.com"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            support@deessejs.com
          </a>{" "}
          <span className="text-muted-foreground">
            student or OSS verification.
          </span>
        </li>
        <li>
          <strong className="text-foreground">Enterprise:</strong>{" "}
          <a
            href="mailto:support@deessejs.com"
            className="text-foreground underline underline-offset-4 hover:text-foreground"
          >
            support@deessejs.com
          </a>{" "}
          <span className="text-muted-foreground">
            custom engagements, procurement.
          </span>
        </li>
      </ul>
    </section>
  )
}
