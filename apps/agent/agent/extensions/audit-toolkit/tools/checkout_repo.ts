import { disableTool } from "eve/tools"

/**
 * Disable the audit-toolkit__checkout_repo tool at the root mount.
 * Only declared specialists run checkout_repo. Allowing the root to do so
 * would let a hostile mention prompt trigger an audit against arbitrary
 * repositories, leaking the App identity into those checkouts.
 */
export default disableTool()