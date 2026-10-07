/**
 * Four proof points shown on the /enterprise page.
 *
 * Each entry pairs a short title with one sentence of body copy.
 * The lucide icon is resolved at render time on the client page —
 * proof-points.tsx is a Server Component and cannot import the
 * icon library directly into data. Keep this file dependency-free.
 */
export type ProofPoint = {
  title: string
  body: string
}

export const PROOF_POINTS: ReadonlyArray<ProofPoint> = [
  {
    title: "Multi-template bundles",
    body: "Pull several Pro templates into a single engagement so the team starts with a coherent stack.",
  },
  {
    title: "Custom scaffolding on top of Pro",
    body: "We extend any Pro template with the pages, fields, and workflows specific to your business.",
  },
  {
    title: "Named engineer for the duration",
    body: "A senior engineer joins your channel for the full engagement. Issues, reviews, and code questions route to a person, not a queue.",
  },
  {
    title: "Procurement-ready invoicing",
    body: "POs, NET-30, signed DPAs, vendor forms, security questionnaires. The paperwork does not slow the work down.",
  },
]
