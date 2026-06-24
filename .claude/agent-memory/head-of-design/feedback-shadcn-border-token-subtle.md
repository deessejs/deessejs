---
name: feedback-shadcn-border-token-subtle
description: shadcn default --border token is too subtle for page-level frames (Lc ~10 contrast) — use border-foreground/15 for editorial / structural borders, keep border-border for inline / component borders
metadata:
  type: feedback
---

# shadcn's `--border` token is too subtle for page frames

**Rule:** For page-level structural borders (the editorial frame, dividers between major sections, hero outlines), use `border-foreground/15` or `border-foreground/20` — NOT `border-border`.

```tsx
// ✅ Page frame — clearly visible in both themes
<div className="border-x border-foreground/15">

// ❌ Page frame with default token — invisible (Lc ~10 contrast)
<div className="border-x border-border">

// ✅ Inline / component borders — keep the subtle default
<Card>         {/* uses border-border internally for the card ring */}
<Separator />  {/* uses border-border internally */}
```

**Why:** The shadcn default `--border` token values are designed for component-level separation (cards, separators, input outlines), not for structural page frames.

- Light mode: `--border: oklch(0.922 0 0)` (92.2% L) on `bg-background: oklch(0.995 0 0)` (99.5% L) → Lc ~10 (below APCA threshold for visible UI elements)
- Dark mode: `--border: oklch(1 0 0 / 10%)` on `bg-background: oklch(0.145 0 0)` → also very subtle

For an editorial / centered-column look (Vercel, Linear, Geist style), the page frame needs to be visible. `border-foreground/15` adapts to both themes: ~15% of the foreground color (dark gray in light mode, light gray in dark mode) gives clear contrast against any background.

**How to apply:**
- Page-level structural borders (max-w-X wrappers with border-x, hero outlines, major section dividers) → `border-foreground/15` to `/20`
- Component-level borders (cards, separators, inputs, dialogs) → keep `border-border` (the default, intentionally subtle)
- If you want a single rule, use `border-foreground/10` for components (still visible but not loud) and `border-foreground/15` to `/20` for structure

**Related memory:**
- [[reference-shadcn]] — for the full token system
- DESIGN.md §2.3 — APCA contrast thresholds (Lc 30 minimum for UI components, Lc 60+ for body text)
- DESIGN.md §2.4 — dark mode uses the same token names, different values
