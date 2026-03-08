# Claude-Skills

A personal repository for developing and maintaining Claude skills — reusable prompts, tools, and workflows for use with Claude Code and Claude Cowork.

## Repository Purpose

This repo stores skills that extend Claude's capabilities. A "skill" is a self-contained unit that Claude can be instructed to apply: a slash command, a workflow pattern, a tool configuration, or a reusable prompt template. Skills live in the `skills/` directory; see `skills/README.md` for the format.

## Working in This Repo

### Picking Up Work

1. Check `BACKLOG.md` for prioritized items
2. Check `plans/` for active plans with scoped units of work
3. Each plan unit is self-contained and can be worked on independently or delegated to a separate agent

### Starting a New Body of Work

1. Add the idea to `BACKLOG.md` if it's not there yet
2. When ready to begin, create a plan file in `plans/` following the template in `plans/README.md`
3. Break the plan into discrete units — each unit should be independently completable

### Branch Conventions

- Feature branches: `claude/<short-description>-<id>`
- Work on the branch specified at the start of a session
- Never push to `main` directly

### Commit Conventions

- **One commit per unit of work.** Each plan unit or backlog item gets its own commit. Do not batch multiple units into a single commit.
- Commit as soon as a unit is complete and verified — do not accumulate changes across units before committing.
- If a single unit touches unrelated files (e.g., the skill file plus a BACKLOG.md update), that is fine — they are part of the same unit. What to avoid is mixing two separate units into one commit.

## Documentation

See `docs/CLAUDE.md` for the full documentation structure and how to keep it up to date.
