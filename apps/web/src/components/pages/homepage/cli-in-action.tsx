import { Section } from "@/app/(marketing)/_components/section"
import { CliWorkbench } from "@/app/(marketing)/_components/cli-workbench"
import { CliInActionStatic } from "@/app/(marketing)/_components/cli-in-action-static"

const COMMAND = "deessejs init saas-starter"
const INSTALL_GUIDE_HREF = "/knowledge-base/guides/install-deessejs-cli"

/**
 * CLI section on the marketing homepage.
 *
 * Layout split:
 *   • `lg+`  : editorial column (4/12) + animated IDE workbench (8/12).
 *              The workbench shows the full transformation in a
 *              single frame — Explorer / Editor / Terminal —
 *              choreographed by Motion on viewport entry, plays once,
 *              respects `prefers-reduced-motion`.
 *   • `<lg`  : editorial + static 3-cell transformation panel
 *              (`<CliInActionStatic>`). The IDE-style panel is too
 *              dense to read on small screens; the static panel
 *              carries the same information in a simpler shape.
 *
 * Both branches share the canonical command (`deessejs init
 * saas-starter`, matching `apps/cli/src/commands/init.ts`) and the
 * install guide CTA. Neither shows a copy-button: the terminal's
 * purpose is to show the command being *run*, not to be a copy
 * affordance — the install guide is the explicit copy-on-demand
 * destination.
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

        {/* Desktop: animated workbench */}
        <div className="hidden lg:block">
          <CliWorkbench />
        </div>

        {/* Mobile + tablet: static panel */}
        <div className="block lg:hidden">
          <CliInActionStatic
            command={COMMAND}
            installGuideHref={INSTALL_GUIDE_HREF}
          />
        </div>
      </div>
    </Section>
  )
}
