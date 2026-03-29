# Backlog

Prioritized list of ideas and work items. Items here have not yet been planned.
When an item is ready to execute, move it into a plan file under `docs/plans/`.

## Format

```
- [ ] **Item title** — brief description of the goal and any relevant context
```

Use `[ ]` for open items and `[x]` for completed items (or just delete completed ones).

---

## Items

<!-- Add new backlog items below. Keep highest priority at the top. -->

- [x] **Define skill file format** — establish a standard structure for skills (metadata, prompt, examples, usage instructions) so skills are portable and self-documenting
- [x] **First skill: commit message helper** — a skill that generates well-structured git commit messages from staged diffs, as a starting example to validate the skill format
- [x] **Skill index** — a searchable index or registry of all skills in the repo, making it easy to discover what's available
- [x] **PR review skill** — a workflow skill that reviews a pull request diff and produces structured, actionable feedback (blocking issues, non-blocking concerns, suggestions, praise)
- [x] **iOS Notes skill** — a skill for creating and updating iOS notes that respects iOS note formatting conventions (title as first line, body text, checklists, tables) and can read/write note content in chunks to avoid hitting size limitations when working with large notes
- [x] **Skylight Calendar MCP** — custom MCP server for interacting with Skylight smart calendar (events, chores, lists, tasks, family). Core features only; Plus features (meals, rewards) deferred.
- [ ] **PR review skill: stale documentation check** — extend the pr-review skill to flag documentation (README, inline comments, docstrings, changelogs) that appears out of sync with the code changes in the diff. For example, a function signature change with no corresponding doc update, or a README that references a flag that was removed.
- [x] **Retry-limit hook or skill** — a hook or skill that detects when Claude is repeatedly failing to accomplish a task and either alerts the user or halts further attempts. Repeated failures on the same task often indicate a deeper issue (wrong approach, missing context, environmental problem) that Claude cannot self-correct; surfacing this early prevents wasted turns and helps the user course-correct.
