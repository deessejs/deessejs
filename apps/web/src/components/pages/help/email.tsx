import Link from "next/link"

import { Card } from "@workspace/ui/components/card"

/**
 * /help Email-the-team section.
 *
 * 2-col grid of Cards (one per contact row: General,
 * Security, Pro Education, Enterprise). Each row pairs a
 * `<strong>General:</strong>` label with a mailto: link and
 * a muted caption; the Security row also links to the
 * internal /security page.
 *
 * The Card grid replaces the previous flat-list rendering so
 * the page matches the rest of the marketing app (cards on
 * about/trust, manifesto/beliefs, principles/tenets, vision/
 * horizons).
 */
export function Email() {
  return (
    <section className="space-y-4">
      <h2 className="text-heading-24 tracking-tight text-foreground">
        Email the team
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-copy-16 text-foreground">
            <strong>General:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>
            <span className="text-muted-foreground">
              <br />
              questions, sales, anything else.
            </span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-copy-16 text-foreground">
            <strong>Security:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>
            <span className="text-muted-foreground">
              <br />
              vulnerability reports. See{" "}
              <Link
                href="/security"
                className="underline underline-offset-4 hover:text-foreground"
              >
                security policy
              </Link>{" "}
              for disclosure rules.
            </span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-copy-16 text-foreground">
            <strong>Pro Education:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>
            <span className="text-muted-foreground">
              <br />
              student or OSS verification.
            </span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-copy-16 text-foreground">
            <strong>Enterprise:</strong>{" "}
            <a
              href="mailto:support@deessejs.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground"
            >
              support@deessejs.com
            </a>
            <span className="text-muted-foreground">
              <br />
              custom engagements, procurement.
            </span>
          </p>
        </Card>
      </div>
    </section>
  )
}
