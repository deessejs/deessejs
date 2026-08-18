import { create } from "zustand"

/**
 * Site-wide Cmd-K search dialog state.
 *
 * Single source of truth for the dialog visibility. The trigger
 * button (in the header), the dialog itself (mounted at the root
 * layout), and the Cmd-K keyboard shortcut all read and write
 * this store. Zustand is already in the catalog; the store is a
 * thin wrapper around four actions.
 *
 * Why Zustand over a Context Provider: the dialog has multiple
 * triggers (header button, Cmd-K shortcut, future placeholder in
 * the KB index page), and Zustand is already the pattern of
 * choice for cross-component state in this repo (cookie consent
 * uses it). The store is testable in isolation via
 * `useSearchDialogStore.getState().open()`.
 */

export type SearchDialogStore = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useSearchDialogStore = create<SearchDialogStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}))