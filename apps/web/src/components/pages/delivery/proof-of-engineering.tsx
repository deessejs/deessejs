import { cn } from "@workspace/ui/lib/utils"

import { PROOF_OF_ENGINEERING, type ProofItem } from "@/lib/delivery/proof-of-engineering"

/**
 * Six standards every delivery engagement is held to.
 *
 * 3-col grid (2 rows × 3 items on md+). Each cell pairs a
 * short label with one sentence of detail. Monospace label
 * for the engineering-manifesto feel; no icons, no decorative
 * lines.
 */
export function ProofOfEngineering() {
  return (
    <div className="border-b border-border">
      <div className="flex flex-col gap-6 p-6 lg:p-10">
        <header className="flex flex-col gap-2">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Proof of engineering
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
            The standards we hold every deliverable to.
          </h2>
        </header>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border md:divide-y divide-border">
          {PROOF_OF_ENGINEERING.map((item, index) => (
            <ProofCell
              key={item.label}
              item={item}
              isLast={index === PROOF_OF_ENGINEERING.length - 1}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

function ProofCell({
  item,
  isLast,
}: {
  item: ProofItem
  isLast: boolean
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 p-5 lg:p-6 transition-colors hover:bg-accent/40",
        !isLast && "md:border-r md:border-border",
      )}
    >
      <span className="font-mono text-label-13 uppercase tracking-wider text-foreground">
        {item.label}
      </span>
      <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        {item.detail}
      </p>
    </li>
  )
}
