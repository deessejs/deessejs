# CLI init end-to-end regression

This suite packs `@deessejs/cli`, installs the tarball into a temporary
consumer, and runs the installed CLI against a fixed template fixture. The
catalog and GitHub commit archive response are provided by a test-only Node preload;
unexpected `fetch` requests fail the command. The fixture has no third-party
dependencies, so the default `pnpm install` step is exercised without reaching
an external package registry.

Build the CLI workspace dependencies, then run:

```sh
pnpm turbo build --filter=@deessejs/cli
pnpm --filter @deessejs/cli test:e2e
```

The `CLI init consumer E2E` job in `.github/workflows/ci.yml` runs this suite on
a fresh Ubuntu GitHub-hosted runner. Package installation from npm is part of
the setup; the `init` command itself uses only the fixed fixtures.
