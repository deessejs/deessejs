import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Per shadcn-ui monorepo research: workspace packages are symlinked
  // into apps/web/node_modules via pnpm. Without `transpilePackages`,
  // Next.js treats them as external deps and skips transpilation —
  // TSX sources fail to resolve. We transpile all 4 internal packages.
  // See `.claude/agent-memory/tech-lead/reference-shadcn-monorepo.md` § 3
  transpilePackages: [
    "@deessejs/ui",
    "@deessejs/api",
    "@deessejs/auth",
    "@deessejs/database",
  ],
};

export default nextConfig;