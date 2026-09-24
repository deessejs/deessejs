const GITHUB_API = "https://api.github.com";
const headers = (token) => {
    const base = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "deessejs-api",
    };
    if (token)
        base.Authorization = `Bearer ${token}`;
    return base;
};
export const fetchRepo = async (owner, repo, token) => {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
        headers: headers(token),
    });
    if (!response.ok) {
        throw new Error(`GitHub /repos/${owner}/${repo} returned ${response.status}`);
    }
    return response.json();
};
export const fetchReadme = async (owner, repo, token) => {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, { headers: headers(token) });
    if (response.status === 404)
        return undefined;
    if (!response.ok) {
        throw new Error(`GitHub /repos/${owner}/${repo}/readme returned ${response.status}`);
    }
    const payload = (await response.json());
    if (payload.encoding !== "base64")
        return undefined;
    // GitHub returns base64 with embedded newlines every 60 chars.
    return Buffer.from(payload.content, "base64").toString("utf8");
};
