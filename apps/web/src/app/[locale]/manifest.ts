import type { MetadataRoute } from "next"
import { APP_CONFIG } from "@/lib/app-config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    start_url: "/",
    display: "standalone",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  }
}
