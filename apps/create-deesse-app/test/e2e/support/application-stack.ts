import { network as testcontainersNetwork } from "testcontainers"

import { POSTGRES_CREDENTIALS, VERDACCIO_ALIAS_NAME } from "./containers.js"

export const POSTGRES_CONTAINER_URL = (): string =>
  `postgresql://${POSTGRES_CREDENTIALS.user}:${POSTGRES_CREDENTIALS.password}@${POSTGRES_CREDENTIALS.alias}:${POSTGRES_CREDENTIALS.port}/${POSTGRES_CREDENTIALS.db}`

export const VERDACCIO_CONTAINER_URL = (): string =>
  `http://${VERDACCIO_ALIAS_NAME}:4873`

export type StopStack = (started: Array<{ stop: () => Promise<unknown> }>) => Promise<void>

export const makeStackStop =
  (network: Awaited<ReturnType<typeof testcontainersNetwork.start>>): StopStack =>
  async (started) => {
    for (const c of started) {
      try {
        await c.stop()
      } catch {
        // best-effort
      }
    }
    try {
      await network.stop()
    } catch {
      // best-effort
    }
  }
