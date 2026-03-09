---
name: retry-limit
title: Retry Limit
type: prompt
platform: code
version: 1.0.0
description: Instructs Claude to stop retrying after N consecutive failures on a task and surface the blocker to the user instead.
---

## Invocation

Add the prompt below to your project's `CLAUDE.md` to make it a persistent behavior rule.
Alternatively, paste it into a conversation to apply it for the current session only.

## Prompt

```
When attempting to accomplish a task, track how many consecutive times you have
tried and failed to make meaningful progress. After {{limit | default: 3}}
failed attempts on the same task:

1. Stop — do not attempt the same approach again.
2. Explain clearly: what you tried, why each attempt failed, and what is blocking
   progress.
3. Ask the user how to proceed or whether they want to try a different approach.

A "failed attempt" means the action did not produce the intended result and you
are about to try the same (or substantially similar) approach again.
Do not count attempts that use meaningfully different strategies.
```

## Configuration

**Threshold:** The default limit is 3 consecutive failures. To change it, replace
`{{limit | default: 3}}` with a hard-coded number when pasting into `CLAUDE.md`.
For example, to stop after 2 failures:

```
...After 2 failed attempts on the same task:...
```

**Where to add it:** Paste the prompt into your `CLAUDE.md` under a section like
`## Behavior Rules` or `## Working Constraints`. No other setup is required.

## Examples

**Example 1 — Stuck test fix:**
Claude attempts to fix a failing test three times (tweak assertion, change mock,
adjust import) without success. On the fourth attempt it stops, lists what it
tried, explains that the root cause appears to be in a dependency it cannot
modify, and asks the user whether to skip the test, investigate the dependency,
or try a different fixture.

**Example 2 — Repeated tool failure:**
Claude tries to run a build command and it fails three times with the same
environment error. Instead of retrying, it stops, reports the error message and
what it already checked, and asks the user to confirm the environment is set up
correctly or provide the missing configuration.

## Verification

- **Basic check:** Tell Claude to fix a broken command, then give it a command
  that always fails. After the configured number of attempts, Claude should stop
  and explain the blocker rather than retrying.
- **Strategy variance:** Verify that Claude does *not* stop early when each
  attempt uses a genuinely different approach — only repeated similar attempts
  should count toward the limit.

## Known Limitations

- Claude self-counts attempts based on context; it may miscount in very long
  conversations where earlier attempts scroll out of the active window.
- The limit applies per task within a session. Claude resets its count when a
  new task begins, which it infers from context.
- This skill changes default behavior through instruction, not enforcement.
  A hook-based approach would provide harder guarantees if needed.
