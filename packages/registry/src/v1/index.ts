export {
  BLOCK_DESCRIPTOR_SCHEMA_URL,
  BlockDescriptorV1Schema,
  parseBlockDescriptor,
  type BlockDescriptorV1,
  type BlockDescriptorDiagnostic,
  type BlockDescriptorDiagnosticCode,
  type ParseBlockDescriptorResult,
} from "./block-descriptor.js"
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
  createTemplateDescriptorInfo,
  createTemplateInstallationPlan,
  type CreateTemplateDescriptorInfoResult,
  type CreateTemplateInstallationPlanResult,
  type PlannedTemplateFile,
  type TemplateDescriptorInfo,
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
  type TemplateDescriptorSourceSnapshot,
  type TemplateSourceRequest,
  type TemplateSourceSnapshot,
} from "./template-source.js"
export {
  PROJECT_CONFIG_SCHEMA_URL,
  ProjectConfigV1Schema,
  parseProjectConfig,
  type ProjectConfigV1,
  type ProjectConfigDiagnostic,
  type ProjectConfigDiagnosticCode,
  type ParseProjectConfigResult,
} from "./project-config.js"
