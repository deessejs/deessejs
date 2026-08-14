#!/usr/bin/env python3
"""
Migrate rules from docs/engineering/architecture/rules/*.md
to apps/internal-documentation/content/docs/*.mdx.

Rules of the migration:
- Filename: keep the 0002-XXXX-slug.md style, rename to .mdx
- Frontmatter: title (from the first # heading), description (from the first paragraph), no status (the rule is "Active" by default)
- Body: strip internal code references per the KB cardinal rule
- Internal code excerpts are kept but the prose that names them is generalised
- Em dashes are replaced with a period + space (per ADR-007)
"""
import re
import sys
from pathlib import Path

RULES_DIR = Path("docs/engineering/architecture/rules")
DEST_DIR = Path("apps/internal-documentation/content/docs")

SKIP = {"README.md", "INDEX.md"}


def em_dash_to_period(s: str) -> str:
    """Replace em dash with a period + space, per ADR-007."""
    return s.replace("—", ". ")


def first_paragraph(body: str) -> str:
    """Extract the first non-heading paragraph as description."""
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
        if line.startswith("-"):
            continue
        if line.startswith("```"):
            continue
        # First prose paragraph
        return em_dash_to_period(line)
    return ""


def title_from_heading(body: str) -> str:
    """Find the first # heading and return its content."""
    for line in body.split("\n"):
        line = line.strip()
        if line.startswith("# "):
            return line[2:].strip()
    return ""


def strip_internal_refs(md: str) -> str:
    """Strip internal code references per the KB cardinal rule.

    The rule is "no internal identifier names". Code excerpts are kept
    (they show the pattern), but we do not refer to our specific files.
    Lines like "see packages/api/src/foo.ts" are stripped.
    """
    out_lines = []
    for line in md.split("\n"):
        # Drop lines that mention paths like packages/, apps/, or workspace aliases
        if re.search(r"packages/(api|auth|cli|web|app|docs|email|contracts|database|env|ui)/", line):
            continue
        if re.search(r"apps/(api|auth|cli|web|app|docs|email|contracts|database|env|ui)/", line):
            continue
        if "@workspace/" in line and "import" not in line:
            # Drop prose references to @workspace paths
            continue
        out_lines.append(line)
    return "\n".join(out_lines)


def strip_status(body: str) -> str:
    """Remove the first two leading lines that hold Status and Date."""
    lines = body.split("\n")
    out = []
    skipped = 0
    for line in lines:
        if skipped < 2 and line.startswith(("**Status**", "**Date**")):
            skipped += 1
            continue
        out.append(line)
    return "\n".join(out)


def rewrite_body(body: str) -> str:
    """Apply all the transformations."""
    body = strip_status(body)
    body = strip_internal_refs(body)
    body = em_dash_to_period(body)
    return body


def generate_mdx(title: str, description: str, body: str) -> str:
    """Generate the MDX file content with frontmatter."""
    # Manual YAML to avoid the yaml dependency
    title_yaml = title.replace("'", "''")
    description_yaml = description.replace("'", "''")
    fm = f"title: '{title_yaml}'\ndescription: '{description_yaml}'"
    return f"---\n{fm}\n---\n\n{body.strip()}\n"


def migrate_one(src: Path, dest: Path) -> None:
    text = src.read_text(encoding="utf-8")
    # Split frontmatter from body. Source has no frontmatter; rule starts at "#"
    body = text.lstrip()
    title = title_from_heading(body)
    body_no_title = body.split("\n", 1)[1] if body.startswith("# ") else body
    description = first_paragraph(body_no_title)
    rewritten = rewrite_body(body)
    dest.write_text(generate_mdx(title, description, rewritten), encoding="utf-8")
    print(f"wrote {dest} (title='{title[:60]}')")


def main() -> int:
    if not RULES_DIR.exists():
        print(f"missing {RULES_DIR}", file=sys.stderr)
        return 1
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    for src in sorted(RULES_DIR.glob("*.md")):
        if src.name in SKIP:
            continue
        dest = DEST_DIR / (src.stem + ".mdx")
        if dest.exists():
            print(f"skipping {dest} (already exists)")
            continue
        migrate_one(src, dest)
    return 0


if __name__ == "__main__":
    sys.exit(main())
