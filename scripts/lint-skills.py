#!/usr/bin/env python3
"""
Skill file linter.

Validates every .md file in skills/ (except README.md and INDEX.md) against
the skill format spec:
  - Required frontmatter fields are present and non-empty
  - Required body sections (## headings) are present

Exit code: 0 if all files pass, 1 if any errors are found.
"""

import sys
import re
from pathlib import Path

SKILLS_DIR = Path(__file__).parent.parent / "skills"

REQUIRED_FRONTMATTER = ["name", "title", "type", "platform", "version", "description"]
REQUIRED_SECTIONS = ["Invocation", "Prompt", "Configuration", "Examples", "Verification", "Known Limitations"]

SKIP_FILES = {"README.md", "INDEX.md"}

VALID_TYPES = {"integration", "prompt", "workflow"}
VALID_PLATFORMS = {"cowork", "code", "both"}


def parse_frontmatter(text):
    """Return (fields dict, body text) or (None, None) if no frontmatter."""
    if not text.startswith("---"):
        return None, None
    end = text.find("\n---", 3)
    if end == -1:
        return None, None
    fm_text = text[3:end].strip()
    body = text[end + 4:].strip()
    fields = {}
    for line in fm_text.splitlines():
        if ":" in line and not line.startswith(" ") and not line.startswith("-"):
            key, _, val = line.partition(":")
            fields[key.strip()] = val.strip()
    return fields, body


def lint_file(path):
    errors = []
    text = path.read_text()

    fields, body = parse_frontmatter(text)

    if fields is None:
        errors.append("missing YAML frontmatter (file must start with ---)")
        return errors

    # Required frontmatter fields
    for field in REQUIRED_FRONTMATTER:
        if field not in fields:
            errors.append(f"frontmatter: missing required field '{field}'")
        elif not fields[field]:
            errors.append(f"frontmatter: field '{field}' is empty")

    # Controlled vocabulary
    if "type" in fields and fields["type"] not in VALID_TYPES:
        errors.append(f"frontmatter: 'type' must be one of {sorted(VALID_TYPES)}, got '{fields['type']}'")
    if "platform" in fields and fields["platform"] not in VALID_PLATFORMS:
        errors.append(f"frontmatter: 'platform' must be one of {sorted(VALID_PLATFORMS)}, got '{fields['platform']}'")

    # name matches filename
    if "name" in fields and fields["name"] and fields["name"] != path.stem:
        errors.append(f"frontmatter: 'name' ({fields['name']}) does not match filename ({path.stem})")

    # Required body sections
    headings = set(re.findall(r"^## (.+)$", body, re.MULTILINE))
    for section in REQUIRED_SECTIONS:
        if section not in headings:
            errors.append(f"body: missing required section '## {section}'")

    return errors


def main():
    skill_files = sorted(
        p for p in SKILLS_DIR.glob("*.md") if p.name not in SKIP_FILES
    )

    if not skill_files:
        print("No skill files found.")
        sys.exit(0)

    total_errors = 0
    for path in skill_files:
        errors = lint_file(path)
        if errors:
            print(f"\n{path.name}:")
            for e in errors:
                print(f"  - {e}")
            total_errors += len(errors)
        else:
            print(f"  ok  {path.name}")

    print()
    if total_errors:
        print(f"FAIL: {total_errors} error(s) across {len(skill_files)} file(s)")
        sys.exit(1)
    else:
        print(f"PASS: {len(skill_files)} skill file(s) valid")
        sys.exit(0)


if __name__ == "__main__":
    main()
