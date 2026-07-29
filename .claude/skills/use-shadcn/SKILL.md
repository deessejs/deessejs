---
name: use-shadcn
description: Use @workspace/ui shadcn components (Button, Input, Select, Dialog, Card, etc.) instead of raw HTML elements when writing UI in apps/. Triggers automatically when touching apps/**/*.{tsx,jsx} for forms, modals, interactive elements, or any new UI surface. Lists the 22 available components, import paths, decision tree for common cases, app-local wrappers (InputField, PasswordInput), and the anti-patterns (raw `<input>` with shadcn classes copy-pasted) that have slipped into this codebase before.
when_to_use: |
  Auto-invoked when:
    - Creating or editing form fields, buttons, modals, dropdowns, tooltips, toasts
    - Reviewing PRs that touch apps/**/*.{tsx,jsx}
    - Adding a new page or component under apps/

  Explicit slash command: /use-shadcn
paths:
  - "apps/**/*.tsx"
  - "apps/**/*.jsx"
---

# Use `@workspace/ui` shadcn components

## THE rule

Before writing any interactive HTML element in `apps/`, check `packages/ui/src/components/`.
If a shadcn component exists for it, **use it**. Never write raw `<input>`, `<button>`, `<select>`, `<textarea>`.

An ESLint rule (`react/forbid-elements`, warn-level) in `packages/eslint-config/react-internal.js` enforces this on every lint run.

## Available components (22)

All imported as: `import { X } from "@workspace/ui/components/<kebab-name>"`

| Component | Use when | Import path |
|---|---|---|
| `Button` | Click action, submit | `@workspace/ui/components/button` |
| `Input` | Text/email/password/number input | `@workspace/ui/components/input` |
| `Textarea` | Multi-line text | `@workspace/ui/components/textarea` |
| `Select` | Native dropdown (single value) | `@workspace/ui/components/select` |
| `Checkbox` | Boolean checkbox (incl. "Remember me") | `@workspace/ui/components/checkbox` |
| `Switch` | Toggle on/off (persistent state) | `@workspace/ui/components/switch` |
| `Dialog` | Modal (centered) | `@workspace/ui/components/dialog` |
| `Sheet` | Side-panel modal | `@workspace/ui/components/sheet` |
| `Popover` | Anchored popup | `@workspace/ui/components/popover` |
| `DropdownMenu` | Action menu | `@workspace/ui/components/dropdown-menu` |
| `Command` | Command palette / search | `@workspace/ui/components/command` |
| `Card` | Content container | `@workspace/ui/components/card` |
| `Badge` | Status pill | `@workspace/ui/components/badge` |
| `Tabs` | Tabbed interface | `@workspace/ui/components/tabs` |
| `Accordion` | Collapsible sections | `@workspace/ui/components/accordion` |
| `Collapsible` | Single show/hide | `@workspace/ui/components/collapsible` |
| `Tooltip` | Hover hint (needs `TooltipProvider`) | `@workspace/ui/components/tooltip` |
| `Avatar` | User avatar | `@workspace/ui/components/avatar` |
| `Breadcrumb` | Nav trail | `@workspace/ui/components/breadcrumb` |
| `Separator` | Visual divider | `@workspace/ui/components/separator` |
| `Skeleton` | Loading placeholder | `@workspace/ui/components/skeleton` |
| `Sidebar` | App chrome sidebar | `@workspace/ui/components/sidebar` |
| `Sonner` | Toast (via `toast()` from `sonner`) | `@workspace/ui/components/sonner` |
| `Typography` | Pre-styled prose | `@workspace/ui/components/typography` |
| `InputGroup` | Input with addons/buttons | `@workspace/ui/components/input-group` |

## Decision tree — common UI needs

