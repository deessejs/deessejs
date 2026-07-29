# Zustand

## Decision

**Zustand** as the client-side state library for cross-component UI state that doesn't fit React state, URL state, or TanStack Query.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Zustand is used for:

- **Cross-component UI state** that needs to be shared but isn't server state (e.g. sidebar open/closed, theme override, modal stack).
- **Wizard state** (multi-step forms with persistent progress).
- **Notification UI state** (which notifications are read, the unread count for the bell).
- **Optimistic UI state** before TanStack Query confirms.

Zustand is **not** used for:

- **Server state** — TanStack Query handles it.
- **URL state** — `useSearchParams` handles it.
- **Form state** — TanStack Form handles it.
- **Theme** — Tailwind dark mode + design tokens handle it.
- **Auth state** — Better Auth's `useSession()` handles it.

## What Zustand gives us

1. **Tiny bundle** (~1KB gzipped). Less than Redux, Jotai, Recoil.
2. **No provider needed.** Stores are global, no context wrapper.
3. **TypeScript-native.** Stores are typed end-to-end.
4. **Simple API.** `create<State>()((set) => ({ ... }))`.
5. **Devtools support.** Zustand integrates with Redux DevTools.
6. **Persistence middleware.** `persist()` to localStorage if needed.

## Why Zustand (not Redux Toolkit, not Jotai, not React Context)

| Alternative | Why not |
|---|---|
| **Redux Toolkit** | Heavy. Boilerplate. Overkill for our state needs. |
| **Jotai** | Atomic. Different mental model. Smaller community than Zustand. |
| **Recoil** | Meta-maintained but uncertain future. |
| **React Context + useReducer** | Works for tiny state, but every update re-renders the whole tree. Zustand is more selective. |
| **Valtio** | Proxy-based. Different mental model. |
| **Plain `useState` + props** | Doesn't scale to cross-component state. |

Zustand wins on:

- **Tiny bundle.**
- **Simple mental model.** A store is just a function with state and setters.
- **No provider** — works in any component tree.
- **TS-native.**

## Pattern

```ts
// apps/template/packages/ui/sidebar-store.ts
import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));
```

```tsx
// In any component
'use client';
import { useSidebarStore } from '@deessejs/ui/sidebar-store';

function SidebarToggle() {
  const toggle = useSidebarStore((s) => s.toggle);
  return <button onClick={toggle}>Toggle</button>;
}

function Sidebar() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  if (!isOpen) return null;
  return <aside>...</aside>;
}
```

## Selectors (the performance rule)

Always use selectors when reading from a Zustand store. Don't read the whole state.

```ts
// ❌ Bad: re-renders on any state change
const state = useSidebarStore();

// ✅ Good: only re-renders when `isOpen` changes
const isOpen = useSidebarStore((s) => s.isOpen);
```

## Persistence

For state that should survive page reloads (wizard progress, user preferences), use the `persist` middleware:

```ts
import { persist, createJSONStorage } from 'zustand/middleware';

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      step: 0,
      data: {},
      next: () => set((s) => ({ step: s.step + 1 })),
      reset: () => set({ step: 0, data: {} }),
    }),
    {
      name: 'deessejs-wizard',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

## Constraints

- **Use selectors** for every read. No whole-state reads.
- **Stores live in `packages/<feature>/`** when feature-specific, or in `packages/ui/` for cross-cutting UI state.
- **No server state in Zustand.** If it comes from an API, it goes in TanStack Query.
- **No form state in Zustand.** If it's a form field, it goes in TanStack Form.
- **Persistence is opt-in.** Most stores are in-memory only.

## What the buyer can replace

The buyer can swap Zustand for any other state library by replacing `packages/ui/` stores. The contracts are small (read state, call setters), so the migration is mechanical.

## Cross-references

- [`./tanstack-query.md`](./tanstack-query.md) — server state.
- [`./tanstack-form.md`](./tanstack-form.md) — form state.
- [`../03-web-app/state-management.md`](../03-web-app/) — full state-management rationale (when written).
- [`../../product/features/10-ui.md`](../../product/features/10-ui.md) — UI feature inventory.
