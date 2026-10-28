import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

type CSSVariableMap = Record<`--${string}`, string | number | undefined>

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function cssVariables(values: CSSVariableMap): React.CSSProperties {
  // lint exception: React.CSSProperties omits CSS custom properties, although the DOM style API supports them.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return values as React.CSSProperties
}
