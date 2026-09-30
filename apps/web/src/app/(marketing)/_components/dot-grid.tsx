/**
 * DotGrid — soft dotted background pattern.
 *
 * Renders the home/capability-cluster/surfaces radial-dot pattern as
 * an absolutely-positioned overlay. Replaces the four hand-rolled
 * copies of `bg-[radial-gradient(...)] bg-size-[12px_12px] opacity-60`
 * that lived in hero.tsx, surfaces-tabs.tsx, capability-cluster.tsx
 * and test-mockup.tsx.
 *
 * The pattern itself is intentionally subtle: 1px dots on a 12px
 * grid, rendered in `var(--border)` at 60% opacity so it reads as
 * a quiet texture behind content rather than competing with it.
 * `aria-hidden` because the dots are decorative.
 *
 * Use as a sibling of the content it sits behind:
 *
 *   <div className="relative">
 *     <DotGrid className="absolute inset-0" />
 *     <div className="relative">...content...</div>
 *   </div>
 */
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={
        "bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" +
        (className ? ` ${className}` : "")
      }
    />
  )
}
