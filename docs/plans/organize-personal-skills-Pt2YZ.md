# Plan: Organize Personal Skills

## Goal

Improve skill discoverability in `skills/INDEX.md` by separating personal-productivity skills from developer-workflow skills. Currently all workflow and integration skills are grouped only by their technical type (workflow, integration, prompt), which makes it harder to scan for skills by use-case. Adding a "Personal Productivity" category makes it immediately clear which skills serve personal life tasks vs. software development work.

## Background

The repo currently has five skills across three type-based sections in INDEX.md:

- **Integration Skills**: Gmail Multi-Account Reader
- **Workflow Skills**: Commit Message Helper, iOS Notes, PR Review
- **Prompt Skills**: Retry Limit

iOS Notes and Gmail are personal-productivity tools unrelated to software development. Grouping them together under a "Personal Productivity" section makes the index easier to scan and sets a clear pattern for future personal skills.

## Units

### Unit 1: Reorganize skills/INDEX.md

**Goal:** Add a "Personal Productivity" section and move ios-notes and gmail-multi-account into it.

**Inputs:** Current `skills/INDEX.md`.

**Outputs:** Updated `skills/INDEX.md` with four sections:
- Development Skills (formerly "Workflow Skills" minus ios-notes)
- Personal Productivity (ios-notes, gmail-multi-account)
- Prompt Skills (unchanged)

**Steps:**
1. Rename "Workflow Skills" → "Development Skills" and remove the ios-notes row.
2. Remove the gmail-multi-account row from "Integration Skills". If Integration Skills is now empty, remove the section.
3. Add a new "Personal Productivity" section with both skills.
4. Update section descriptions to reflect the new groupings.

**Done when:** INDEX.md has a "Personal Productivity" section containing ios-notes and gmail-multi-account; the remaining sections contain only developer-facing skills.

---

### Unit 2: Add sync-skills skill

**Goal:** Create a skill that copies the latest skills from this repo into any project's `.claude/skills/` directory.

**Inputs:** This repo's `skills/` directory; GitHub repo URL.

**Outputs:**
- `skills/sync-skills.md` — the skill file
- `skills/INDEX.md` updated with sync-skills row
- `README.md` updated with sync-skills row

**Steps:**
1. Write `skills/sync-skills.md` with a prompt that shallow-clones this repo into a temp dir, copies `skills/*.md` (excluding README.md and INDEX.md) to the target path, then removes the temp dir.
2. Add a row to `skills/INDEX.md` under Development Skills.
3. Add a row to `README.md` skills table.

**Done when:** `skills/sync-skills.md` exists, is registered in INDEX.md and README.md, and its prompt correctly describes the sync steps.

---

## Status

| Unit | Status | Notes |
|---|---|---|
| Unit 1: Reorganize skills/INDEX.md | complete | Added Personal Productivity section; merged Integration into it |
| Unit 2: Add sync-skills skill | complete | `skills/sync-skills.md` created; registered in INDEX.md and README.md |
