"use client"

import { useState, useRef, useImperativeHandle, forwardRef } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  error?: boolean
}

export interface PasswordInputRef {
  getValue: () => string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type={visible ? "text" : "password"}
          className={className}
          aria-invalid={error}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </Button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"
