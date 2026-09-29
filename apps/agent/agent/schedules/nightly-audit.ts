import { defineSchedule } from "eve/schedules"

/**
 * Nightly DeesseJS audit.
 *
 * Markdown form: the runtime starts a fresh root session with this prompt.
 * The root agent switches to Job B (audit coordinator) mode and dispatches
 * the specialist subagents.
 *
 * M1 scope: only one subagent (`behavior`) over the single repository
 * named in AUDIT_TARGET_REPOSITORY. M3 will replace this constant with
 * the full enumeration from list_audit_repositories.
 */
export default defineSchedule({
  cron: "0 21 * * *",
  markdown: [
    "audit_context: true",
    "",
    "Run the nightly DeesseJS audit for the repository named in the",
    "AUDIT_TARGET_REPOSITORY environment variable. The audit is currently",
    "in milestone 1: a single specialist (behavior) on a single repository.",
    "",
    "Steps:",
    "1. Read AUDIT_TARGET_REPOSITORY (format 'owner/repo'). If unset, fail",
    "   loudly with a structured error.",
    "2. Read AUDIT_INSTALLATION_ID. If unset, fail loudly.",
    "3. Call checkout_repo with that installationId, repository, and a SHA",
    "   you resolve by reading the repository's main branch through the",
    "   octokit client you have access to.",
    "4. Call the `behavior` subagent with message:",
    "   { installationId, runId, repository, mainSha }",
    "5. After the subagent returns, summarise the run as a JSON object:",
    "   { runId, repository, mainSha, scope, examinedPaths, issuesOpened, notes }",
    "",
    "You must not edit the repository. You must not create issues directly.",
    "Specialists do that through create_audit_issue.",
  ].join("\n"),
})