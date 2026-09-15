/**
 * Three-step process timeline for the /enterprise page.
 *
 * Mirrors the changelog timeline pattern (vertical / horizontal
 * orientation per breakpoint) so it stays visually consistent with
 * the rest of the marketing surface.
 */
export type ProcessStep = {
  step: string
  title: string
  body: string
}

export const PROCESS_STEPS: ReadonlyArray<ProcessStep> = [
  {
    step: "01",
    title: "Tell us what you are building",
    body: "Four fields, two minutes. We reply with a scope within two business days.",
  },
  {
    step: "02",
    title: "Scope signed within three business days",
    body: "We agree on deliverables, timeline, and engagement size. NDAs, DPAs, and procurement paperwork happen in parallel with the kickoff, not before it.",
  },
  {
    step: "03",
    title: "Ship on a cadence your team can review",
    body: "Templates land in your repository on a fixed cadence. You review, we iterate. The handover at the end is a clean codebase, not a wiki.",
  },
]
