# ADR-003: ORPCError wire format

## Status

Accepted (2026-08).

## Context

The shared backend serves both oRPC procedures (which the client
decodes via `@orpc/client`) and Hono middleware (rate-limit, 404,
global `onError`). The procedures natively produce `ORPCError` with
the wire shape `{ defined, code, status, message, data }`. The
middleware had a custom JSON envelope `{ code, message, requestId }`
defined in `packages/api/src/envelope.ts`.

Two error channels on the wire meant every consumer had to handle two
shapes. Tests duplicated the parsing logic. Adding a third middleware
required updating both the envelope helper and the consumer parser.

Three options were considered:

1. **Keep the custom envelope**: the client maps both shapes to
   `ORPCError`. Cheap to implement; the mapping leaks into every
   consumer.
2. **Convert middleware to throw `ORPCError` directly**: middleware
   throws `HTTPException`, the global `onError` maps to ORPCError
   wire shape. Single channel end-to-end.
3. **Use a third-party standard (RFC 7807 Problem Details)**: better
   for external consumers, but `@orpc/client` doesn't recognize it.
   Would require a custom decoder on the client.

## Decision

**Option 2: single error channel using the ORPCError wire shape.**

Hono middleware throws `HTTPException` with the right status code and
message. The global `onError` handler in
`packages/api/src/middleware/error-handler.ts` produces the wire
shape:

```json
{
  "defined": false,
  "code": "RATE_LIMITED",
  "status": 429,
  "message": "Too many requests. Try again in 60s.",
  "data": {}
}
```

Procedures throw `ORPCError` with `defined: true`. Both decode into
the same `ORPCError` instance on the client side.

## Consequences

- Every error response, regardless of where it originated, decodes
  into a real `ORPCError` instance. The consumer code path is
  identical.
- The `ORPCError.code` is the canonical vocabulary. Server-side
  middleware codes match the procedure error map (HTTPException 429
  → `RATE_LIMITED`, HTTPException 404 → `NOT_FOUND`, etc.).
- Future error codes added to a procedure's `errors` map flow to
  consumers without consumer changes — the type signature catches
  them.

## Anti-patterns

- Returning `c.json(errorBody(...), 429)` from a Hono handler. Throw
  `HTTPException` instead; the global `onError` maps it.
- Sending a non-ORPCError shape from the server. The client will
  throw `ORPCError("INTERNAL_SERVER_ERROR")` and lose the original
  context.
- Throwing `ORPCError` with `defined: true` from Hono middleware.
  The `defined: true` flag is reserved for procedures whose error
  map is registered in the router. Middleware uses `defined: false`.
