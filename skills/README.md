# Skills

This directory contains Claude skill files — self-contained units that extend Claude's capabilities in Claude Code or Claude Cowork.

## Skill Types

| Type | Description |
|---|---|
| `integration` | Connects Claude to an external service via an MCP server or local tool |
| `prompt` | A reusable prompt template or system prompt pattern |
| `workflow` | A multi-step process pattern Claude follows to complete a task |

## File Format

Each skill is a Markdown file with YAML frontmatter followed by structured sections.
The frontmatter aligns with the Claude Code SKILL.md specification, with additional
repo-specific metadata fields.

### Frontmatter Fields

#### Claude Code / Cowork fields

These fields are interpreted by Claude Code (and where noted, Claude Cowork) when
skill files are placed in `.claude/skills/`.

```yaml
name: short-slug          # Display name; kebab-case, max 64 chars. Defaults to filename if omitted.
description: |            # What the skill does and when to use it. Claude uses this to decide
                          # when to apply the skill automatically. (Recommended)
argument-hint: "[args]"   # Hint shown in autocomplete for expected arguments. Example: "[branch]"
allowed-tools:            # Tools Claude may use without asking permission when this skill is active.
  - Bash                  # (Code only — not applicable in Cowork)
  - Read
user-invocable: true      # Show skill in the / menu. Set false for background knowledge. (Default: true)
disable-model-invocation: false  # Prevent Claude from auto-loading the skill. (Default: false)
model: sonnet             # Override model when skill is active. Values: sonnet, opus, haiku, inherit.
context: fork             # Run in a forked subagent context. Set to "fork" to enable.
hooks:                    # Lifecycle hooks scoped to this skill. See Claude Code hooks docs.
  PostToolUse: ...
```

#### Repo metadata fields

These fields are not interpreted by Claude Code but are used by this repo's index
and README to categorize and describe skills.

```yaml
title: Human-Readable Title   # Display name for INDEX.md and README.md
type: workflow                # integration | prompt | workflow
platform: code                # cowork | code | both
version: 1.0.0                # Semver — increment when the prompt changes meaningfully
mcp_servers:                  # (integration skills only) MCP server IDs required by this skill
  - gmail
```

### Body Sections

```markdown
## Invocation

How to trigger this skill. For Cowork: natural language phrases or a slash command.
For Code: the slash command (e.g., `/skill-name`) and any supported arguments.

## Prompt

The system or user prompt template. Use `$ARGUMENTS` for the full argument string,
`$0` / `$1` for positional args, or `{{variable_name}}` for named placeholders that
the user fills in before pasting into CLAUDE.md.

## Configuration

What the user must set up before this skill works (MCP servers, credentials, config files).
Reference setup instructions by linking to a plan file or external docs.
Write "None — no setup required." if nothing is needed.

## Examples

Concrete example invocations and expected behavior.

## Verification

Manual spot-checks to confirm the skill works as expected. Each check should be
independently runnable. Format:

- **Check name:** prompt or action → expected result

## Known Limitations

Any gaps, edge cases, or behaviors that differ from expectations.
```

---

## Template

Copy this to create a new skill:

```markdown
---
name: your-skill-name
title: Your Skill Title
type: prompt
platform: both
version: 1.0.0
description: One-line description.
argument-hint: "[optional-arg]"
allowed-tools:
  - Bash
---

## Invocation

Describe how to invoke this skill.

## Prompt

Your prompt template here. Use $ARGUMENTS for args, or {{variable}} for named inputs.

## Configuration

None — no setup required.

## Examples

**Example 1:** ...

**Example 2:** ...

## Verification

- **Basic check:** [prompt] → [expected result]

## Known Limitations

- None identified yet.
```
