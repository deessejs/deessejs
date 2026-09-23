import type { MetadataRoute } from "next"
import { APP_CONFIG } from "@/lib/app-config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    start_url: "/",
    display: "standalone",
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
  }
}
