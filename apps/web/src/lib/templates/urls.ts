/**
 * URL helpers for the templates routes.
 *
 * Single source of truth for outbound URLs that appear on more than one
 * templates page. Centralising the constants here keeps /templates and
 * /templates/[slug] in sync (the previous setup had each page declaring
 * its own copy of SUBMIT_TEMPLATE_URL).
 */

/**
 * Deep link to the GitHub "Add Template" Issue Template. Used by the
 * "Submit your template" CTAs on /templates and /templates/[slug].
 *
 * The `labels=template` query string tags the issue for triage; the
 * rest of the form is configured on the .github/ISSUE_TEMPLATE side.
 */
export const SUBMIT_TEMPLATE_URL =
  "https://github.com/deessejs/deessejs/issues/new?template=add-template.yml&labels=template"
