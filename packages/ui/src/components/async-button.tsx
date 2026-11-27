"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { Button as UiSdkButton } from "@ui-sdk/react/button"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type AsyncButtonProps = Omit<
  React.ComponentProps<typeof UiSdkButton>,
  "className" | "children"
> & {
  className?: string
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  children?: React.ReactNode
}

function AsyncButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: AsyncButtonProps) {
  return (
    <UiSdkButton
      data-slot="async-button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { AsyncButton }
export type { AsyncButtonProps }
