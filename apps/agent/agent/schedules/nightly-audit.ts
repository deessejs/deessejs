import { defineSchedule } from "eve/schedules"

/**
 * Nightly DeesseJS audit.
 *
 * Markdown form: the runtime starts a fresh root session with this prompt.
 * The root agent switches to Job B (audit coordinator) mode and dispatches
 * the specialist subagents.
 *
 * M1 scope: a single specialist (`behavior`) over the single repository
 * resolved by the `audit-toolkit__get_audit_target` tool. M3 will replace
 * this with the full enumeration from `list_audit_repositories`.
 */
export default defineSchedule({
  cron: "0 21 * * *",
  markdown: [
    "audit_context: true",
    "",
    "Run the nightly DeesseJS audit (M1).",
    "",
    "Steps:",
    "1. Call the `audit-toolkit__get_audit_target` tool. It returns",
    "   { installationId, repository, mainSha } read directly from the",
    "   deployment environment. Do not try to read process.env yourself —",
    "   you have no direct access to it.",
    "2. Dispatch the behavior subagent. Pass this exact message:",
    "   { installationId, repository, mainSha, runId: <the session id> }.",
    "   The specialist owns its own sandbox and inspection. You do not need",
    "   to call checkout_repo yourself; the specialist has it.",
    "3. After the subagent returns, summarise the run as a JSON object:",
    "   { runId, repository, mainSha, scope, examinedPaths, issuesOpened, notes }",
    "",
    "Hard rules:",
    "- Do not edit the repository.",
    "- Do not create issues directly. Only specialists do that.",
    "- Do not invent values for environment variables.",
    "- The root mount has only inventory tools. The full toolkit lives in",
    "  the specialist subagent.",
  ].join("\n"),
})