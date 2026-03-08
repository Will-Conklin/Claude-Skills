# Plans

This directory contains plan files for active and completed bodies of work.

## When to Create a Plan

Create a plan when a backlog item is ready to execute and the work spans more than one step or could be split across agents. Single-step changes don't need a plan — just do them.

## File Naming

```
plans/<short-slug>.md
```

Use lowercase kebab-case. Example: `plans/skill-file-format.md`.

## Plan Template

Copy this template when creating a new plan:

---

```markdown
# Plan: <Title>

## Goal

One paragraph describing what success looks like.

## Background

Any context, constraints, or prior decisions relevant to this plan.

## Units

Each unit is an independently completable chunk of work. Units can be done in order or delegated to separate agents.

### Unit 1: <Name>

**Goal:** What this unit achieves.
**Inputs:** What is needed to start (files, decisions, outputs from prior units).
**Outputs:** What is produced when complete.
**Steps:**
- Step A
- Step B

**Done when:** Acceptance criteria.

---

### Unit 2: <Name>

...

## Status

| Unit | Status | Notes |
|---|---|---|
| Unit 1: <Name> | pending / in progress / complete | |
| Unit 2: <Name> | pending | |
```

---

## Status Values

- `pending` — not started
- `in progress` — actively being worked
- `complete` — done and verified
- `blocked` — waiting on something external; add a note

## Archiving

When all units in a plan are complete, add `[COMPLETE]` to the filename or move it to `plans/archive/`. Do not delete plans — they serve as a record of decisions made.
