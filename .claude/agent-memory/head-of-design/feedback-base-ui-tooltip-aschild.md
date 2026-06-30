---
name: feedback-base-ui-tooltip-aschild
description: shadcn v4 base-nova TooltipTrigger wraps its child as a <button> — passing asChild=true OR nesting any <button> inside causes a hydration error ("button cannot be a descendant of button")
metadata:
  type: feedback
---

Base UI's `TooltipTrigger` renders a `<button>` by default. Unlike Radix (which has `asChild` to forward the trigger onto the child), Base UI's trigger is always a button — the child is just content inside the button.

**Symptom:** In dev / production:

> [browser] In HTML, `<button>` cannot be a descendant of `<button>`. This will cause a hydration error.

**Cause:** Any of:

1. `<TooltipTrigger asChild><button>...</button></TooltipTrigger>` — the `asChild` prop does not exist in Base UI, so TS will reject it; if you bypass with `as any`, you get a nested button.
2. `<TooltipTrigger><button onClick={...}>...</button></TooltipTrigger>` — the inner `<button>` is nested inside Base UI's own button.
3. Same gotcha applies to `TooltipTrigger` wrapping `<a>` rendered as button via `render` — keep inner element to a `<span>` or plain text.

**Fix:** Drop the inner `<button>`. Move classes + content directly to `TooltipTrigger`:

```tsx
<Tooltip>
  <TooltipTrigger className="cursor-help border-dotted border-b ...">
    {label}
  </TooltipTrigger>
  <TooltipContent>{hint}</TooltipContent>
</Tooltip>
```

`TooltipTrigger` accepts `className` and forwards it to the underlying button — the styling still applies, and the trigger is a single button.

**Why:** The pattern in shadcn v3 (Radix-based) was `asChild` + your own button. v4 (base-nova) flips the polarity: the primitive IS the button. Confusing because shadcn v4 still ships many primitives that work like Radix (where `asChild` is valid) — only the specific Base UI primitives (`Tooltip`, `Accordion`, `Dialog`, etc.) follow this pattern.

**How to apply:** Whenever I write a Tooltip or any other Base UI primitive that has its own button trigger, never nest a `<button>` inside. Put text or `<span>` as children, or move classes onto the trigger itself. Check existing feedback [[feedback-base-ui-accordion-api]] for the same gotcha with Accordion (no `type="single" collapsible`).
