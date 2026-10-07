/**
 * Comparatif "Agence traditionnelle vs DeesseJS Delivery".
 *
 * 5 rows, each one killing a specific CTO objection to buying
 * engineering services. The DeesseJS column is in `text-foreground
 * font-semibold` to visually anchor the right side as the
 * recommended option.
 */
type ComparisonRow = {
  criterion: string
  agency: string
  delivery: string
}

const ROWS: ReadonlyArray<ComparisonRow> = [
  {
    criterion: "Delivery timeline",
    agency: "3 to 6 months",
    delivery: "2 to 4 weeks",
  },
  {
    criterion: "Who writes the code",
    agency: "Juniors managed by sales reps",
    delivery: "Dedicated senior engineer",
  },
  {
    criterion: "Technical stack",
    agency: "WordPress patchwork / disparate frameworks",
    delivery: "Modern TypeScript, typed end-to-end and audited",
  },
  {
    criterion: "Technical debt",
    agency: "High. Throwaway code, third-party plugins",
    delivery: "Zero. Modular codebase built on our RFCs",
  },
  {
    criterion: "Final handover",
    agency: "A 40-page Notion wiki, out of date on day one",
    delivery: "A clean Git repository with CI/CD and tests",
  },
]

export function Comparison() {
  return (
    <div className="border-b border-border">
      <div className="flex flex-col gap-6 p-6 lg:p-10">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Why delivery, not an agency
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
            The engineering services you actually want to buy.
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
            Side-by-side: a traditional web agency versus DeesseJS
            Delivery. The difference is engineering, not agency
            theater.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-copy-14">
            <thead>
              <tr className="border-b border-border">
                <th className="w-1/4 py-3 pr-4 font-semibold text-foreground">
                  Criterion
                </th>
                <th className="w-2/5 py-3 pr-4 font-semibold text-muted-foreground">
                  Traditional agency
                </th>
                <th className="w-2/5 py-3 pr-4 font-semibold text-foreground">
                  DeesseJS Delivery
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, index) => (
                <tr
                  key={row.criterion}
                  className={
                    index < ROWS.length - 1 ? "border-b border-border/60" : ""
                  }
                >
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left align-top font-medium text-foreground"
                  >
                    {row.criterion}
                  </th>
                  <td className="py-3 px-4 align-top text-muted-foreground">
                    {row.agency}
                  </td>
                  <td className="py-3 px-4 align-top font-semibold text-foreground">
                    {row.delivery}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
