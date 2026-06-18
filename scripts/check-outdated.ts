#!/usr/bin/env node
/**
 * check-outdated.ts
 *
 * Scans all workspaces in the monorepo for outdated dependencies.
 * Reports what could be upgraded, with semver category (major/minor/patch).
 *
 * Usage:
 *   pnpm check:outdated          # human-readable table
 *   pnpm check:outdated --json   # JSON output for CI
 *
 * Exit codes:
 *   0  all up to date
 *   1  at least one outdated dep
 *   2  network/registry error
 *   3  parse/config error
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ANSI color codes (no chalk dep)
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

type Category = 'major' | 'minor' | 'patch' | 'unknown';

interface OutdatedDep {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  depType: string;
  category: Category;
}

interface Workspace {
  name: string;
  path: string;
}

interface Report {
  workspaces: Array<{
    workspace: Workspace;
    outdated: OutdatedDep[];
  }>;
  summary: {
    total: number;
    majors: number;
    minors: number;
    patches: number;
  };
}

/**
 * Parse a semver-ish string and return [major, minor, patch] or null.
 * Strips leading ^, ~, >=, etc.
 */
function parseSemver(v: string): [number, number, number] | null {
  const cleaned = v.replace(/^[\^~>=<\s]+/, '');
  const m = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function categorize(current: string, latest: string): Category {
  const c = parseSemver(current);
  const l = parseSemver(latest);
  if (!c || !l) return 'unknown';
  if (l[0] > c[0]) return 'major';
  if (l[1] > c[1]) return 'minor';
  if (l[2] > c[2]) return 'patch';
  return 'unknown';
}

/**
 * Discover all workspaces by scanning apps/* and packages/* for package.json.
 * Also includes the root if it has a package.json.
 */
function discoverWorkspaces(rootDir: string): Workspace[] {
  const workspaces: Workspace[] = [];

  // Root
  const rootPkg = join(rootDir, 'package.json');
  if (existsSync(rootPkg)) {
    const pkg = JSON.parse(readFileSync(rootPkg, 'utf-8'));
    if (pkg.name) workspaces.push({ name: pkg.name, path: '.' });
  }

  // apps/* and packages/*
  for (const parentDir of ['apps', 'packages']) {
    const parentPath = join(rootDir, parentDir);
    if (!existsSync(parentPath)) continue;

    for (const entry of readdirSync(parentPath)) {
      const entryPath = join(parentPath, entry);
      if (!statSync(entryPath).isDirectory()) continue;

      const pkgPath = join(entryPath, 'package.json');
      if (!existsSync(pkgPath)) continue;

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.name) {
        workspaces.push({ name: pkg.name, path: relative(rootDir, entryPath) });
      }
    }
  }

  return workspaces;
}

/**
 * Run pnpm outdated for a specific workspace and parse the JSON output.
 * Returns an array of outdated deps.
 */
function getOutdated(workspace: Workspace, rootDir: string): OutdatedDep[] {
  const isRoot = workspace.path === '.';
  const filter = isRoot ? '' : `--filter ${workspace.name}`;

  let stdout = '';
  try {
    stdout = execSync(`pnpm outdated ${filter} --format=json 2>/dev/null`, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: any) {
    // pnpm outdated exits non-zero (1) when there are outdated deps.
    // The JSON output is on stdout in that case.
    if (err.stdout && typeof err.stdout === 'string' && err.stdout.trim()) {
      stdout = err.stdout;
    } else if (
      err.message?.includes('ETIMEDOUT') ||
      err.message?.includes('ENOTFOUND') ||
      err.message?.includes('ECONNREFUSED')
    ) {
      console.error(`${RED}Network error: cannot reach npm registry${RESET}`);
      console.error(err.message);
      process.exit(2);
    } else {
      // Unknown error: no stdout, not a network issue
      // Could be the workspace doesn't have a lockfile or similar
      return [];
    }
  }

  if (!stdout.trim()) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    console.error(`${RED}Failed to parse pnpm outdated output${RESET}`);
    console.error(stdout.slice(0, 500));
    process.exit(3);
  }

  // pnpm outdated --format=json output shape:
  // {
  //   "workspace-name": {
  //     "dep-name": { "current": "...", "wanted": "...", "latest": "...", "depType": "..." }
  //   }
  // }
  // Or with --filter, it may return just the filtered workspace's deps (keyed by workspace name).
  let depMap: Record<string, any> = {};
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    // If the top-level values look like dep entries (have 'current' key), treat as direct map
    const topValues = Object.values(parsed);
    if (topValues.length > 0 && topValues.every((v: any) => v && typeof v === 'object' && 'current' in v)) {
      depMap = parsed;
    } else {
      // Otherwise, find the entry for our workspace
      depMap = parsed[workspace.name] || {};
    }
  }

  return Object.entries(depMap)
    .filter(([_, info]: [string, any]) => info && typeof info === 'object' && 'current' in info)
    .map(([name, info]: [string, any]) => ({
      name,
      current: String(info.current || 'unknown'),
      wanted: String(info.wanted || 'unknown'),
      latest: String(info.latest || 'unknown'),
      depType: String(info.depType || 'dependencies'),
      category: categorize(String(info.current || ''), String(info.latest || '')),
    }))
    .sort((a, b) => {
      const catOrder: Record<Category, number> = { major: 0, minor: 1, patch: 2, unknown: 3 };
      if (catOrder[a.category] !== catOrder[b.category]) {
        return catOrder[a.category] - catOrder[b.category];
      }
      return a.name.localeCompare(b.name);
    });
}

