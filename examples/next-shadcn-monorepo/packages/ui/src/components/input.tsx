import type { InputHTMLAttributes } from "react"
import { cn } from "../lib/utils.ts"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  )
}
