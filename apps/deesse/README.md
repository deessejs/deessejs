# deesse

Internal, compile-time framework prototype. This package is private and is not production-ready or publishable.

The prototype validates configuration inference, parsed Zod plugin arguments, root-level plugin tuple composition, Better Auth option preservation, the `deesse/react` auth/API namespaces, and a portable database capability contract that does not expose a provider client.

`createDeesse()` currently returns a typed composition record only. It does not initialize services or serve requests. Plugin factories currently retain parsed-schema typing but do not parse values at runtime. The unified React surface proves Better Auth and oRPC declaration compatibility, but its API member is a type placeholder, not a working transport client. The RFC's lifecycle, Hono dispatch, Next host adapter, database implementation, and dependency validation remain out of scope for this slice.
