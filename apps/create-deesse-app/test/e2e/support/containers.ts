import {
  GenericContainer,
  type StartedNetwork,
  type StartedTestContainer,
  Wait,
} from "testcontainers"

/**
 * Image references for the disposable services. Pinned by tag here;
 * the implementation PR should also record the resolved digests in
 * the structured report so a future re-run knows which image was
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

/** Network alias of a host machine seen from inside a container, when
 *  the host is Linux. On macOS / Windows Docker Desktop the magic
 *  alias is `host.docker.internal` and the port is the one published
 *  on the host. We always publish ports so the same image works on
 *  every host. */
const HOST_ALIAS = "host.docker.internal"

/**
 * Wait for an HTTP endpoint to respond with a 2xx or 3xx status code.
 * Verdaccio exposes a /verdaccio/ endpoint for the same purpose as
 * npm's registry root; we hit that for readiness. PostgreSQL does not
 * speak HTTP; its container log emits "database system is ready to
 * accept connections" once the server has finished initializing, so
 * we use log-based waiting there.
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

const waitForPostgresLog = async (
  container: StartedTestContainer,
  timeoutMs: number,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const logs = await container.getLogs()
    const text = `${logs.stdout}\n${logs.stderr}`
    if (/database system is ready to accept connections/.test(text)) {
      return
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(
    `PostgreSQL did not emit readiness line within ${timeoutMs} ms`,
  )
}

export type NetworkHandles = {
  /** Unique testcontainers network that bridges the registry, the
   *  database, and the consumer container. */
  network: StartedNetwork
  /** Host-published URL of the Verdaccio registry, reachable from the
   *  host machine. Use this when publishing from the host. */
  registryHostUrl: string
  /** Aliases of services on the testcontainers network. Use these
   *  URLs from inside any container on the same network. */
  registryContainerUrl: string
  postgresContainerUrl: string
  /** Tear down the network and every container started on it. */
  stop: () => Promise<void>
}

const startServiceStack = async (
  network: StartedNetwork,
): Promise<{
  registryHostUrl: string
}> => {
  // Start PostgreSQL first; it has the longest cold-start.
  const postgres = await new GenericContainer(POSTGRES_IMAGE)
    .withEnvironment({
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_DB,
    })
    .withExposedPorts(POSTGRES_PORT)
    .withNetwork(network)
    .withNetworkAliases([POSTGRES_ALIAS])
    .withWaitStrategy(Wait.forLogMessage(/database system is ready/))
    .start()

  // Start Verdaccio with the same default config that ships in the
  // public image. No custom plugin config — we only need a writeable
  // registry that proxies uncached packages through to the public npm
  // registry.
  const registry = await new GenericContainer(VERDACCIO_IMAGE)
    .withExposedPorts(VERDACCIO_PORT)
    .withNetwork(network)
    .withNetworkAliases([VERDACCIO_ALIAS])
    .withWaitStrategy(Wait.forLogMessage(/http address:/))
    .start()

  const registryHostPort = registry.getMappedPort(VERDACCIO_PORT)
  const registryHostUrl = `http://127.0.0.1:${registryHostPort}`
  // Some Docker engines need a small delay before /verdaccio/ answers;
  // wait explicitly so the consumer container can resolve packages
  // immediately.
  await waitForHttp2xx(`${registryHostUrl}/verdaccio/`, 15_000)
  // Belt-and-braces: also wait on the PostgreSQL log line in case the
  // wait strategy missed it (defensive — most days it does not).
  await waitForPostgresLog(postgres, 5_000)

  return { registryHostUrl }
}

export const startNetwork = async (): Promise<NetworkHandles> => {
  const network = await (await import("testcontainers")).network.start()
  const { registryHostUrl } = await startServiceStack(network)
  const registryContainerUrl = `http://${VERDACCIO_ALIAS}:${VERDACCIO_PORT}`
  const postgresContainerUrl = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ALIAS}:${POSTGRES_PORT}/${POSTGRES_DB}`

  return {
    network,
    registryHostUrl,
    registryContainerUrl,
    postgresContainerUrl,
    stop: async () => {
      try {
        await network.stop()
      } catch {
        // best-effort cleanup; failures are reported separately
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
}

export const VERDACCIO_ALIAS_NAME = VERDACCIO_ALIAS
export const HOST_DOCKER_ALIAS = HOST_ALIAS
