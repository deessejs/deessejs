"use client"

import { useCallback, useState } from "react"
import { useResetAfterInactivity } from "@/hooks/catalog/use-reset-after-inactivity"

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
  const reset = useCallback(() => setClicked(0), [])
  const scheduleReset = useResetAfterInactivity(reset, 1500)
  const handleClick = useCallback(() => {
    setClicked((count) => count + 1)
    scheduleReset()
  }, [scheduleReset])

  const label =
    clicked === 0
      ? "Click me"
      : `Clicked ${clicked} time${clicked === 1 ? "" : "s"}`

  return <Button onClick={handleClick}>{label}</Button>
}
