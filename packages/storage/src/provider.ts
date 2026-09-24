/**
 * Descriptor acquisition interfaces.
 *
 * The V1 interface is intentionally narrow: acquire + publish. Branching
 * and authentication are opt-in extensions that consumers activate by
 * checking `instanceof BranchableDescriptorProvider` /
 * `instanceof AuthenticatedDescriptorProvider` — they do not appear as
 * methods on the base interface.
 *
 * This is the inverse of the typical "rich base interface" pattern. The
 * rationale: per ADR-036 §4, an interface is frozen on publish. A V1
 * provider that does not support branching must NOT carry a `branch()`
 * method that throws "not implemented" — that turns the interface into
 * a lie that downstream code learns to defend against with `if (x)` and
 * feature sniffing. Better that the V3 caller explicitly asks for a
 * BranchableDescriptorProvider and gets a clear type error if it
 * doesn't have one.
 *
 * Implementation note: providers may choose to cache internally
 * (filesystem, IndexedDB, etc). The {@link cache.ts} module provides the
 * shared ETag/revalidation cache; providers can use it or roll their
 * own.
 */

import type * as v2Contracts from "@workspace/contracts/v2"
import type * as v1Contracts from "@workspace/contracts/v1"

type TemplateV2Type = v2Contracts.TemplateV2
type BlockV1Type = v1Contracts.BlockV1

/**
 * A parsed descriptor. Template and block are mutually exclusive
 * discriminators; the envelope carries the shape.
 *
 * Consumers branch on `kind`: `kind === "template"` vs `kind === "block"`.
 * The parsing of the inner shape is the envelope's job (see envelope.ts);
 * this type is what surfaces after parsing.
 */
export type ParsedDescriptor =
  | { kind: "template"; template: TemplateV2Type }
  | { kind: "block"; block: BlockV1Type }

/**
 * V1 base interface. Every implementation MUST support read and write.
 * Read is the load-bearing case (used by `deessejs add` and `init`).
 * Write is used by the publication CI to push new descriptors.
 */
export interface DescriptorProvider {
  /**
   * Read a descriptor.
   *
   * @param slug  registry-unique identifier (e.g. `"nextjs-app-router-saas"`)
   * @param ref   version reference: semver tag (`"v1.4.0"`), branch
   *              (`"main"`), SHA (`"a1b2c3d..."`), or the magic string
   *              `"latest"` to resolve to the registry's current stable.
   *              Provider-specific rules apply (git-tags vs R2 vs Neon).
   *
   * Returns the parsed descriptor. Throws:
   *  - {@link StorageNotFoundError} if the (slug, ref) pair does not exist
   *  - {@link StorageNetworkError} on transient network failure
   *  - {@link StorageOfflineViolationError} when offline and cache misses
   *  - {@link StorageInvalidDescriptorError} if the wire shape fails to parse
   */
  acquire(slug: string, ref: string): Promise<ParsedDescriptor>

  /**
   * Publish a descriptor.
   *
   * Providers implement this with their own write semantics (git push
   * for git-tags, PUT object for R2, branch write for Neon). The V1
   * contract is "best-effort commit-on-publish": if the publish
   * succeeds, the next `acquire(same_slug, same_ref)` will return this
   * descriptor.
   *
   * Throws:
   *  - {@link StorageAuthError} for permission failures (V2+)
   *  - {@link StorageNetworkError} for transient failures
   *  - {@link StorageInvalidDescriptorError} if the input fails to parse
   */
  publish(
    slug: string,
    ref: string,
    descriptor: ParsedDescriptor,
  ): Promise<void>
}

/**
 * V3 extension: the provider supports ephemeral branches.
 *
 * Used for preview-demo environments: a PR opened against the
 * registry repo gets a branch-with-descriptors that a reviewer can
 * `deessejs add <slug>@<branch-ref>` against.
 *
 * Implementations are exclusively R2-class or Neon-class providers.
 * git-tags provider does not implement this.
 */
export interface BranchableDescriptorProvider extends DescriptorProvider {
  /** Create an ephemeral branch with the descriptor list of `parentRef`. */
  branch(parentRef: string, branchName: string): Promise<BranchHandle>

  /** List ephemeral branches currently active. */
  listBranches(parentRef: string): Promise<string[]>

  /** Tear down an ephemeral branch (typically automatic after PR closure). */
  deleteBranch(branchName: string): Promise<void>
}

/**
 * Handle to a branch. The branch is itself a {@link DescriptorProvider},
 * so consumers can call `branchHandle.acquire(slug, ref)` against the
 * branched view without special-casing in their code.
 */
export interface BranchHandle {
  /** The branch's own name, useful for logging. */
  readonly name: string
  /** Use the branched view as if it were a registry. */
  acquire(slug: string, ref: string): Promise<ParsedDescriptor>
  /** Clean up. Idempotent — safe to call twice. */
  dispose(): Promise<void>
}

/**
 * V2 extension: the provider enforces authentication.
 *
 * Configuration is provider-side (service tokens, Cloudflare Access,
 * Neon credentials). The interface exposes only the surface a caller
 * needs to know when authentication has failed.
 */
export interface AuthenticatedDescriptorProvider extends DescriptorProvider {
  /**
   * Whether the provider currently has a valid auth credential
   * available. False triggers {@link StorageAuthError} on next
   * acquire/publish. Read-only, no setter — credential provisioning
   * is provider-specific and lives in the provider's constructor.
   */
  readonly authenticated: boolean
}
