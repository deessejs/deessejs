import { ImageResponse } from "next/og"
import { APP_NAME, APP_URL, APP_CONFIG } from "@workspace/ui/lib/config"

export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: "white",
            }}
          />
          <div style={{ fontSize: 20, opacity: 0.8 }}>{APP_NAME}</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          <div>{APP_NAME}</div>
          <div style={{ fontSize: 20, opacity: 0.7, fontWeight: 400 }}>
            {APP_CONFIG.description}
          </div>
        </div>
        <div style={{ fontSize: 16, opacity: 0.5 }}>{APP_URL}</div>
      </div>
    ),
    { ...size }
  )
}
