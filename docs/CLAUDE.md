# Documentation Structure

This file describes how documentation is organized in this repository and how to keep it current.

## File Map

| File / Directory | Purpose |
|---|---|
| `CLAUDE.md` | Root instructions for Claude — repo overview, workflow conventions |
| `docs/CLAUDE.md` | This file — documentation structure and maintenance guide |
| `docs/SETUP.md` | User setup guide — how to install skills and configure each MCP |
| `docs/BACKLOG.md` | Prioritized list of ideas and work items not yet planned |
| `docs/plans/README.md` | Template and conventions for plan files |
| `docs/plans/<name>.md` | Individual plan files for active or completed bodies of work |
| `skills/README.md` | Skill file format spec and copyable template |
| `skills/<name>.md` | Individual skill files — one per skill |

## Maintenance Rules

- **docs/BACKLOG.md** is the first stop for any new idea. Keep it honest — if something is done, remove it or mark it complete.
- **Plans** are created when a backlog item is ready to be executed. Move the item from `docs/BACKLOG.md` into a plan file, do not duplicate it.
- **Plan files** should stay accurate as work progresses. Mark units complete as they are finished.
- **This file** should be updated whenever a new top-level documentation file or directory is added to the repo.

## Adding a New Skill

Before writing a skill file, check `skills/README.md` for the current frontmatter
spec — it documents both the Claude Code SKILL.md fields and repo metadata fields.
The spec should be treated as the source of truth; if official Claude Code docs
diverge from it, update `skills/README.md` first, then apply changes to existing
skills before writing the new one.

When a new skill is built and merged:

1. Add the skill file to `skills/` following the format in `skills/README.md`
2. Add a row to the appropriate table in `skills/INDEX.md`
3. Add an entry in the root `README.md`
4. If the skill came from a plan, mark the plan units complete
5. Archive or close the plan if all units are done

## Adding a New Document Type

If a new category of document is introduced (e.g., `retrospectives/`, `research/`):

1. Add it to the File Map table above
2. Add a brief note in `CLAUDE.md` if agents need to know about it when picking up work
