import { serverEnv } from "@workspace/env/server";
import { fetchReadme, fetchRepo } from "../github/client.js";
/**
 * Resolve the `labels` field to a guaranteed `string[]`.
 *
 * Preference order:
 *   1. `repo.topics` when GitHub returns at least one topic.
 *   2. `entry.labels` when the registry author curated labels.
 *   3. `[]` as the final fallback. Never `undefined`.
 *
 * Exported for unit testing — see `packages/api/tests/unit/enrich.test.ts`.
 */
export const resolveLabels = (repoTopics, entryLabels) => {
    if (Array.isArray(repoTopics) && repoTopics.length > 0)
        return repoTopics;
    if (Array.isArray(entryLabels))
        return entryLabels;
    return [];
};
/**
 * Enrich each registry entry with live data from GitHub. Failures
 * (network, rate limit, 404 on the readme) throw — the caller is
 * expected to translate that into a 503 response.
 */
export async function enrich(registry) {
    const token = serverEnv.GITHUB_TOKEN;
    const enriched = await Promise.all(registry.map(async (entry) => {
        const [repo, readme] = await Promise.all([
            fetchRepo(entry.owner, entry.repo, token),
            fetchReadme(entry.owner, entry.repo, token),
        ]);
        // Prefer the live repo name over the registry name when they differ.
        // In practice the registry name is editorial and matches the repo,
        // but this keeps the wire shape aligned with GitHub's canonical name.
        return {
            ...entry,
            name: repo.name,
            description: repo.description ?? entry.description,
            license: repo.license?.spdx_id ??
                repo.license?.name ??
                entry.license,
            labels: resolveLabels(repo.topics, entry.labels),
            updatedAt: repo.pushed_at,
            stars: repo.stargazers_count,
            readme,
            cloneUrl: repo.html_url,
        };
    }));
    return enriched;
}
