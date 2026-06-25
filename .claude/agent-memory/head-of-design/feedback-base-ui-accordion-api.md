---
name: feedback-base-ui-accordion-api
description: shadcn v4 base-nova uses @base-ui/react/accordion — its props differ from Radix Accordion (no type="single" collapsible); use defaults or openMultiple instead
metadata:
  type: feedback
---

# Base UI Accordion API — different from Radix

**Rule:** shadcn v4 (base-nova style) generates the Accordion primitive using `@base-ui/react/accordion`, NOT `@radix-ui/react-accordion`. The Base UI API is different from the Radix pattern you'll find in most shadcn examples online.

## What breaks

```tsx
/* ❌ Radix-style — DOES NOT WORK with @base-ui/react/accordion */
<Accordion type="single" collapsible>
  <AccordionItem value="q1">…</AccordionItem>
</Accordion>
```

Build error:
```
Type error: Property 'type' does not exist on type 'IntrinsicAttributes & Props<any>'.
```

## What works

```tsx
/* ✅ Base UI style — just use defaults */
<Accordion>
  <AccordionItem value="q1">…</AccordionItem>
</Accordion>
```

Base UI's `Accordion.Root` props:
- `openMultiple?: boolean` — single (default) vs multiple open at a time
- `defaultValue?: Value | Value[]` — initial open item(s)
- `value?: Value | Value[]` — controlled
- `onValueChange?: (value, eventReason) => void`

No `type="single"`, no `collapsible`. Single-open is the default; collapsing all items is the default behavior.

## How to apply

- New shadcn components using `base-nova` style → check the actual generated API before reaching for Radix patterns.
- When a TypeScript error says "Property X does not exist", the prop is from a different primitive library (Radix vs Base UI).
- For `type="single" collapsible` equivalents in Base UI:
  - **single-open**: just don't pass `openMultiple` (default)
  - **collapsible**: don't pass a defaultValue — items can be closed by clicking the trigger again
  - **multiple-open**: pass `openMultiple`

## Related

- [[reference-shadcn]] — base-nova vs other shadcn styles
- [[tech-stack]] — shadcn/ui + Tailwind v4 stack for this project
