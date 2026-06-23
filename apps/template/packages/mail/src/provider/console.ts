/**
 * `ConsoleMailer` — logs the mail payload to stdout. No network.
 * Used in local dev (when `RESEND_API_KEY` is missing) and for
 * debugging send calls without spamming real recipients.
 *
 * Beyond the metadata, we also render the React component to HTML and
 * extract absolute URLs — this lets the dev click verification /
 * password-reset links directly from the terminal output. Without
 * this, the React tree is opaque (it gets `'<ReactNode>'` in the
 * JSON dump) and the end-to-end dev flow is unclickable.
 *
 * The HTML payload itself is truncated to 2 KB to keep the log
 * readable — for full HTML, call `renderHtml()` from the test infra.
 */

import type { Mailer, MailerSendInput, MailerSendResult } from './types'
import { renderHtml } from '../render'

const HTML_LOG_LIMIT = 2_000

/** Match absolute http(s) URLs. Stops at the first whitespace, quote, or `>`. */
const URL_PATTERN = /https?:\/\/[^\s<>"')]+/g

/**
 * Decode the 5 HTML entities that show up in URLs inside an `href`
 * attribute. `&amp;` is the one we actually hit in dev (the React
 * Email renderer escapes `&` in URLs to `&amp;` to keep the HTML
 * valid). Without this, links extracted from the rendered HTML carry
 * the literal entity and break the query string when pasted in a
 * browser URL bar.
 */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractLinks(html: string): string[] {
  const seen = new Set<string>()
  for (const match of html.matchAll(URL_PATTERN)) {
    // Trim trailing punctuation that's almost never part of the URL itself
    // (periods, commas, parens, brackets from surrounding prose).
    const url = decodeHtmlEntities(match[0]).replace(/[.,)\]]+$/, '')
    seen.add(url)
  }
  return [...seen]
}

export class ConsoleMailer implements Mailer {
  async send(input: MailerSendInput): Promise<MailerSendResult> {
    const { to, subject, replyTo, idempotencyKey } = input

    // Render the React tree so we can surface clickable links in the log.
    // Failures here are non-fatal: the mail is conceptually "sent", we
    // just can't render a preview. Log the error and fall through.
    let links: string[] = []
    let htmlPreview: string | null = null
    try {
      const html = await renderHtml(input.react)
      links = extractLinks(html)
      htmlPreview = html.length > HTML_LOG_LIMIT
        ? html.slice(0, HTML_LOG_LIMIT) + `\n... [truncated ${html.length - HTML_LOG_LIMIT} chars]`
        : html
    } catch (err) {
      htmlPreview = `<render error: ${err instanceof Error ? err.message : String(err)}>`
    }

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          level: 'info',
          provider: 'console',
          to,
          subject,
          replyTo,
          idempotencyKey,
          // The clickable links — these are what you copy/paste in dev.
          links,
          // Truncated HTML for visual inspection. Use `renderHtml()` in
          // tests for the full output.
          html: htmlPreview,
          text: input.text ?? null,
        },
        null,
        2,
      ),
    )
    return { id: `console-${crypto.randomUUID()}` }
  }
}
