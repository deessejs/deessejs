import type { ButtonHTMLAttributes } from "react"
import { cn } from "../lib/utils.js"

export function Button({ className, variant = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "secondary" | "outline" }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:opacity-85",
    outline: "border border-border bg-background hover:bg-muted",
  }

  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50", variants[variant], className)}
      {...props}
    />
  )
}
