"use client"

import { useEffect, type RefObject } from "react"

export function useSearchShortcuts(toggle: () => void, close: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        toggle()
      } else if (event.key === "Escape") close()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [toggle, close])
}

export function useSearchInputFocus(isOpen: boolean, inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen, inputRef])
}
