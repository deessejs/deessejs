import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

// Unit tests for the server-only route guards live at
// `tests/**/*.test.ts`, which is the shared preset's default include
// (see `packages/vitest-config`). Colocated `*.test.ts` next to source
// is deliberately not matched, so a stray test file dropped next to a
// component is not picked up by accident.
//
// These tests exercise authorization logic, not React rendering, so the
// preset's `node` environment is kept. Anything needing a DOM belongs
// in a different runner.
export default defineConfig(vitestConfig())