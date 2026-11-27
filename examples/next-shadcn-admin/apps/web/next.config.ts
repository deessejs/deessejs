import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@deesse-admin-example/ui", "deesse", "@deessejs/ui"],
}

export default nextConfig
