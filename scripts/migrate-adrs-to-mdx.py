#!/usr/bin/env python3
"""
Migrate ADRs from docs/engineering/architecture/decisions/
to apps/internal-documentation/content/docs/decisions/.

Each ADR-XXX-slug.md becomes ADR-XXX-slug.mdx in the destination.

Body policy:
- Drop the ADR-NNN prefix from the first H1 (it's redundant with the slug)
- Drop the 'Status' block (the docs site implies Active by default)
- Drop the 'Date' line (per ADR convention the date is implicit)
- Replace em dashes with '. ' per ADR-007
- Escape generic types in pipe tables (same fix as fumadocs.mdx)

The destination meta.json lists ADRs in numeric order.
"""
import re
import sys
from pathlib import Path

SRC = Path("docs/engineering/architecture/decisions")
DEST = Path("apps/internal-documentation/content/docs/decisions")

SKIP = {"README.md"}


def em_dash_to_period(text: str) -> str:
    return text.replace("—", ". ")


def extract_title(body: str) -> str:
    """Title is the H1 minus the 'NNNN - ' prefix."""
    for line in body.split("\n"):
        line = line.strip()
        if line.startswith("# "):
            # Strip leading "NNNN - " or "NNNN. " or "NNNN: "
            return re.sub(r"^\d{4}\s*[-:—–.]\s*", "", line[2:].strip())
    return ""


def extract_description(body: str) -> str:
    """First prose paragraph, with em dashes replaced."""
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


def strip_status_and_date(body: str) -> str:
    """Drop the Status and Date block at the top of the file."""
    out = []
    skip_next_blank = False
    in_meta = True
    for line in body.split("\n"):
        if in_meta and (line.startswith("**Status**") or line.startswith("**Date**")):
            skip_next_blank = True
            continue
        if skip_next_blank and not line.strip():
            skip_next_blank = False
            in_meta = False
            continue
        if in_meta and line.strip():
            # Past the meta block, switch off
            in_meta = False
        out.append(line)
    return "\n".join(out)


def strip_h1(body: str) -> str:
    """Drop the first H1 line and the blank line after it."""
    return re.sub(r"\n# [^\n]+\n\n", "\n", body, count=1)


def escape_pipe_table_types(body: str) -> str:
    """Replace TypeScript-style generics in pipe tables with plain English.

    'HTMLAttributes<X>' -> 'X element props' (heuristic)
    'CardProps' -> 'CardProps' (preserved as a type identifier)
    """
    lines = []
    for line in body.split("\n"):
        if "|" not in line:
            lines.append(line)
            continue
        # Split cells, replace any cell containing '<...>' with plain English
        cells = [c.strip() for c in line.split("|")]
        new_cells = []
        for c in cells:
            if "<" in c and ">" in c:
                # Extract the inner type, e.g. 'HTMLHeadingElement' from 'HTMLAttributes<HTMLHeadingElement>'
                m = re.search(r"<([A-Za-z][A-Za-z0-9]+)>", c)
                if m:
                    new_cells.append(f"{m.group(1).lower()} element props")
                else:
                    new_cells.append(c)
            else:
                new_cells.append(c)
        lines.append("| " + " | ".join(new_cells) + (" |" if line.endswith("|") else ""))
    return "\n".join(lines)


def make_mdx(title: str, description: str, body: str) -> str:
    title_yaml = title.replace("'", "''")
    description_yaml = description.replace("'", "''")
    fm = f"title: '{title_yaml}'\ndescription: '{description_yaml}'"
    return f"---\n{fm}\n---\n\n{body.strip()}\n"


def migrate_one(src: Path, dest: Path) -> None:
    text = src.read_text(encoding="utf-8")
    body = text.lstrip()
    title = extract_title(body)
    body_no_title = body.split("\n", 1)[1] if body.startswith("# ") else body
    description = extract_description(body_no_title)
    body = strip_status_and_date(body)
    body = strip_h1(body)
    body = em_dash_to_period(body)
    body = escape_pipe_table_types(body)
    # Post-fix: '.  ' before lowercase -> ', '
    body = re.sub(r"\.  (?=[a-z])", ", ", body)
    dest.write_text(make_mdx(title, description, body), encoding="utf-8")
    print(f"wrote {dest}")


def main() -> int:
    if not SRC.exists():
        print(f"missing {SRC}", file=sys.stderr)
        return 1
    DEST.mkdir(parents=True, exist_ok=True)
    for src in sorted(SRC.glob("*.md")):
        if src.name in SKIP:
            continue
        dest = DEST / (src.stem + ".mdx")
        migrate_one(src, dest)
    return 0


if __name__ == "__main__":
    sys.exit(main())
