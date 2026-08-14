import { defineConfig } from "vitest/config"

import { vitestConfig } from "@workspace/vitest-config"

// Vitest config for @workspace/env.
//
// Inherits the monorepo preset from @workspace/vitest-config:
//  - tests/**/*.test.ts include glob (matches ADR-009 directory name)
//  - @workspace/env/server as the default setupFile (loads .env once,
//    so tests see process.env populated without per-test setup)
//  - 5s testTimeout, 10s hookTimeout
//  - clearMocks true, restoreMocks true
//  - node environment
//
// Coverage is intentionally not enabled here. ADR-011 defers coverage
// to the package-level roll-out via @workspace/vitest-config coverage
// true, which the ADR documents alongside the 80/75 threshold from
// ADR-009. This file keeps the package's tests running without
// committing to a coverage gate that needs every source file under
// test first.
export default defineConfig(
  vitestConfig({
    package: "env",
  })
)
