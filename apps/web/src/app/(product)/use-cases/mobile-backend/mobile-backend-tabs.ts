import type { UseCaseTab } from "../_components/use-case-tabs"

/**
 * Group 1 - the four existing mobile-backend clusters (identity,
 * offline sync, push + realtime, observability), condensed from
 * the inline CAPABILITY_CLUSTERS array.
 *
 * Group 2 - four new "behind the curtain" pillars: App Attest,
 * conflict resolution, targeting query, crash correlation.
 */

export const GROUP_1: ReadonlyArray<UseCaseTab> = [
  {
    slug: "better-auth-session",
    iconName: "Lock",
    title: "Identity across form factors",
    description:
      "The same user table, the same session token, the same org boundary. Phone, web, watch, tablet.",
  },
  {
    slug: "drizzle-offline-queue",
    iconName: "RefreshCw",
    title: "Offline-first sync",
    description:
      "The client can lose the network and still ship work. The server reconciles on reconnect, not on tap.",
  },
  {
    slug: "expo-push-relay",
    iconName: "BellRing",
    title: "Push + realtime channels",
    description:
      "Wake the app for what matters. Don't wake it for what doesn't.",
  },
  {
    slug: "otel-client-span",
    iconName: "Activity",
    title: "Device + network observability",
    description:
      "What happened on the phone, end to end. Same traces as the web app, in the same dashboard.",
  },
]

export const GROUP_2: ReadonlyArray<UseCaseTab> = [
  {
    slug: "app-attest",
    iconName: "ShieldCheck",
    title: "App Attest",
    description:
      "Apple App Attest and Play Integrity stack on the same session validation. Verified against the same auth middleware the rest of the app uses.",
  },
  {
    slug: "conflict-resolve",
    iconName: "RefreshCw",
    title: "Conflict resolution",
    description:
      "Row-level merge on reconnect. The same Drizzle migration runs offline and on the server; both converge on the same schema.",
  },
  {
    slug: "targeting-query",
    iconName: "BellRing",
    title: "Targeting query",
    description:
      "Push targets resolve from the same query layer web push uses. Org, role, last-active, geo. The targeting rules live next to the notification.",
  },
  {
    slug: "crash-correlate",
    iconName: "Activity",
    title: "Crash correlation",
    description:
      "Crash and ANR reports reference the trace id of the failing request. One run, not three, answers why the user got stuck.",
  },
]
