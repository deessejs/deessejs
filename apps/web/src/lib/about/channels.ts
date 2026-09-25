/**
 * /about — Get-in-touch channels.
 *
 * Three purpose-routed channels: GitHub for issues/PRs/discussions,
 * Security for private vulnerability reports, Press & partnerships
 * for anything that doesn't fit the issue tracker. The first is
 * external (renders with target='_blank' rel='noopener noreferrer');
 * the other two are mailto: links.
 */
export type Channel = {
  label: string
  href: string
  body: string
}

export const CHANNELS: ReadonlyArray<Channel> = [
  {
    label: "GitHub",
    href: "https://github.com/deessejs",
    body:
      "Issues, PRs, and discussions live on the deessejs org. The Add Template Issue Template is the entry point for contributing a starter to the registry.",
  },
  {
    label: "Security",
    href: "mailto:support@deessejs.com",
    body:
      "Report a vulnerability privately to support@deessejs.com. Sensitive issues stay out of the public tracker until a fix is ready.",
  },
  {
    label: "Press & partnerships",
    href: "mailto:support@deessejs.com",
    body:
      "For press, conference talks, sponsorship, or anything else where an email beats an issue.",
  },
] as const
