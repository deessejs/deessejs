/**
 * Knowledge retrieval — first version.
 *
 * Mini render of a search-on-indexed-docs surface:
 *   - top: query input row (typed question)
 *   - middle: 4 chunk rows, each scored against the query
 *   - bottom: action affordance (use / re-query)
 *
 * Static. Reads as "this is what your agent sees when it
 * searches your indexed docs". Score uses emerald for the
 * top match and zinc for the rest so the eye lands on the
 * best answer.
 */

const QUERY = "how does billing handle dunning"

const CHUNKS = [
  { id: "kb_8821", snippet: "dunning sequence runs every 48h...", score: 0.94 },
  { id: "kb_8810", snippet: "Failed charges retry after 24h...", score: 0.78 },
  { id: "kb_8798", snippet: "Customer portal shows invoice history.", score: 0.61 },
  { id: "kb_8754", snippet: "Webhook fires on subscription.cancel.", score: 0.42 },
] as const

const SCORE_COLOR = (s: number) =>
  s >= 0.9
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-muted-foreground"

export function KnowledgeRetrievalMockup() {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between border-b border-border pb-2 font-mono text-[11px]">
        <span className="text-muted-foreground">query</span>
        <span className="ml-3 truncate text-foreground">{QUERY}</span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {CHUNKS.map((chunk) => (
          <li
            key={chunk.id}
            className="flex items-start gap-2 py-2 leading-5 font-mono text-[11px]"
          >
            <span className="w-14 shrink-0 text-muted-foreground">
              {chunk.id}
            </span>
            <span className="flex-1 truncate text-foreground">
              {chunk.snippet}
            </span>
            <span
              className={`w-12 shrink-0 text-right ${SCORE_COLOR(chunk.score)}`}
            >
              {(chunk.score * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
