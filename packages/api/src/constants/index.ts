// Public surface of the constants layer. One file per concept
// (Rule 1 from ADR-002). Importers should use this barrel rather
// than reaching into the individual files.
export { API_BASE_PATH, API_BASE_PATH_V1, API_RPC_PATH, API_AUTH_PATH, API_HEALTH_PATH, API_READY_PATH } from "./base-path.js"
export { logger } from "./logger.js"
export { VERSION, MIN_SUPPORTED_VERSION } from "./version.js"
