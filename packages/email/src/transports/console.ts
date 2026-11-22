import { render } from "@react-email/render"
import { appendFileSync, chmodSync, mkdirSync } from "node:fs"
import path from "node:path"
import type { MailerTransport, SendArgs } from "../types.js"

/**
 * Dev default — no infrastructure.
 *
 * Renders the React Email tree to plain-text and logs a structured,
 * grep-friendly summary to stdout. The dev copies the magic link from the
 * terminal and pastes it in the browser.
 *
 * Trade-offs accepted (see mailer.md §5.3):
 *   - No HTML rendering preview — we show the plain-text rendering, not
 *     styled HTML
 *   - No "click in the email" — must copy-paste the URL
 *   - No REST API for test assertions — use vi.spyOn(mailer, "send")
 */

const URL_REGEX = /https?:\/\/[^\s)>"']+/g
const PREVIEW_LIMIT = 15

export class ConsoleTransport implements MailerTransport {
  constructor(private readonly opts: { from: string }) {}

  async send(args: SendArgs): Promise<{ id: string }> {
    console.log(
      "[DEBUG] ConsoleTransport.send() called — subject:",
      args.subject,
      "| has react:",
      !!args.react
    )
    const to = Array.isArray(args.to) ? args.to.join(", ") : args.to
    const tagStr = args.tags?.map((t) => `${t.name}=${t.value}`).join(" ") ?? ""

    // Render the React tree to plain-text so we can extract links and show
    // a readable preview. If rendering fails (e.g. malformed template), fall
    // back to logging what we have rather than swallowing the error.
    let plainText = ""
    try {
      plainText = args.react
        ? await render(args.react, { plainText: true })
        : (args.text ?? args.html ?? "")
    } catch {
      plainText = args.text ?? args.html ?? ""
    }

    console.log(
      "[DEBUG] ConsoleTransport.render() completed, plainText length:",
      plainText.length
    )
    // Extract the first URL from the rendered text. For the 2 templates we
    // ship (verify-email, reset-password), the magic link is the primary
    // CTA button href, which appears first in the plain-text output.
    const links = plainText.match(URL_REGEX) ?? []
    const primaryLink = links[0]

    // The local agent bootstrap needs to complete Better Auth verification
    // without reading terminal output. Keep this mailbox opt-in, worktree
    // confined, and unavailable outside development.
    const worktreeRoot = process.env.DEV_AGENT_WORKTREE_ROOT
    const worktreeId = process.env.DEV_AGENT_WORKTREE_ID
    const mailboxFile = process.env.DEV_AGENT_MAILBOX_FILE
    if (
      process.env.NODE_ENV === "development" &&
      worktreeRoot &&
      /^[a-f0-9]{12}$/.test(worktreeId ?? "") &&
      mailboxFile === path.join(worktreeRoot, ".local", "mailbox.jsonl") &&
      primaryLink
    ) {
      const localDir = path.join(worktreeRoot, ".local")
      mkdirSync(localDir, { recursive: true, mode: 0o700 })
      chmodSync(localDir, 0o700)
      appendFileSync(
        mailboxFile,
        `${JSON.stringify({ to, subject: args.subject, url: primaryLink })}\n`,
        { mode: 0o600 }
      )
      chmodSync(mailboxFile, 0o600)
    }

    const headerLines = [
      `[mailer] ┌─ email ─────────────────────────────────────────`,
      `[mailer] │ to:        ${to}`,
      `[mailer] │ from:      ${this.opts.from}`,
      `[mailer] │ subject:   ${args.subject}`,
      args.idempotencyKey
        ? `[mailer] │ idempotent: ${args.idempotencyKey}`
        : null,
      tagStr ? `[mailer] │ tags:      ${tagStr}` : null,
      primaryLink ? `[mailer] │ link:      ${primaryLink}   ← copy me` : null,
      `[mailer] │`,
      `[mailer] │ preview (first ${PREVIEW_LIMIT} lines):`,
    ].filter((line): line is string => line !== null)

    const previewLines = plainText
      .split("\n")
      .slice(0, PREVIEW_LIMIT)
      .map((line) => `[mailer] │   ${line}`)

    const footerLine = `[mailer] └──────────────────────────────────────────────────`

    console.log([...headerLines, ...previewLines, footerLine].join("\n"))

    return { id: `console-${Date.now()}` }
  }
}
