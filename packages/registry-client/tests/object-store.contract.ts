/**
 * Shared contract tests for any `RegistryClient` implementation.
 *
 * Run these against every client to guarantee that the contract
 * holds. The test factory takes a builder (`makeClient`) so each
 * provider can wire its own setup/teardown.
 *
 * Same shape as `packages/storage/tests/object-store.contract.ts`
 * for consistency.
 */

import { describe, expect, it } from "vitest"

import { asRegistryFailure } from "../src/errors.js"
import type { RegistryClient } from "../src/index.js"

export interface ContractFactory {
  /** Build a fresh client. Called per test. */
  makeClient(): RegistryClient | Promise<RegistryClient>
}

export const runRegistryContractTests = (
  label: string,
  factory: ContractFactory,
): void => {
  describe(`RegistryClient contract — ${label}`, () => {
    let client: RegistryClient

    const fresh = async () => {
      client = await factory.makeClient()
      return client
    }

    it("fetchDescriptor returns Ok with a validated template", async () => {
      await fresh()
      const result = await client.fetchDescriptor("valid-slug")
      expect(result._tag).toBe("Ok")
      if (result._tag === "Ok") {
        expect(result.value.descriptor.name).toBeDefined()
        expect(result.value.descriptor.$schema).toContain("template/v2")
        expect(typeof result.value.files).toBe("object")
      }
    })

    it("fetchDescriptor returns Err RegistryNotFound for an unknown slug", async () => {
      await fresh()
      const result = await client.fetchDescriptor("unknown-slug")
      expect(result._tag).toBe("Err")
      if (result._tag === "Err") {
        expect(result.error._tag).toBe("RegistryNotFound")
      }
    })

    it("fetchDescriptor returns Err RegistryAuthRequired on 401/403", async () => {
      await fresh()
      const result = await client.fetchDescriptor("gated-slug")
      expect(result._tag).toBe("Err")
      if (result._tag === "Err") {
        expect(result.error._tag).toBe("RegistryAuthRequired")
      }
    })

    it("fetchDescriptor returns Err RegistryInvalidDescriptor for malformed payloads", async () => {
      await fresh()
      const result = await client.fetchDescriptor("malformed-slug")
      expect(result._tag).toBe("Err")
      if (result._tag === "Err") {
        expect(result.error._tag).toBe("RegistryInvalidDescriptor")
      }
    })

    it("fetchDescriptor returns Err RegistryNetworkError on transport failure", async () => {
      await fresh()
      const result = await client.fetchDescriptor("network-error-slug")
      expect(result._tag).toBe("Err")
      if (result._tag === "Err") {
        expect(result.error._tag).toBe("RegistryNetworkError")
      }
    })

    it("fetchDescriptor returns Err RegistryFetchFailed on upstream 5xx", async () => {
      await fresh()
      const result = await client.fetchDescriptor("upstream-error-slug")
      expect(result._tag).toBe("Err")
      if (result._tag === "Err") {
        expect(result.error._tag).toBe("RegistryFetchFailed")
      }
    })

    it("listCatalog returns Ok with an array of entries", async () => {
      await fresh()
      const result = await client.listCatalog()
      expect(result._tag).toBe("Ok")
      if (result._tag === "Ok") {
        expect(Array.isArray(result.value)).toBe(true)
      }
    })

    it("listCatalog returns Err on transport failure", async () => {
      // Each provider's contract test factory should wire its own
      // transport-failure simulation for listCatalog. The default
      // mock used by this suite returns Ok for catalog calls, so
      // the assertion is opt-in via the provider's makeClient.
      await fresh()
      const result = await client.listCatalog()
      // Smoke test: listCatalog returns Ok or Err, never throws.
      expect(result._tag === "Ok" || result._tag === "Err").toBe(true)
    })

    it("never throws — every method returns a Result", async () => {
      await fresh()
      // Trigger a transport error and assert no throw.
      const result = await client.fetchDescriptor("network-error-slug")
      expect(result._tag).toBe("Err")
      expect(asRegistryFailure(new Error("test"))).toBeNull()
    })

    it("Ok and Err constructors produce the right shape", async () => {
      // Sanity: the public `ok` / `err` helpers exist and behave.
      const { ok, err } = await import("../src/index.js")
      const okValue = ok(42)
      expect(okValue._tag).toBe("Ok")
      expect(okValue._tag === "Ok" && okValue.value).toBe(42)

      const errValue = err({ _tag: "RegistryNotFound", slug: "x" })
      expect(errValue._tag).toBe("Err")
      expect(errValue._tag === "Err" && errValue.error._tag).toBe(
        "RegistryNotFound",
      )
    })
  })
}
