# CLI init end-to-end regression

This suite packs `@deessejs/cli`, installs the tarball into a temporary
consumer, and runs the installed CLI against fixed repository fixtures. The
catalog and GitHub commit archive responses are provided by a test-only Node
preload; unexpected `fetch` requests fail the command. It covers both catalog
slugs and direct GitHub repository URLs. A repository without the required
descriptor is rejected the same way for both input forms. The install fixture
has no third-party dependencies, so `pnpm install` is exercised without
reaching an external package registry.

Build the CLI workspace dependencies, then run:

```sh
pnpm turbo build --filter=@deessejs/cli
pnpm --filter @deessejs/cli test:e2e
```

The `CLI init consumer E2E` job in `.github/workflows/ci.yml` runs this suite on
a fresh Ubuntu GitHub-hosted runner. Package installation from npm is part of
the setup; the `init` command itself uses only the fixed fixtures.
