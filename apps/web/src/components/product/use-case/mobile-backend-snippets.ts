/**
 * Mobile backend pillar code snippets - server-only module.
 *
 * Eight TypeScript samples for the mobile backend use case
 * (`/use-cases/mobile-backend`): the four existing clusters
 * (Identity, Offline sync, Push + realtime, Observability)
 * plus four new "behind the curtain" pillars (App Attest,
 * Conflict resolution, Targeting query, Crash correlation).
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side via `codeToHtml`; the strings never ship in the
 * client's JS bundle.
 *
 * Snippets are illustrative. Real public API may differ.
 */

export type MobileBackendPillarSlug =
  | "better-auth-session"
  | "drizzle-offline-queue"
  | "expo-push-relay"
  | "otel-client-span"
  | "app-attest"
  | "conflict-resolve"
  | "targeting-query"
  | "crash-correlate"

export type MobileBackendPillarSnippet = {
  tabName: string
  lang: "typescript"
  code: string
}

export type MobileBackendPillarTool = {
  files: ReadonlyArray<MobileBackendPillarSnippet>
}

const betterAuthSessionFile: MobileBackendPillarSnippet = {
  tabName: "auth.session.ts",
  lang: "typescript",
  code: `import { validateSession } from "@workspace/auth"

export const sessionFromDevice = (token: string) =>
  validateSession(token, {
    audience: "mobile",
    deviceBound: true,
  })`,
}

const drizzleOfflineQueueFile: MobileBackendPillarSnippet = {
  tabName: "drizzle.cache.ts",
  lang: "typescript",
  code: `import { db } from "@workspace/database"

export const cacheForDevice = (orgId: string) =>
  db.query.documents.findMany({
    where: (d, { eq }) => eq(d.orgId, orgId),
    cache: { ttlSeconds: 300, key: \`device:\${orgId}\` },
  })`,
}

const expoPushRelayFile: MobileBackendPillarSnippet = {
  tabName: "push.relay.ts",
  lang: "typescript",
  code: `import { Expo } from "expo-server-sdk"
import { sendEmail } from "@workspace/email"

const expo = new Expo()

export const notify = async (input: { to: string; title: string; body: string }) => {
  if (Expo.isExpoPushToken(input.to)) {
    await expo.sendPushNotificationsAsync([{ to: input.to, title: input.title, body: input.body }])
  } else {
    await sendEmail({ to: input.to, subject: input.title, text: input.body })
  }
}`,
}

const otelClientSpanFile: MobileBackendPillarSnippet = {
  tabName: "otel.client.ts",
  lang: "typescript",
  code: `import { trace } from "@opentelemetry/api"

const tracer = trace.getTracer("mobile")

export const span = <T>(name: string, fn: () => Promise<T>) =>
  tracer.startActiveSpan(name, async (span) => {
    span.setAttribute("device.platform", process.env.EXPO_OS ?? "unknown")
    try {
      return await fn()
    } finally {
      span.end()
    }
  })`,
}

const appAttestFile: MobileBackendPillarSnippet = {
  tabName: "app-attest.ts",
  lang: "typescript",
  code: `import { verifyAttestation } from "@workspace/auth"

export const verifyDevice = (input: {
  attestation: Buffer
  keyId: string
  challenge: string
}) =>
  verifyAttestation({
    platform: "apple",
    ...input,
  })`,
}

const conflictResolveFile: MobileBackendPillarSnippet = {
  tabName: "conflict-resolve.ts",
  lang: "typescript",
  code: `import { reconcile } from "@workspace/database"

export const replay = (input: { orgId: string; offlineOps: Op[] }) =>
  reconcile(input.orgId, input.offlineOps, {
    strategy: "row-level-merge",
    onConflict: "last-write-wins-per-column",
  })`,
}

const targetingQueryFile: MobileBackendPillarSnippet = {
  tabName: "targeting-query.ts",
  lang: "typescript",
  code: `import { sql } from "drizzle-orm"
import { db } from "@workspace/database"

export const devicesInSegment = (segment: { role?: string; geo?: string }) =>
  db.execute(sql\`
    SELECT id FROM devices
    WHERE (\${segment.role ?? null} IS NULL OR role = \${segment.role})
      AND (\${segment.geo ?? null} IS NULL OR country = \${segment.geo})
  \`)`,
}

const crashCorrelateFile: MobileBackendPillarSnippet = {
  tabName: "crash-correlate.ts",
  lang: "typescript",
  code: `import { recordCrash } from "@workspace/contracts"

export const reportCrash = (input: {
  traceId: string
  stack: string
  userId: string
}) =>
  recordCrash({
    ...input,
    linkedSpan: \`trace:\${input.traceId}\`,
  })`,
}

export const MOBILE_BACKEND_SNIPPETS: Record<MobileBackendPillarSlug, MobileBackendPillarTool> = {
  "better-auth-session":  { files: [betterAuthSessionFile] },
  "drizzle-offline-queue":{ files: [drizzleOfflineQueueFile] },
  "expo-push-relay":      { files: [expoPushRelayFile] },
  "otel-client-span":     { files: [otelClientSpanFile] },
  "app-attest":           { files: [appAttestFile] },
  "conflict-resolve":     { files: [conflictResolveFile] },
  "targeting-query":      { files: [targetingQueryFile] },
  "crash-correlate":      { files: [crashCorrelateFile] },
}
