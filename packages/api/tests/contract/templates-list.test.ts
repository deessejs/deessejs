/**
 * Contract test for the `templates.list` procedure.
 *
 * Per ADR-009 (Test strategy) and Pattern A in
 * rules/test-mocking.md, this is the contract layer:
 *   - Fast (no network, no DB)
 *   - Exercises the procedure handler in isolation
 *   - Asserts the wire shape matches the declared contract
 *   - Mocks only the external dependencies (GitHub fetch)
 */
import { describe, expect, it, vi } from "vitest"

vi.mock("../../src/core/templates/index.js", () => ({
  enrich: vi.fn(async () => [
    {
      slug: "saas-starter",
      name: "SaaS Starter",
      description: "Production-ready Next.js + Better Auth + Postgres boilerplate.",
      owner: "deessejs",
      repo: "saas-template",
      license: "MIT",
      category: "saas",
      labels: ["nextjs", "saas", "auth", "postgres"],
    },
  ]),
}))

import { call } from "@orpc/server"
import { appRouter } from "../../src/orpc/index.js"
import type { TemplatesListResponseV1 } from "@workspace/contracts/v1"

describe("templates.list", () => {
  it("returns the declared wire shape", async () => {
    const result = await call(appRouter.templates.list, undefined, {
      context: {
        headers: new Headers(),
        user: null,
        session: null,
        requestId: "test-request-id",
      },
    })

    expect(result).toMatchObject<TemplatesListResponseV1>({
      templates: expect.arrayContaining([
        expect.objectContaining({
          slug: "saas-starter",
        }),
      ]),
    })
  })
})
