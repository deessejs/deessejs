import * as React from "react"

import { cn } from "./cn.js"

type AlertVariant = "default" | "destructive"

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: AlertVariant }) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(
        "relative grid w-full gap-y-1 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
        variant === "destructive" && "border-destructive/50 text-destructive [&>svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 data-slot="alert-title" className={cn("font-medium leading-none tracking-tight", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-sm text-muted-foreground [&_p]:leading-relaxed", className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
