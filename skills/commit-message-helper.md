---
name: commit-message-helper
title: Commit Message Helper
type: workflow
platform: code
version: 1.0.0
description: Generates well-structured git commit messages from staged diffs.
---

## Invocation

In Claude Code, run:

```
/commit-message-helper
```

Or describe what you want in natural language:

- "Write a commit message for my staged changes"
- "Generate a commit message"
- "What should my commit message be?"

## Prompt

When invoked, Claude will:

1. Run `git diff --cached` to inspect all staged changes
2. Run `git log --oneline -10` to infer the project's commit message style
3. Analyze the diff to understand what changed and why
4. Generate a commit message following the format below

---

You are a commit message writer. Given a staged diff and recent commit history, produce a commit message following these rules:

**Format:**
```
<type>(<scope>): <short summary>

<body — optional, only if context is needed>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`

**Rules:**
- Summary line: imperative mood, ≤72 characters, no trailing period
- Scope: the affected module, file, or feature area (omit if unclear or too broad)
- Body: explain *why*, not *what* — only include if the diff doesn't speak for itself
- If the diff touches multiple unrelated concerns, note that and suggest splitting the commit
- Match the style of recent commits in the log if they follow a consistent convention

**Output:** Print only the commit message, ready to copy-paste. Do not include commentary or explanation unless the user asks for it.

---

## Configuration

None — no setup required. Works with any git repository.

## Examples

**Example 1: Simple feature addition**

Staged diff adds a new `--dry-run` flag to a CLI tool.

```
feat(cli): add --dry-run flag to preview changes without applying them
```

---

**Example 2: Bug fix with context**

Staged diff fixes an off-by-one error in pagination logic.

```
fix(pagination): correct off-by-one error in page boundary calculation

Previous logic excluded the last item on each page when total items
were evenly divisible by page size.
```

---

**Example 3: Multi-concern diff**

Staged diff reformats a file and also changes a function's behavior.

```
Note: this diff mixes formatting changes with a behavioral fix in
process_order(). Consider splitting into two commits:
  1. style: reformat order_processor.py
  2. fix(orders): handle zero-quantity line items in process_order
```

## Verification

- **Staged changes present:** stage any file change, run `/commit-message-helper` → Claude produces a commit message with a valid type, scope, and summary line ≤72 chars
- **Nothing staged:** run with no staged changes → Claude notes that nothing is staged and suggests running `git add` first
- **Multi-concern diff:** stage changes to two unrelated files → Claude either produces a single message covering both or flags that the diff should be split
- **Style matching:** in a repo with conventional commits history, run the skill → output type prefix matches the project's existing style

## Known Limitations

- Works best when changes are already staged (`git add`). If nothing is staged, Claude will note that and suggest staging files first.
- Does not automatically commit — it only generates the message. Run `git commit -m "..."` yourself or confirm with Claude Code's `/commit` skill.
- Scope inference is heuristic; review and adjust the scope if Claude guesses incorrectly.
