#!/usr/bin/env python3
"""
Migrate knowledge-base entries from docs/engineering/architecture/knowledge-base/
to apps/internal-documentation/content/docs/knowledge-base/.

Mirrors the source layout: better-auth/, hono/, orpc/, plus the root
files commander.md and fumadocs.md. The root files become sections
of the Knowledge Base tab via the parent meta.json.

Each entry:
- Filename: keep the .md, rename to .mdx
- Frontmatter: title from first H1, description from first paragraph
- Body: strip the 'cardinal rule' preamble (which is KB README territory)
- Em dashes replaced with '. ' per ADR-007
"""
import re
import sys
from pathlib import Path

SRC = Path("docs/engineering/architecture/knowledge-base")
DEST = Path("apps/internal-documentation/content/docs/knowledge-base")

# (source_path_relative_to_SRC, dest_path_relative_to_DEST)
MIGRATIONS = [
    ("better-auth/hono-integration.md", "better-auth/hono-integration.mdx"),
    ("better-auth/test-utils.md", "better-auth/test-utils.mdx"),
    ("commander.md", "commander.mdx"),
    ("fumadocs.md", "fumadocs.mdx"),
    ("hono/middleware.md", "hono/middleware.mdx"),
    ("hono/testing.md", "hono/testing.mdx"),
    ("orpc/hono-adapter.md", "orpc/hono-adapter.mdx"),
    ("orpc/middleware.md", "orpc/middleware.mdx"),
    ("orpc/testing-mocking.md", "orpc/testing-mocking.mdx"),
]


def em_dash_to_period(text: str) -> str:
    return text.replace("—", ". ")


def extract_title(body: str) -> str:
    for line in body.split("\n"):
        line = line.strip()
        if line.startswith("# "):
            return line[2:].strip()
    return ""


def extract_description(body: str) -> str:
    """First prose paragraph, stripped of em dashes."""
    for line in body.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        if line.startswith(">"):
            continue
        if line.startswith("**"):
            continue
        if line.startswith("- "):
            continue
        if line.startswith("```"):
            continue
        return em_dash_to_period(line)
    return ""


def strip_h1(body: str) -> str:
    """Drop the first H1 line plus the blank line after it."""
    return re.sub(r"\n# [^\n]+\n\n", "\n", body, count=1)


def make_mdx(title: str, description: str, body: str) -> str:
    title_yaml = title.replace("'", "''")
    description_yaml = description.replace("'", "''")
    fm = f"title: '{title_yaml}'\ndescription: '{description_yaml}'"
    return f"---\n{fm}\n---\n\n{body.strip()}\n"


def migrate_one(src_rel: str, dest_rel: str) -> None:
    src = SRC / src_rel
    dest = DEST / dest_rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    text = src.read_text(encoding="utf-8")
    body = text.lstrip()
    title = extract_title(body)
    body_no_title = body.split("\n", 1)[1] if body.startswith("# ") else body
    description = extract_description(body_no_title)
    body = strip_h1(body)
    body = em_dash_to_period(body)
    # Fix the '. ' artefact: lowercase continuation needs ', '
    body = re.sub(r"\.  (?=[a-z])", ", ", body)
    dest.write_text(make_mdx(title, description, body), encoding="utf-8")
    print(f"wrote {dest}")


def main() -> int:
    if not SRC.exists():
        print(f"missing {SRC}", file=sys.stderr)
        return 1
    for src_rel, dest_rel in MIGRATIONS:
        migrate_one(src_rel, dest_rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
