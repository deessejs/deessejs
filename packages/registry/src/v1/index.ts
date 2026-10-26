export {
  TEMPLATE_DESCRIPTOR_SCHEMA_URL,
  TEMPLATE_PROJECT_TYPES,
  TemplateDescriptorV1Schema,
  parseTemplateDescriptor,
  type NormalizedTemplateDescriptorV1,
  type ParseTemplateDescriptorResult,
  type TemplateDescriptorDiagnostic,
  type TemplateDescriptorDiagnosticCode,
  type TemplateDescriptorV1,
} from "./template-descriptor.js"
export {
  createTemplateInstallationPlan,
  type CreateTemplateInstallationPlanResult,
  type PlannedTemplateFile,
  type TemplateInstallationDiagnostic,
  type TemplateInstallationDiagnosticCode,
  type TemplateInstallationPlan,
} from "./installation-plan.js"
export {
  createGitHubTemplateSourceAdapter,
  createTemplateSourceError,
  isTemplateSourceError,
  type GitHubTemplateSourceOptions,
  type TemplateSourceAdapter,
  type TemplateSourceDiagnosticCode,
  type TemplateSourceError,
  type TemplateSourceEntry,
  type TemplateSourceRequest,
  type TemplateSourceSnapshot,
} from "./template-source.js"
