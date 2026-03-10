---
name: sync-skills
title: Sync Skills
type: workflow
platform: code
version: 1.0.0
description: Fetch the latest skill files from the Claude-Skills repo and copy them into the current project's .claude/skills/ directory.
argument-hint: "[target-path]"
allowed-tools:
  - Bash
---

## Invocation

`/sync-skills` — copies skills into `.claude/skills/` (default).

`/sync-skills path/to/dir` — copies skills into the specified directory instead.

## Prompt

Fetch the latest skills from https://github.com/Will-Conklin/Claude-Skills and
copy them into $ARGUMENTS (default: `.claude/skills/`).

Steps:
1. Resolve the target path: use `$ARGUMENTS` if provided, otherwise default to
   `.claude/skills/` relative to the current working directory.
2. Create the target directory if it does not exist: `mkdir -p <target>`.
3. Clone the repo into a temp directory:
   ```
   TMPDIR=$(mktemp -d)
   git clone --depth 1 https://github.com/Will-Conklin/Claude-Skills "$TMPDIR/Claude-Skills"
   ```
4. Copy skill files — all `*.md` files from `skills/` except `README.md` and
   `INDEX.md`:
   ```
   for f in "$TMPDIR/Claude-Skills/skills/"*.md; do
     name=$(basename "$f")
     if [ "$name" != "README.md" ] && [ "$name" != "INDEX.md" ]; then
       cp "$f" "<target>/$name"
     fi
   done
   ```
5. Remove the temp directory: `rm -rf "$TMPDIR"`.
6. Report which files were copied and the full target path.

## Configuration

Requires `git` to be available on `PATH`. No credentials needed — the repo is
public.

If the target directory is inside a project that is already tracked by git, the
copied skill files will appear as untracked. Commit them if you want them version-
controlled in the project, or add `.claude/skills/` to `.gitignore` to keep them
local only.

## Examples

**Example 1 — Default target:**
```
/sync-skills
```
Copies all skills into `.claude/skills/` in the current project.

**Example 2 — Custom target:**
```
/sync-skills ~/dotfiles/claude/skills
```
Copies all skills into `~/dotfiles/claude/skills`.

## Verification

- **Basic check:** Run `/sync-skills` in any project → `.claude/skills/` is
  created (if absent) and contains the skill `.md` files (e.g.,
  `commit-message-helper.md`, `pr-review.md`). `README.md` and `INDEX.md` are
  **not** present.
- **Custom path:** Run `/sync-skills /tmp/test-skills` → files appear in
  `/tmp/test-skills/`; temp clone dir is removed.

## Known Limitations

- Requires an internet connection and `git` on PATH.
- Always fetches from the `main` branch (shallow clone). There is no option to
  pin to a specific tag or commit without modifying the prompt.
- Existing skill files at the target path are overwritten without confirmation.
