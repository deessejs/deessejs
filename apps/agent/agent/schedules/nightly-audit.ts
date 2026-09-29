import { defineSchedule } from "eve/schedules"

/**
 * Nightly DeesseJS audit.
 *
 * Markdown form: the runtime starts a fresh root session with this
 * prompt. The \`audit_context: true\` marker in the first line is what
 * the root agent's instructions.md reads to decide Job A vs Job B, and
 * is what the behaviour subagent's defineDynamic resolver keys on to
 * decide whether to expose itself to the parent model.
 *
 * M1 scope: a single specialist (\`behavior\`) over the single
 * repository resolved by the \`audit-toolkit__get_audit_target\` tool.
 * M3 will replace this with the full enumeration from
 * \`list_audit_repositories\`.
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
    "   { installationId, repository, mainSha }. The specialist owns its",
    "   own sandbox and inspection. You do not need to call checkout_repo",
    "   yourself; the specialist has it.",
    "3. After the subagent returns, summarise the run as a JSON object:",
    "   { repository, mainSha, scope, examinedPaths, issuesOpened, notes }",
    "",
    "Hard rules:",
    "- Do not edit the repository.",
    "- Do not create issues directly. Only specialists do that.",
    "- Do not invent values for environment variables.",
    "- The root mount has only inventory tools. The full toolkit lives in",
    "  the specialist subagent, which is only exposed to you in this",
    "  session because the runtime is your principal.",
  ].join("\n"),
})