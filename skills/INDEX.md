# Skill Index

All skills in this repository, organized by category. For the skill file format, see `skills/README.md`.

---

## Development Skills

Skills for software development workflows.

| Name | Type | Platform | Description | File |
|---|---|---|---|---|
| Commit Message Helper | workflow | Code | Generates well-structured git commit messages from staged diffs. | [commit-message-helper.md](commit-message-helper.md) |
| PR Review | workflow | Code | Reviews a pull request diff for correctness, style, and potential issues, producing structured feedback ready to post as a review comment. | [pr-review.md](pr-review.md) |

---

## Personal Productivity Skills

Skills for personal-use tasks unrelated to software development.

| Name | Type | Platform | Description | File |
|---|---|---|---|---|
| Gmail Multi-Account Reader | integration | Cowork | Read, search, and label emails across multiple Gmail inboxes using a local Gmail MCP server. | [gmail-multi-account.md](gmail-multi-account.md) |
| iOS Notes | workflow | Code | Create, read, and update iOS/macOS Notes from the terminal using AppleScript, with chunked read/write to handle large notes. | [ios-notes.md](ios-notes.md) |

---

## Prompt Skills

Skills that provide a reusable prompt template or system prompt pattern.

| Name | Type | Platform | Description | File |
|---|---|---|---|---|
| Retry Limit | prompt | Code | Instructs Claude to stop retrying after N consecutive failures on a task and surface the blocker to the user instead. | [retry-limit.md](retry-limit.md) |

---

## Adding a Skill to This Index

When you add a new skill file to `skills/`, add a row to the appropriate table above. Use the `name`, `platform`, and `description` fields from the skill's YAML frontmatter. Add a `type` column value matching the frontmatter `type` field.
