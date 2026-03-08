# Documentation Structure

This file describes how documentation is organized in this repository and how to keep it current.

## File Map

| File / Directory | Purpose |
|---|---|
| `CLAUDE.md` | Root instructions for Claude — repo overview, workflow conventions |
| `docs/CLAUDE.md` | This file — documentation structure and maintenance guide |
| `BACKLOG.md` | Prioritized list of ideas and work items not yet planned |
| `plans/README.md` | Template and conventions for plan files |
| `plans/<name>.md` | Individual plan files for active or completed bodies of work |

## Maintenance Rules

- **BACKLOG.md** is the first stop for any new idea. Keep it honest — if something is done, remove it or mark it complete.
- **Plans** are created when a backlog item is ready to be executed. Move the item from `BACKLOG.md` into a plan file, do not duplicate it.
- **Plan files** should stay accurate as work progresses. Mark units complete as they are finished.
- **This file** should be updated whenever a new top-level documentation file or directory is added to the repo.

## Adding a New Skill

When a new skill is built and merged:

1. Add an entry in the root `README.md` describing it briefly
2. If the skill came from a plan, mark the plan units complete
3. Archive or close the plan if all units are done

## Adding a New Document Type

If a new category of document is introduced (e.g., `retrospectives/`, `research/`):

1. Add it to the File Map table above
2. Add a brief note in `CLAUDE.md` if agents need to know about it when picking up work
