import { Section } from "@/app/(marketing)/_components/section"
import { CliInActionPanel } from "@/app/(marketing)/_components/cli-in-action-panel"

const COMMAND = "deessejs init saas-starter"
const INSTALL_GUIDE_HREF = "/knowledge-base/guides/install-deessejs-cli"

/**
 * CLI section on the marketing homepage.
 *
 * Replaces the previous "terminal mockup + 3 commands" layout. The
 * section now demonstrates the CLI as a transformation pipeline —
 * the new <CliInActionPanel> shows the canonical `deessejs init
 * saas-starter` command (matching `apps/cli/src/commands/init.ts`),
 * what it does in three steps (clone, detect PM, install), and the
 * project layout it produces. Below the panel, `deessejs info` is
 * positioned as the post-init inspection command, consistent with
 * `apps/cli/src/commands/info.ts`.
 *
 * Layout: editorial column on the left (eyebrow + title + subtitle
 * + CTA), full-width panel on the right on lg+, stacked above the
 * panel below lg.
 */
export function CliInAction() {
  return (
    <Section>
      <div className="grid grid-cols-1 gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10 lg:p-10">
        <div className="flex flex-col gap-4">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            The DeesseJS CLI
          </p>
          <h2 className="text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            From registry to working project.
          </h2>
          <p className="text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Choose a template, initialize it with the CLI, then inspect
            the result.
          </p>
        </div>

        <CliInActionPanel
          command={COMMAND}
          installGuideHref={INSTALL_GUIDE_HREF}
        />
      </div>
    </Section>
  )
}
