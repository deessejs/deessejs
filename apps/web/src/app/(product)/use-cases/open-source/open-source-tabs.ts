import type { UseCaseTab } from "../_components/use-case-tabs"

/**
 * Group 1 - the four existing open-source clusters (license +
 * changelog, public registry CLI, community shapes, release
 * automation), condensed from the inline CAPABILITY_CLUSTERS
 * array.
 *
 * Group 2 - four new "behind the curtain" pillars: conventional
 * commits, deessejs update, CODEOWNERS routing, semver bump.
 */

export const GROUP_1: ReadonlyArray<UseCaseTab> = [
  {
    slug: "conventional-commits",
    iconName: "FileCode",
    title: "License + changelog, day one",
    description:
      "The two things every real OSS project has, written into the template from the first commit.",
  },
  {
    slug: "deessejs-init",
    iconName: "Package",
    title: "The public registry CLI",
    description:
      "Users install with one command and update with the same. They never need to learn the internal toolchain.",
  },
  {
    slug: "agents-md",
    iconName: "Users",
    title: "Same shape across contributors",
    description:
      "A PR from outside the team lands in the same shape as one from inside. Conventions outlive the original author.",
  },
  {
    slug: "changeset-release",
    iconName: "GitBranch",
    title: "Releases that don't break",
    description:
      "Tagged, tested, and announced through the channels the project already uses. No release-day scramble.",
  },
]

export const GROUP_2: ReadonlyArray<UseCaseTab> = [
  {
    slug: "license-check",
    iconName: "FileCode",
    title: "License check",
    description:
      "Registry-side license audit on every template acceptance. MIT baked in by the time the template ships, not added by hand later.",
  },
  {
    slug: "deessejs-update",
    iconName: "Package",
    title: "deessejs update",
    description:
      "Versioned updates through the same path as the install. No separate upgrade ritual, no manual migration steps.",
  },
  {
    slug: "codeowners-route",
    iconName: "Users",
    title: "CODEOWNERS routing",
    description:
      "Each area has an owner. An outside PR to the auth layer waits for a maintainer who knows auth, not a stranger.",
  },
  {
    slug: "semver-bump",
    iconName: "GitBranch",
    title: "Semver bump",
    description:
      "Major, minor, patch — enforced at the registry level from the changeset content. A feat with a breaking change bumps major.",
  },
]
