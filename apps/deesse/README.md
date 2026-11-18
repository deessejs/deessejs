# deesse

Internal, compile-time framework prototype. This package is private and is not production-ready or publishable.

The prototype validates configuration inference, parsed Zod plugin arguments, root-level plugin tuple composition, Better Auth option preservation, the `deesse/react` auth/API namespaces, and a portable database capability contract that does not expose a provider client.

`createDeesse()` currently returns a typed composition record only. It does not initialize services or serve requests. Plugin factories parse registration arguments, but do not initialize contributions. The React type test imports and augments the public `deesse/react` subpath; its local TypeScript path mapping resolves that package name to source during typecheck because build output is intentionally not committed. The client API member is a type placeholder, not a working transport client. Better Auth server and client plugin types are checked independently; this prototype does not merge or pair them at runtime. The RFC's lifecycle, Hono dispatch, Next host adapter, database implementation, and dependency validation remain out of scope for this slice.
