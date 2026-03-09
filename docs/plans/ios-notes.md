# Plan: iOS Notes Skill

## Goal

Deliver a `workflow`-type Claude Code skill (`skills/ios-notes.md`) that lets a user ask Claude to create, read, append to, or replace sections of a note in the macOS/iOS Notes app. The skill handles large notes by reading and writing in character-offset chunks, and supports iOS Notes formatting conventions including checklists, headings, tables, and @mentions.

## Background

- **Platform:** iOS Notes syncs via iCloud and is accessible on macOS through the Notes app. Claude Code (a CLI tool running on macOS) can drive it via AppleScript or JXA (JavaScript for Automation) using `osascript`.
- **No API keys or MCP servers required** — this is a pure workflow skill.
- **Formatting:** In AppleScript, the `body` property of a note is HTML. The `plaintext` property gives plain text. Setting `body` to an HTML string updates the note. iOS Notes supports: bold title (first line), paragraphs, headings (`<h1>`, `<h2>`), checklists (`<ul class="checklist"><li class="todo">item</li></ul>`), and tables (`<table>`).
- **Size limitation mitigation:** Large `osascript -e '...'` inline invocations can hit shell argument-length limits. Solution: write a temp JXA `.js` script and run it as `osascript /tmp/claude-notes-$$.js`, then delete it.
- **Chunked reads:** For large notes, read `note.body()` in slices via JXA `.substring(offset, offset+chunkSize)` in a loop.
- **@mentions:** AppleScript can insert `@Name` text into a note body. The Notes app converts this to a live mention link when the user taps/clicks it in the app — the text insertion itself is enough to surface the mention. Claude inserts `@Name` in the appropriate HTML context and notes that resolution happens in the app UI.

## Units

### Unit 1: Write the skill file

**Goal:** Create `skills/ios-notes.md` covering all supported operations with accurate JXA/AppleScript patterns.

**Inputs:** This plan; existing skills as style reference (`skills/pr-review.md`, `skills/commit-message-helper.md`).

**Outputs:** `skills/ios-notes.md`

**Steps:**

1. Create `skills/ios-notes.md` with frontmatter:
   ```yaml
   name: ios-notes
   title: iOS Notes
   type: workflow
   platform: code
   version: 1.0.0
   description: Create, read, and update iOS/macOS Notes from the terminal using AppleScript, with chunked read/write to handle large notes.
   ```

2. Write the **Invocation** section: `/ios-notes` or natural language ("add a checklist item to my meeting note", "create a note titled X").

3. Write the **Prompt** section. Instruct Claude to:
   - Use JXA scripts run via `osascript` for all operations.
   - Write temp scripts to `/tmp/claude-notes-$$.js`, run them, delete them.
   - Default chunk size: 50,000 characters.

   Cover these operations with concrete JXA patterns:

   **Create note:**
   ```js
   const app = Application('Notes');
   app.includeStandardAdditions = true;
   const folder = app.defaultAccount.folders.byName('Notes');
   app.make({new: 'note', withProperties: {name: 'Title', body: '<b>Title</b>\n<p>Body text.</p>'}, at: folder});
   ```

   **Read note (small):**
   ```
   osascript -e 'tell app "Notes" to get plaintext of note "Title"'
   ```

   **Read note (large, chunked):** JXA loop reading `.body().substring(offset, offset+50000)` until `offset >= body.length`.

   **Append to note:** JXA script — get `note.body()`, concatenate new HTML content, set `note.body = newBody`.

   **Replace a section:** JXA script — get full body, locate heading/anchor, splice replacement content, set `note.body = updatedBody`.

   **Checklist items:** HTML `<ul class="checklist"><li class="todo">item text</li></ul>`. Completed items: `<li class="checked">`.

   **Headings:** `<h1>`, `<h2>`, `<h3>`.

   **Tables:** Standard HTML `<table><tr><td>` tags.

   **@mentions:** Insert `@Name` as plain text in the HTML body. Inform the user that the Notes app will convert it to a live mention when they open the note and tap/click the name. Example: `<p>Action item for @Jane: review the proposal.</p>`.

   **Formatting conversion:** When the user provides markdown-style input, convert before setting body:
   - `# Heading` → `<h1>Heading</h1>`
   - `- [ ] item` → `<li class="todo">item</li>` (wrapped in `<ul class="checklist">`)
   - `- [x] item` → `<li class="checked">item</li>`
   - `@Name` → `@Name` (pass through as-is)
   - `**bold**` → `<b>bold</b>`

4. Write the **Configuration** section:
   - Requires macOS with the Notes app installed and signed in to iCloud.
   - Grant Terminal (or the app running Claude Code) automation access to Notes in System Settings → Privacy & Security → Automation.
   - No additional packages or credentials required.

5. Write **Examples** covering: create, append checklist item, @mention, read large note.

6. Write **Verification** checks.

7. Write **Known Limitations**:
   - No attachment (image/file) support via AppleScript.
   - @mentions appear as plain text until the user interacts with them in the Notes UI.
   - Table rendering is basic; complex layouts may not display as expected on iOS.
   - iCloud sync delay: changes may not appear on iOS immediately after writing.
   - Automation permission prompt appears on first use — user must approve it.

**Done when:** `skills/ios-notes.md` exists, runs without errors in a manual spot-check (`osascript -e 'tell app "Notes" to get name of every note'` succeeds), and covers all documented operations.

---

### Unit 2: Update skills index and root README

**Goal:** Register the new skill in `skills/INDEX.md` and `README.md`.

**Inputs:** Completed `skills/ios-notes.md` from Unit 1.

**Outputs:** Updated `skills/INDEX.md` and `README.md`.

**Steps:**
- In `skills/INDEX.md`, add a row for `ios-notes` under the Workflow section.
- In root `README.md`, add a row in the skills summary table.

**Done when:** Both files list `ios-notes`.

---

### Unit 3: Mark backlog item complete

**Goal:** Mark the iOS Notes item in `docs/BACKLOG.md` as done.

**Inputs:** Completed Units 1–2.

**Outputs:** Updated `docs/BACKLOG.md`.

**Steps:**
- Change `- [ ] **iOS Notes skill**` to `- [x] **iOS Notes skill**`.

**Done when:** Item is `[x]` in the backlog.

---

## Status

| Unit | Status | Notes |
|---|---|---|
| Unit 1: Write the skill file | pending | |
| Unit 2: Update index and README | pending | |
| Unit 3: Mark backlog item complete | pending | |
