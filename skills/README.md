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

### Frontmatter Fields

```yaml
---
name: short-slug          # kebab-case identifier, matches filename
title: Human-Readable Title
type: integration         # integration | prompt | workflow
platform: cowork          # cowork | code | both
version: 1.0.0
description: One-line summary of what this skill does.
mcp_servers:              # (integration skills only) list of required MCP server IDs
  - gmail
---
```

### Body Sections

```markdown
## Invocation

How to trigger this skill. For Cowork: natural language phrases or a slash command.
For Code: the slash command (e.g., `/skill-name`).

## Prompt

The system or user prompt template. Use `{{variable_name}}` for user-supplied inputs.

## Configuration

What the user must set up before this skill works (MCP servers, credentials, config files).
Reference setup instructions by linking to a plan file or external docs.

## Examples

Concrete example invocations and expected behavior.

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
---

## Invocation

Describe how to invoke this skill.

## Prompt

Your prompt template here. Use {{variable}} for inputs.

## Configuration

List any required setup steps here, or write "None — no setup required."

## Examples

**Example 1:** ...

**Example 2:** ...

## Known Limitations

- None identified yet.
```
