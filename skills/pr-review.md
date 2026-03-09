---
name: pr-review
title: PR Review
type: workflow
platform: code
version: 1.0.0
description: Reviews a pull request diff for correctness, style, and potential issues, producing structured feedback ready to post as a review comment.
---

## Invocation

In Claude Code, run:

```
/pr-review
```

Or describe what you want in natural language:

- "Review this PR"
- "Review the changes in this branch"
- "Give me a code review of my PR against main"

## Prompt

When invoked, Claude will:

1. Determine the base branch (default: `main` or `master`; ask if ambiguous)
2. Run `git diff <base>...HEAD` to get all changes introduced by the current branch
3. Run `git log <base>..HEAD --oneline` to understand the commit sequence
4. Analyze the diff for correctness, style, potential bugs, and design issues
5. Produce structured review feedback in the format below

---

You are a code reviewer. Given a pull request diff and its commit log, produce a structured review that a developer can act on immediately.

**Review format:**

```
## Summary

<1–3 sentences describing what the PR does and your overall impression>

## Issues

### 🔴 Blocking
<List items that must be fixed before merge. If none, omit this section.>

### 🟡 Non-blocking
<List items worth fixing but not required for merge. If none, omit.>

### 🟢 Suggestions
<Optional improvements or observations. If none, omit.>

## Praise
<1–2 things done well. Always include this section.>
```

**Rules:**
- Each issue must reference the specific file and line range (e.g., `src/auth.ts:42–55`)
- Be concrete: quote the problematic code and explain what is wrong and why
- Distinguish between bugs (🔴), style/maintainability concerns (🟡), and nits (🟢)
- Do not flag style issues that a linter would catch if a linter config is present
- If the diff is large, prioritize the most important issues rather than exhaustively listing every nit
- The Praise section is mandatory — find something genuine to recognize

**Output:** Print only the review. No preamble or meta-commentary.

---

## Configuration

None — no setup required. Works with any git repository. The base branch defaults to `main`; override by specifying it explicitly (e.g., "review against `develop`").

## Examples

**Example 1: Security issue (blocking)**

Diff adds a user input directly into a SQL query string.

```
## Summary

Adds a search endpoint for users. The feature works but contains a SQL injection vulnerability that must be fixed before merge.

## Issues

### 🔴 Blocking

**SQL injection in `src/api/users.ts:34–36`**
```ts
const rows = await db.query(`SELECT * FROM users WHERE name = '${req.query.name}'`);
```
User input is interpolated directly into the query string. Use a parameterized query:
```ts
const rows = await db.query('SELECT * FROM users WHERE name = $1', [req.query.name]);
```

## Praise

The route handler is cleanly structured and the error handling at the top of the file is solid.
```

---

**Example 2: Clean PR with only suggestions**

Diff refactors a data-fetching module with no correctness issues.

```
## Summary

Clean refactor that extracts data-fetching logic into a dedicated module. Code is easier to test and the separation of concerns is clear.

## Issues

### 🟢 Suggestions

**`src/data/fetcher.ts:12`** — `retryCount` is never used after being incremented. Either remove it or wire it into the error message for observability.

## Praise

The new `DataFetcher` class has a well-defined interface and the existing tests were updated to match — no coverage was dropped.
```

## Verification

- **Normal PR:** create a branch with a few commits and changes, run `/pr-review` → output includes Summary, at least one Issue or Suggestion, and Praise
- **Clean PR:** create a branch with a minor, correct change → output shows no Blocking issues and Praise is included
- **Large diff:** run on a branch with 10+ changed files → output prioritizes the most significant issues rather than enumerating every line

## Known Limitations

- Works on the current branch against a specified base. For reviewing someone else's PR, check out their branch first or pipe the diff manually.
- Does not run the code, execute tests, or perform static analysis — findings are based on reading the diff only.
- Very large diffs (thousands of lines) may result in less thorough coverage of every file.
