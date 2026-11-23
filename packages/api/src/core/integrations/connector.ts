/** The provider-neutral project identity used by external connectors. */
export type ExternalProject = {
  id: string
  name: string
}

/** The smallest provider boundary needed by the first connector. */
export interface ExternalConnector {
  readonly provider: string
  listProjects(connection: {
    configurationId: string
    teamId: string | null
  }): Promise<ExternalProject[]>
}
