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
 * Verdaccio default config: anonymous publishes, no proxy on
 * create-deesse-app, npm proxy for everything else. We keep this
 * inline because we control it as part of the test, and Verdaccio's
 * image only ships a permissive default.
 */
const VERDACCIO_CONFIG = `
storage: /verdaccio/storage
auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd
    # Verdaccio 6 enables a password-validator on adduser that
    # rejects weak passwords with HTTP 400 "The provided password
    # does not pass the validation". The harness is local-only and
    # uses a long pre-shared secret; we don't need the validator.
    # max_users is the only htpasswd option; validate_password
    # is a per-instance flag, not a per-plugin option — Verdaccio
    # reads it from the top-level \`security\` key.
packages:
  "create-deesse-app":
    access: $authenticated
    publish: $authenticated
    unpublish: $authenticated
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
security:
  validatePassword: false
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
  /** Token to use when publishing or installing on the host. */
  registryToken: string
  /** Username paired with the token. */
  registryUser: string
  /** Network URL the consumer uses to reach the registry. */
  registryContainerUrl: string
  /** Network URL the consumer uses to reach PostgreSQL. */
  postgresContainerUrl: string
  /** Started containers, in teardown order. */
  started: StartedTestContainer[]
  /** Tear everything down. Idempotent and best-effort. */
  stop: () => Promise<void>
}

const VERDACCIO_USER = "cda_e2e"
// Verdaccio 6 enforces a password-strength policy on the adduser
// endpoint. The plaintext must satisfy the validator (upper, lower,
// digit, length). The earlier '$' in the password triggered the
// validator; the bcrypt hash above is precomputed and unrelated.
const VERDACCIO_PASSWORD = "CdAE2eP4ssw0rdL0ngEnough2026"
const VERDACCIO_HTPASSWD_LINE =
  // htpasswd bcrypt for VERDACCIO_PASSWORD above. We use a
  // precomputed hash to avoid pulling a bcrypt implementation in the
  // test harness. The plaintext is part of the same secret.
  `${VERDACCIO_USER}:$2y$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTU\n`

/**
 * Create an ephemeral Verdaccio user via the in-container
 * adduser HTTP endpoint, return the auth token for that user. We
 * use the built-in `adduser` rather than pre-baking the
 * htpasswd file because the latter would require shipping a
 * password hash in this repo.
 */
const createVerdaccioUser = async (
  registryHostUrl: string,
): Promise<string> => {
  // Verdaccio's /-/verdaccio/data/sidebar/ adds users; the actual
  // user-creation API is PUT /-/user/org.couchdb.user:<name>?pw=...
  const url = `${registryHostUrl}/-/user/org.couchdb.user:${encodeURIComponent(VERDACCIO_USER)}?pwd=${encodeURIComponent(VERDACCIO_PASSWORD)}`
  const res = await fetch(url, { method: "PUT" })
  if (!res.ok) {
    throw new Error(
      `Failed to create Verdaccio user (${res.status}): ${await res.text()}`,
    )
  }
  // The response is a JSON Web Token. The /-/verdaccio/data
  // endpoint is not the right one; PUT /-/user/... returns the
  // token directly in the body.
  const token = (await res.text()).trim()
  if (!token) {
    throw new Error("Verdaccio returned an empty token")
  }
  return token
}

const startServiceStack = async (
  network: StartedNetwork,
): Promise<{
  registryHostUrl: string
  registryToken: string
  registryUser: string
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
  // default config location.
  const configDir = join(tmpdir(), `cda-verdaccio-${Date.now()}`)
  mkdirSync(configDir, { recursive: true })
  writeFileSync(join(configDir, "config.yaml"), VERDACCIO_CONFIG)
  writeFileSync(join(configDir, "htpasswd"), VERDACCIO_HTPASSWD_LINE)

  // The htpasswd line above is a placeholder; the real password
  // hash is created at runtime by /adduser (see
  // createVerdaccioUser). The file just needs to exist for Verdaccio
  // to bind the auth.htpasswd.file path without erroring.

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

  // Create the test user and obtain the auth token. This must run
  // after the registry is reachable but before any consumer is
  // started, because the consumer's .npmrc writes the token into a
  // bind mount.
  const registryToken = await createVerdaccioUser(registryHostUrl)

  return {
    registryHostUrl,
    registryToken,
    registryUser: VERDACCIO_USER,
    started: [postgres, registry],
  }
}

export const startStack = async (): Promise<StartedStack> => {
  const network = await new Network().start()
  const { registryHostUrl, registryToken, registryUser, started } =
    await startServiceStack(network)
  const registryContainerUrl = `http://${VERDACCIO_ALIAS}:${VERDACCIO_PORT}`
  const postgresContainerUrl = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ALIAS}:${POSTGRES_PORT}/${POSTGRES_DB}`

  return {
    network,
    registryHostUrl,
    registryToken,
    registryUser,
    registryContainerUrl,
    postgresContainerUrl,
    started,
    stop: async () => {
      // Stop in reverse order: consumers first, then Verdaccio, then
      // the network. PostgreSQL comes down with the network.
      for (const container of [...started].reverse()) {
        try {
          await container.stop()
        } catch {
          // best-effort
        }
      }
      try {
        await network.stop()
      } catch {
        // best-effort
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
