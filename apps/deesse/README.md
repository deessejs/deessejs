# deesse

Internal, compile-time framework prototype. This package is private and is not production-ready or publishable.

The prototype validates configuration inference, parsed Zod plugin arguments, root-level plugin tuple composition, Better Auth server-instance typing, the `deesse` and `deesse/react` public type surfaces, and a portable database capability contract that does not expose a provider client.

`createDeesse()` currently returns a typed composition record only. It does not initialize services or serve requests; in particular, `auth` is a type-only placeholder and is not a constructed Better Auth instance. Its declared type is derived from Better Auth's `betterAuth<TOptions>` return type, and the tests assert the organization server API method. Plugin factories parse registration arguments, but do not initialize contributions. Type tests import the public `deesse` and `deesse/react` specifiers; local TypeScript path mappings resolve them to source because generated build output is intentionally not committed. The client API member is a type placeholder, not a working transport client. Better Auth server and client plugin types are checked independently; this prototype does not merge or pair them at runtime. The RFC's lifecycle, Hono dispatch, Next host adapter, database implementation, and dependency validation remain out of scope for this slice.
