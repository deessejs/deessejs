import { Command } from "commander"
import ora from "ora"

import {
  createAuthenticatedORPCClient,
  type ORPCClient,
} from "../api/client.js"
import {
  getOrganizationRole,
  listOrganizations,
  type Organization,
} from "../api/organizations.js"
import { CliError, internal } from "../errors/index.js"
import { printError, printJson } from "../output/index.js"
import {
  printOrganizationInfo,
  printOrganizationsTable,
} from "../output/table.js"
import { readAuth } from "../lib/auth/store/store.js"
import { organizationSlugFromName } from "../utils/organization-slug.js"

type JsonOption = { json?: boolean }

type OrganizationSummary = Organization & { role: string }

const authRequired = (): CliError =>
  new CliError(
    "auth_required",
    "This command requires an active CLI session.",
    "Run `deessejs auth login` to sign in."
  )

const inaccessibleOrganization = (): CliError =>
  new CliError(
    "organization_not_found",
    "Organization not found or you are not a member.",
    "Run `deessejs organization list` to see your organizations."
  )

const isRecordWithCode = (error: unknown): error is { code: unknown } =>
  typeof error === "object" && error !== null && "code" in error

const organizationErrorFromCode = (code: unknown): CliError | undefined => {
  if (code === "UNAUTHORIZED") return authRequired()
  if (
    code === "ORGANIZATION_ACCESS_DENIED" ||
    code === "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION" ||
    code === "ORGANIZATION_NOT_FOUND"
  ) {
    return inaccessibleOrganization()
  }
  if (code === "ORGANIZATION_EMAIL_VERIFICATION_REQUIRED") {
    return new CliError(
      "organization_api_error",
      "Verify your email before creating an organization.",
      "Open the verification email for your account, then retry."
    )
  }
  if (
    code === "ORGANIZATION_NAME_INVALID" ||
    code === "ORGANIZATION_SLUG_INVALID"
  ) {
    return new CliError(
      "organization_api_error",
      "That organization name cannot be used.",
      "Choose a different name and try again."
    )
  }
  if (code === "ORGANIZATION_CREATE_IN_PROGRESS") {
    return new CliError(
      "organization_api_error",
      "An organization is already being created for this account.",
      "Wait a moment, then retry."
    )
  }
  if (code === "ORGANIZATION_CREATE_FAILED") {
    return new CliError(
      "organization_api_error",
      "The organization could not be created.",
      "Retry in a moment."
    )
  }
}

const organizationError = (error: unknown): CliError => {
  if (error instanceof CliError) return error
  if (isRecordWithCode(error)) {
    const mapped = organizationErrorFromCode(error.code)
    if (mapped) return mapped
  }
  if (error instanceof TypeError) {
    return new CliError(
      "network_error",
      "Could not reach the DeesseJS API.",
      error.message
    )
  }
  return internal("The organization request failed unexpectedly.")
}

function reportError(error: unknown, json: boolean): never {
  const cliError = organizationError(error)
  if (json) {
    printJson({
      ok: false,
      code: cliError.code,
      message: cliError.message,
      hint: cliError.hint,
    })
  } else {
    printError(cliError)
  }
  process.exit(cliError.exitCode())
}

const signedInToken = () => {
  const stored = readAuth()
  if (!stored) throw authRequired()
  return stored.access_token
}

async function reportAction<T>(
  action: () => Promise<T>,
  json: boolean,
  spinner: ReturnType<typeof ora> | null
): Promise<T> {
  try {
    const result = await action()
    spinner?.succeed()
    return result
  } catch (error) {
    spinner?.fail()
    reportError(error, json)
  }
}

export const organizationListCommand = new Command("list")
  .description("List your organizations")
  .option("--json", "JSON output for scripting")
  .action(async (options: JsonOption) => {
    let token: string
    try {
      token = signedInToken()
    } catch (error) {
      reportError(error, options.json ?? false)
    }

    const spinner = options.json
      ? null
      : ora("Fetching organizations...").start()
    const organizations = await reportAction(
      () => listOrganizations(token),
      options.json ?? false,
      spinner
    )
    if (options.json) {
      printJson({ organizations })
    } else {
      printOrganizationsTable(organizations)
    }
  })

export const organizationInfoCommand = new Command("info")
  .description("Show details for one of your organizations")
  .argument("<slug>", "organization slug")
  .option("--json", "JSON output for scripting")
  .action(async (slug: string, options: JsonOption) => {
    let token: string
    try {
      token = signedInToken()
    } catch (error) {
      reportError(error, options.json ?? false)
    }

    const spinner = options.json
      ? null
      : ora("Fetching organization...").start()
    const organization = await reportAction<OrganizationSummary>(
      async () => {
        const memberships = await listOrganizations(token)
        const memberOrganization = memberships.find(
          (item) => item.slug === slug
        )
        if (!memberOrganization) throw inaccessibleOrganization()
        const role = await getOrganizationRole(memberOrganization.id, token)
        return { ...memberOrganization, role } satisfies OrganizationSummary
      },
      options.json ?? false,
      spinner
    )

    if (options.json) {
      printJson({ organization })
    } else {
      printOrganizationInfo(organization)
    }
  })

export const organizationCreateCommand = new Command("create")
  .description("Create an organization")
  .argument("<name>", "organization display name")
  .option("--json", "JSON output for scripting")
  .action(async (name: string, options: JsonOption) => {
    let client: ORPCClient
    try {
      client = createAuthenticatedORPCClient(signedInToken())
    } catch (error) {
      reportError(error, options.json ?? false)
    }

    const spinner = options.json
      ? null
      : ora("Creating organization...").start()
    const organization = await reportAction<Organization>(
      () =>
        client.organization.create({
          name,
          slug: organizationSlugFromName(name),
        }),
      options.json ?? false,
      spinner
    )
    if (options.json) {
      printJson({ organization })
    } else {
      console.log(`Created ${organization.name} (${organization.slug}).`)
    }
  })

export const organizationCommand = new Command("organization")
  .description("Manage your organizations")
  .addCommand(organizationListCommand)
  .addCommand(organizationInfoCommand)
  .addCommand(organizationCreateCommand)
