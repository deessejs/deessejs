import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

type CSSVariableMap = Record<`--${string}`, string | number | undefined>

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function cssVariables(values: CSSVariableMap): React.CSSProperties {
  return values
}