function formatHuman(report: Report): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`${BOLD}📦 Dependency outdated check${RESET}`);
  lines.push(`${DIM}Scanning all workspaces in the monorepo${RESET}`);
  lines.push('');

  if (report.workspaces.length === 0) {
    lines.push(`${YELLOW}No workspaces found.${RESET}`);
    return lines.join('\n');
  }

  for (const { workspace, outdated } of report.workspaces) {
    const displayName = workspace.name === 'deessejs' ? 'root' : workspace.name;
    lines.push(`${BOLD}${displayName}${RESET} ${DIM}(${workspace.path})${RESET}`);

    if (outdated.length === 0) {
      lines.push(`  ${GREEN}✓ all up to date${RESET}`);
    } else {
      const formatGroup = (deps: OutdatedDep[], label: string, color: string) => {
        if (deps.length === 0) return;
        lines.push(`  ${color}${BOLD}${label}${RESET} ${DIM}(${deps.length})${RESET}`);
        for (const dep of deps) {
          const current = `${color}${dep.current}${RESET}`;
          const latest = `${BOLD}${dep.latest}${RESET}`;
          lines.push(`    ${dep.name.padEnd(40)} ${current}  →  ${latest}`);
        }
      };

      const majors = outdated.filter((d) => d.category === 'major');
      const minors = outdated.filter((d) => d.category === 'minor');
      const patches = outdated.filter((d) => d.category === 'patch');
      const unknowns = outdated.filter((d) => d.category === 'unknown');

      formatGroup(majors, '🔴 major', RED);
      formatGroup(minors, '🟡 minor', YELLOW);
      formatGroup(patches, '🟢 patch', GREEN);
      if (unknowns.length > 0) {
        formatGroup(unknowns, '⚪ unknown', DIM);
      }
    }
    lines.push('');
  }

  // Summary
  const { total, majors, minors, patches } = report.summary;
  if (total === 0) {
    lines.push(`${GREEN}${BOLD}✓ All dependencies are up to date.${RESET}`);
  } else {
    const parts: string[] = [];
    if (majors > 0) parts.push(`${RED}${majors} major${RESET}`);
    if (minors > 0) parts.push(`${YELLOW}${minors} minor${RESET}`);
    if (patches > 0) parts.push(`${GREEN}${patches} patch${RESET}`);
    lines.push(`${BOLD}Summary:${RESET} ${total} outdated (${parts.join(', ')})`);
  }

  return lines.join('\n');
}

function showHelp() {
  console.log(`Usage: pnpm check:outdated [--json]

Scans all workspaces in the monorepo for outdated dependencies.

Options:
  --json    Output as JSON (for CI)
  -h, --help    Show this help

Exit codes:
  0  all up to date
  1  at least one outdated dep
  2  network/registry error
  3  parse/config error`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const jsonOutput = args.includes('--json');
  const rootDir = process.cwd();

  let workspaces: Workspace[];
  try {
    workspaces = discoverWorkspaces(rootDir);
  } catch (err: any) {
    console.error(`${RED}Failed to discover workspaces${RESET}`);
    console.error(err.message);
    process.exit(3);
  }

  const reports = workspaces.map((ws) => ({
    workspace: ws,
    outdated: getOutdated(ws, rootDir),
  }));

  let total = 0;
  let majors = 0;
  let minors = 0;
  let patches = 0;
  for (const r of reports) {
    for (const dep of r.outdated) {
      total++;
      if (dep.category === 'major') majors++;
      else if (dep.category === 'minor') minors++;
      else if (dep.category === 'patch') patches++;
    }
  }

  const report: Report = {
    workspaces: reports,
    summary: { total, majors, minors, patches },
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatHuman(report));
  }

  process.exit(total > 0 ? 1 : 0);
}

main();
