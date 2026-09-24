/**
 * Minimal GitHub REST client.
 *
 * Scope: only the two endpoints currently consumed
 * (`GET /repos/{owner}/{repo}` and `GET /repos/{owner}/{repo}/readme`).
 * Not a general-purpose GitHub SDK; do not extend without a consumer
 * that needs the new shape.
 *
 * Auth: the GITHUB_TOKEN env var (optional) lifts the anonymous rate
 * limit from 60 req/h to 5000 req/h. In production on Vercel, set
 * this as a project secret.
 */
import type { GitHubRepo } from "./types.js";
export declare const fetchRepo: (owner: string, repo: string, token: string | undefined) => Promise<GitHubRepo>;
export declare const fetchReadme: (owner: string, repo: string, token: string | undefined) => Promise<string | undefined>;
//# sourceMappingURL=client.d.ts.map