```
Need text input?
  └─> <Input /> from @workspace/ui/components/input

Need form field with label + error message?
  └─> <InputField /> from @/components/auth/field
      (apps/app only — wraps Input + label + error)
      Falls through to <Input /> + manual label/error elsewhere.

Need password with show/hide toggle?
  └─> <PasswordInput /> from @/components/auth/password-input
      (apps/app only — wraps Input with visibility toggle)

Need submit button in a form?
  └─> <Button type="submit" disabled={!canSubmit}>...</Button>

Need a modal?
  └─> <Dialog> (centered) or <Sheet> (side panel) — both need root components:
      <Dialog><DialogTrigger/><DialogContent>...</DialogContent></Dialog>

Need tooltip?
  └─> Wrap target in <TooltipProvider> once at layout level, then:
      <Tooltip><TooltipTrigger/><TooltipContent>...</TooltipContent></Tooltip>

Need toggle/remember-me?
  └─> <Checkbox /> (added 2026-07-09, use for "Remember me" etc.)
  └─> <Switch /> (semantically a persistent on/off, e.g. dark mode)

Need action menu (kebab, settings row)?
  └─> <DropdownMenu /> with <DropdownMenuTrigger> + <DropdownMenuContent>

Need to show status (active/beta/error)?
  └─> <Badge variant="..." />

Need a container with padding/border?
  └─> <Card><CardHeader/><CardContent/><CardFooter/></Card>
```

## Anti-patterns (NEVER ship these)

- ❌ **Raw `<input>` with shadcn className copy-pasted** — use `<Input />` directly.
- ❌ **Raw `<button>` with manual classes** — use `<Button variant="..." size="..." />`.
- ❌ **Raw `<select>` or `<textarea>`** — use the matching shadcn component.
- ❌ **String-concat className** like `"foo " + (active && "bar")` — use `cn()` from `@workspace/ui/lib/utils`:
  ```tsx
  import { cn } from "@workspace/ui/lib/utils"
  <div className={cn("base", active && "active", className)} />
  ```
- ❌ **Importing from `@/components/ui/*`** — wrong path. Use `@workspace/ui/components/*`.
- ❌ **Adding a new shadcn primitive without coordinating with `packages/ui`** — propose it in the package first, then consume from `apps/`.

## TanStack Form + shadcn controlled inputs (EXCEPTION)

When using `@tanstack/react-form` with `form.Field` children render prop, controlled inputs ARE correct — `value`/`onChange` must be passed explicitly:

```tsx
// ✅ CORRECT — official shadcn + TanStack Form pattern
<form.Field name="email">
  {({ state, handleChange, handleBlur }) => (
    <Input
      value={state.value}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  )}
</form.Field>
```

```tsx
// ❌ STILL WRONG — raw <input> with copied classes
// (even when used with TanStack Form, this avoids Input's accessibility defaults)
<input className="flex h-8 w-full rounded-md border ..." />
```

The ESLint `react/forbid-elements` rule has an exception for `input`/`textarea`/`select` when detected inside a `form.Field` children function.

## App-local wrappers (apps/app only)

These wrap shadcn primitives with project-specific defaults. **Use them when applicable.**

| Wrapper | Wraps | Where |
|---|---|---|
| `InputField` | `Input` + label + error | `apps/app/components/auth/field.tsx` |
| `PasswordInput` | `Input` + show/hide toggle | `apps/app/components/auth/password-input.tsx` |
| `Field` (generic) | label + children + error | `apps/app/components/auth/field.tsx` |

`apps/web` (marketing site) does not have these wrappers — use shadcn primitives directly.

## Adding a new component to `packages/ui`

If a needed primitive is missing (e.g. `RadioGroup`, `Calendar`, `Slider`):

1. Add the component to `packages/ui/src/components/<name>.tsx`
2. Match the existing pattern (see `switch.tsx`, `button.tsx`)
3. The export `./components/*` in `packages/ui/package.json` picks it up automatically — no manifest change needed
4. Verify: `pnpm --filter @workspace/ui typecheck && pnpm --filter @workspace/ui lint`

## Before commit checklist

- [ ] `rg "<(input|button|select|textarea)[\s>]" apps/` returns 0 results in touched files
- [ ] All form controls imported from `@workspace/ui/components/*`
- [ ] `cn()` used for any conditional `className`
- [ ] No new dependencies added to `apps/*/package.json` that should live in `packages/ui`

## Related enforcement

- ESLint rule `react/forbid-elements` in `packages/eslint-config/react-internal.js` (warn-level on `input`/`button`/`select`/`textarea` — has exception for elements inside `form.Field` children functions)
- Backlog: remaining raw HTML controls in `apps/app/components` generate warnings — migrate to shadcn components or document exceptions