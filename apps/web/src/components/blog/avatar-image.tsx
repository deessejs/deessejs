import Image from "next/image"
import { cn } from "@workspace/ui/lib/utils"

interface AvatarNextImageProps {
  className?: string
  src?: string
  alt?: string
}

export function AvatarNextImage({ className, src, alt }: AvatarNextImageProps) {
  if (!src) return null
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      fill
      className={cn("object-cover", className)}
      sizes="(max-width: 640px) 24px, 32px"
    />
  )
}
