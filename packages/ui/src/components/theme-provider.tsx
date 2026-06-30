"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

/**
 * The default theme provider. Wraps the entire React tree so `next-themes`
 * can manage the `dark` class on `<html>` based on the user's OS color
 * scheme and (later) an in-app toggle.
 *
 * - `attribute="class"` writes `class="dark"` on `<html>`, which is the
 *   selector the package's `globals.css` uses for dark token overrides.
 * - `defaultTheme="system"` honors the OS preference on first load.
 * - `enableSystem` reacts to live OS preference changes.
 * - `disableTransitionOnChange` suppresses CSS transitions during the
 *   initial theme swap to avoid a flash of unstyled color.
 *
 * The consumer's `<html>` MUST have `suppressHydrationWarning` because
 * next-themes mutates the className client-side after SSR. See
 * `apps/web/src/app/layout.tsx` for the wired-up consumer.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

/**
 * Re-export of next-themes' `useTheme` hook so consumers can read/flip
 * the current theme without taking a direct dependency on `next-themes`.
 * Pattern: `import { useTheme } from "@workspace/ui/components/theme-provider"`.
 */
export { useTheme }
