import { mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  GenericContainer,
  Network,
  type StartedNetwork,
  type StartedTestContainer,
  Wait,
} from "testcontainers"

/**
 * Image references for the disposable services. Pinned by tag here;
 * the implementation PR also records the resolved digests in the
 * structured report so a future re-run knows which image was
 * actually exercised.
 */
const POSTGRES_IMAGE = "postgres:16-alpine"
const POSTGRES_USER = "cda_test"
const POSTGRES_PASSWORD = "cda_test_password"
const POSTGRES_DB = "cda_test_db"
const POSTGRES_PORT = 5432
const POSTGRES_ALIAS = "postgres"

const VERDACCIO_IMAGE = "verdaccio/verdaccio:6"
const VERDACCIO_PORT = 4873
const VERDACCIO_ALIAS = "registry"

/**
 * Verdaccio config: anonymous access for everything. The harness
 * is local-only — the registry is bound to a private Docker network
 * and is never reachable from outside the test — so there is no
 * reason to require auth, and no user to seed. Verdaccio's
 * adduser endpoint has a password-validator that rejects even
 * strong-looking passwords with HTTP 400, and managing users in a
 * throwaway container was the source of three CI regressions in a
 * row. Anonymous is the right shape for this harness.
 */
const VERDACCIO_CONFIG = `
storage: /verdaccio/storage
packages:
  "create-deesse-app":
    access: $anonymous
    publish: $anonymous
    unpublish: $anonymous
  "@*/*":
    access: $anonymous
    publish: $anonymous
  "**":
    access: $anonymous
    publish: $anonymous
    proxy: npmjs
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
log:
  level: warn
`

/**
 * Wait for an HTTP endpoint to respond with a 2xx status code.
 * Used for the Verdaccio /-/ping readiness probe.
 */
const waitForHttp2xx = async (
  url: string,
  timeoutMs: number,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status >= 200 && res.status < 400) return
      lastErr = new Error(`status ${res.status}`)
    } catch (err) {
      lastErr = err
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(
    `HTTP probe ${url} did not return 2xx within ${timeoutMs} ms: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  )
}

export type StartedStack = {
  network: StartedNetwork
  /** Host-published URL of the Verdaccio registry, reachable from
   *  the host machine. Use this when publishing from the host. */
  registryHostUrl: string
  /** Network URL the consumer uses to reach the registry. */
  registryContainerUrl: string
  /** Network URL the consumer uses to reach PostgreSQL. */
  postgresContainerUrl: string
  /** Started containers, in teardown order. */
  started: StartedTestContainer[]
  /** Tear everything down. Idempotent and best-effort. */
  stop: () => Promise<void>
}

const startServiceStack = async (
  network: StartedNetwork,
): Promise<{
  registryHostUrl: string
  started: StartedTestContainer[]
}> => {
  // Start PostgreSQL first; it has the longest cold-start. We
  // intentionally do not hold a reference: callers reach it via the
  // network alias (POSTGRES_ALIAS) and only need the URL string.
  const postgres = await new GenericContainer(POSTGRES_IMAGE)
    .withEnvironment({
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_DB,
    })
    .withExposedPorts(POSTGRES_PORT)
    .withNetwork(network)
    .withNetworkAliases(POSTGRES_ALIAS)
    .withWaitStrategy(Wait.forLogMessage(/database system is ready/))
    .start()

  // Write the Verdaccio config to a tmpdir so we can mount it as a
  // bind. The /verdaccio/conf/config.yaml path is the image's
  // default config location. We only write config.yaml; the image
  // will fall back to its built-in config for everything else.
  const configDir = join(tmpdir(), `cda-verdaccio-${Date.now()}`)
  mkdirSync(configDir, { recursive: true })
  writeFileSync(join(configDir, "config.yaml"), VERDACCIO_CONFIG)

  // Start Verdaccio. Wait on the /-/ping endpoint, which is the
  // documented health probe; the legacy 'http address:' log line is
  // not emitted by Verdaccio 6 on every platform.
  const registry = await new GenericContainer(VERDACCIO_IMAGE)
    .withExposedPorts(VERDACCIO_PORT)
    .withNetwork(network)
    .withNetworkAliases(VERDACCIO_ALIAS)
    .withBindMounts([
      { source: configDir, target: "/verdaccio/conf" },
    ])
    .withWaitStrategy(
      Wait.forHttp("/-/ping", VERDACCIO_PORT).forStatusCode(200),
    )
    .start()

  const registryHostPort = registry.getMappedPort(VERDACCIO_PORT)
  const registryHostUrl = `http://127.0.0.1:${registryHostPort}`

  // Some Docker engines need a small delay before /-/ping answers
  // reliably. waitForHttp2xx is the explicit belt-and-braces probe.
  await waitForHttp2xx(`${registryHostUrl}/-/ping`, 15_000)

  return {
    registryHostUrl,
    started: [postgres, registry],
  }
}

export const startStack = async (): Promise<StartedStack> => {
  const network = await new Network().start()
  const { registryHostUrl, started } = await startServiceStack(network)
  const registryContainerUrl = `http://${VERDACCIO_ALIAS}:${VERDACCIO_PORT}`
  const postgresContainerUrl = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ALIAS}:${POSTGRES_PORT}/${POSTGRES_DB}`

  return {
    network,
    registryHostUrl,
    registryContainerUrl,
    postgresContainerUrl,
    started,
    stop: async () => {
      // Stop in reverse order: consumers first, then Verdaccio, then
      // the network. PostgreSQL comes down with the network.
      //
      // Cleanup errors are not silent: a leak that survives a
      // passing test is a real problem, and the next CI report
      // should show it. We log the error but do not rethrow —
      // masking a passing test's outcome with a teardown
      // failure would be worse than logging.
      for (const container of [...started].reverse()) {
        try {
          await container.stop()
        } catch (err) {
          console.warn(`[cda] cleanup: container.stop() failed:`, err)
        }
      }
      try {
        await network.stop()
      } catch (err) {
        console.warn(`[cda] cleanup: network.stop() failed:`, err)
      }
    },
  }
}

export const POSTGRES_CREDENTIALS = {
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  db: POSTGRES_DB,
  alias: POSTGRES_ALIAS,
  port: POSTGRES_PORT,
} as const

export const VERDACCIO_ALIAS_NAME = VERDACCIO_ALIAS
export const VERDACCIO_HOST_PORT = VERDACCIO_PORT
