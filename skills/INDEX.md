# Skill Index

All skills in this repository, organized by type. For the skill file format, see `skills/README.md`.

---

## Integration Skills

Skills that connect Claude to external services via MCP servers or local tools.

| Name | Platform | Description | File |
|---|---|---|---|
| Gmail Multi-Account Reader | Cowork | Read, search, and label emails across multiple Gmail inboxes using a local Gmail MCP server. | [gmail-multi-account.md](gmail-multi-account.md) |

---

## Workflow Skills

Skills that define a multi-step process Claude follows to complete a task.

| Name | Platform | Description | File |
|---|---|---|---|
| Commit Message Helper | Code | Generates well-structured git commit messages from staged diffs. | [commit-message-helper.md](commit-message-helper.md) |
| iOS Notes | Code | Create, read, and update iOS/macOS Notes from the terminal using AppleScript, with chunked read/write to handle large notes. | [ios-notes.md](ios-notes.md) |
| PR Review | Code | Reviews a pull request diff for correctness, style, and potential issues, producing structured feedback ready to post as a review comment. | [pr-review.md](pr-review.md) |

---

## Prompt Skills

Skills that provide a reusable prompt template or system prompt pattern.

| Name | Platform | Description | File |
|---|---|---|---|
| *(none yet)* | | | |

---

## Adding a Skill to This Index

When you add a new skill file to `skills/`, add a row to the appropriate table above. Use the `name`, `platform`, and `description` fields from the skill's YAML frontmatter.
