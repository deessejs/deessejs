"use client"

import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"

/**
 * Interactive demo of the Button primitive used in the Preview tab
 * of the Button component page. The label cycles between
 * "Click me" and a click counter that resets to 0 after 1.5s of
 * inactivity.
 *
 * Lives in its own client file because it uses `useState` +
 * `useEffect` — the parent `component-preview.tsx` is a server
 * component that ships many other previews as static markup.
 */
export function ButtonPreviewDemo() {
  const [clicked, setClicked] = useState(0)
  // Reset to 0 after 1.5s of inactivity so the label cycles back.
  useEffect(() => {
    if (clicked === 0) return
    const id = window.setTimeout(() => setClicked(0), 1500)
    return () => window.clearTimeout(id)
  }, [clicked])

  const label =
    clicked === 0
      ? "Click me"
      : `Clicked ${clicked} time${clicked === 1 ? "" : "s"}`

  return <Button onClick={() => setClicked((n) => n + 1)}>{label}</Button>
}