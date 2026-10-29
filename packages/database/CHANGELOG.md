# @workspace/database

## 0.1.0

### Minor Changes

- 898c8ab: Adds the organization creation flow, and the routing that makes it land somewhere.

  A verified account can now create its first organization by giving a name. The slug is the server's: the procedure's input has no slug field, Zod drops the one a caller sends, and the native `/organization/create` endpoint is disabled so there is no other door. The slug is generated from the name, and a collision is retried against the database over a bounded sequence of candidates, so a name that is already taken gets the next free form rather than an error.

  The creation is not one call. The plugin writes the organization, then its membership, then the caller's active selection, and the process can fail or die between them. `packages/database` gains an `organization_provisioning` table: one row per attempt, with a partial unique index that lets an account hold one attempt in flight at a time. The attempt's id is the marker, and it travels in the organization's own metadata, written by the insert itself, so an organization either carries its attempt's marker or it does not belong to that attempt.

  That marker is what makes the recovery safe. An interrupted creation is found through the operation's slug and the marker, and the flow either adopts it, when it has a membership for the account, or removes it, when it does not. The removal is by the organization's id, never by a slug alone: a slug proves there is one row with that slug, not that this request owns it. A failure that aborts an attempt compensates the same way, and an organization this request never created survives it. The compensation is conditional on the attempt still holding the operation, so it cannot undo a recovery that adopted the organization.

  A recovery holds the account while it runs. The operation it took over stays covered by the account's unique index, so a second attempt cannot start beside it, and the reconciliation ends the operation when it is done. The active selection is restored before the operation is finalized, so a failure in the middle leaves the operation claimable and the next attempt reconciles it again and adopts the same organization, rather than creating a second one.

  The check that stops a superseded attempt from creating anything is in the database, not in the application. A `BEFORE INSERT` trigger reads the marker out of the row being inserted, locks the operation row it names, and refuses the insert when the operation is no longer pending. The lock is what makes the check atomic with the insert: a takeover waits for it, so the loser of the race observes the winner's state rather than a stale copy. The refusal carries the SQLSTATE `D0001`, which the flow reads on the error the way it reads the unique violation's `23505`, and it is a 409 rather than a failure: the attempt was overtaken, not broken.

  The marker's life is protected. The create hook refuses a creation that carries no marker, so the metadata is the application's alone, and the update hook refuses an update that would change or remove the marker of an organization whose operation is not finished. The native update endpoint stays open, because the organization's profile editing is part of the product.

  The refusals are declared, so the client reads a stable code instead of the plugin's own errors: `ORGANIZATION_NAME_INVALID` is a 400, `ORGANIZATION_EMAIL_VERIFICATION_REQUIRED` is a 403, `ORGANIZATION_CREATE_IN_PROGRESS` is a 409, and `ORGANIZATION_CREATE_FAILED` is a 500. An account whose email is not verified gets the 403 rather than the plugin's unrecognised refusal, which would have been reported as a server failure.

  `apps/app` gains the route topology the flow needs. The workspace is `/[organization_slug]/*`, and the layout resolves the slug through the API procedure, so a page under it belongs to that organization and the API refuses a caller who does not belong to it. The empty state is `/no-organization`, and `/home` resolves to the workspace or to the empty state, carrying the query string across the hop. The empty state never repairs the caller's selection by itself: the caller picks, and the pick calls the endpoint that owns that write.

  The request guard classifies a path instead of matching a list, because the workspace tree's first segment is not known in advance. A path whose first segment the application owns is an application route, any other first segment is an organization slug and is protected, and a path with a file extension is a file and is never gated, which is what keeps a nested asset out of the gate. The reserved slug set moves to a module of its own so the guard can read it without pulling the authentication stack into the browser bundle, and it grows with the two segments this change introduces.

  The create dialog is a client component, so it calls a browser oRPC client: the server client is a server module, and the browser is on the same origin as the API, so the session travels on its own.

### Patch Changes

- 0d0f793: Add GitHub App authorization and organization installation linking.
- 2dd0c6e: Add private organization-owned templates with GitHub repository snapshots.
- a1cf6f8: Persist reviewed GitHub repositories as organization projects and list their validation metadata in the dashboard.
- Updated dependencies [ac69a68]
- Updated dependencies [af040af]
- Updated dependencies [3f40fd1]
- Updated dependencies [0d0f793]
  - @workspace/env@0.1.0

## 0.0.1

### Patch Changes

- 83a37b0: test(e2e): re-exercise the custom release pipeline after the `-f` tag fix. Adds a constant export `RELEASE_TEST_MARKER` to `packages/database/src/tables/index.ts` and bumps `@workspace/database` patch. No behavioral change.
