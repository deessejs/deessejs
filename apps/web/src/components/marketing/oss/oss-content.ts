/**
 * `/oss` content data. Four `what-you-get` benefits, four `eligibility`
 * rules, three `apply` steps. Kept local to the page so the route
 * stays self-contained and so the copy is the single source of truth
 * (no shared abstraction across program pages yet; if a third
 * program page ships, extract).
 */

export const WHAT_YOU_GET = [
  {
    title: "Lifetime access",
    body: "to the full Pro catalog, including future templates shipped after your license is granted.",
  },
  {
    title: "Source code",
    body: "delivered for every Pro template you download. No obfuscation, no runtime-only builds.",
  },
  {
    title: "Cloud access",
    body: "auth, repo, and CLI clone for each template. The CLI works against your local checkout once you scaffold.",
  },
  {
    title: "MIT license",
    body: "scoped to the named project. A maintainer change does not invalidate the license.",
  },
] as const

export const ELIGIBILITY = [
  {
    title: "Public repo",
    body: "with at least one tagged release. The license binds to the public project, not a private fork.",
  },
  {
    title: "Active maintenance",
    body: "commits, releases, or issue triage within the last six months.",
  },
  {
    title: "Listed in maintainer file",
    body: "OWNERS, CODEOWNERS, or the equivalent maintainer file in the repo.",
  },
  {
    title: "Scoped to the project",
    body: "the license does not cover other projects owned by the same maintainer, and does not transfer to a third party who is not an OSS contributor.",
  },
] as const

export const APPLY_STEPS = [
  {
    heading: "Email",
    body: "Send the repo URL and a one-sentence description to support@deessejs.com.",
  },
  {
    heading: "Reply",
    body: "We reply within five business days with a license file scoped to the project.",
  },
  {
    heading: "Commit",
    body: "Commit the license file alongside the project so future maintainers see it.",
  },
] as const