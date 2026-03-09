---
name: ios-notes
title: iOS Notes
type: workflow
platform: code
version: 1.0.0
description: Create, read, and update iOS/macOS Notes from the terminal using AppleScript, with chunked read/write to handle large notes.
argument-hint: "[action and note name]"
allowed-tools:
  - Bash
---

## Invocation

In Claude Code, run:

```
/ios-notes
```

Or describe what you want in natural language:

- "Create a note titled 'Meeting Notes' with these action items"
- "Append a checklist to my note called 'Shopping List'"
- "Read my note 'Project Ideas'"
- "Add @Jane to the action items in my 'Sprint Planning' note"
- "Replace the 'Status' section in my 'Weekly Review' note"

## Prompt

When invoked, Claude will drive the macOS Notes app via JXA (JavaScript for Automation) using `osascript`. All operations write a temp script to disk, execute it, then delete it — this avoids shell argument-length limits on large payloads.

---

You are operating the macOS Notes app via JXA and `osascript`. Follow these rules for every operation:

**Temp script pattern (use for all operations):**

```bash
TMPFILE=$(mktemp /tmp/claude-notes-XXXXXX.js)
cat > "$TMPFILE" << 'SCRIPT'
// JXA code here
SCRIPT
osascript "$TMPFILE"
rm -f "$TMPFILE"
```

**Default chunk size for large notes:** 50,000 characters.

---

### Create note

```js
const app = Application('Notes');
app.includeStandardAdditions = true;
// Use defaultAccount directly to avoid locale-dependent folder names
const note = app.make({
  new: 'note',
  withProperties: {
    name: 'Title',
    body: '<b>Title</b>\n<p>Body text.</p>'
  },
  at: app.defaultAccount.notes
});
note.name(); // confirm creation
```

### Read note (small — under 50,000 characters)

```bash
osascript -e 'tell application "Notes" to get plaintext of note "Title"'
```

### Read note (large — chunked)

```js
const app = Application('Notes');
const note = app.defaultAccount.notes.whose({name: 'Title'})[0];
const body = note.body();
const chunkSize = 50000;
let offset = 0;
const chunks = [];
while (offset < body.length) {
  chunks.push(body.substring(offset, offset + chunkSize));
  offset += chunkSize;
}
// Return all chunks joined; Claude reassembles on the caller side
const result = chunks.join('');
result;
```

### Append to note

```js
const app = Application('Notes');
const note = app.defaultAccount.notes.whose({name: 'Title'})[0];
const existing = note.body();
const addition = '<p>New paragraph.</p>';
note.body = existing + '\n' + addition;
```

For large notes, read in chunks first (see above), reconstruct the full body in memory, append, then set `note.body` once.

### Replace a section

```js
const app = Application('Notes');
const note = app.defaultAccount.notes.whose({name: 'Title'})[0];
let body = note.body();
// Locate the section by its heading anchor and replace up to the next heading
const start = body.indexOf('<h2>Status</h2>');
const end = body.indexOf('<h2>', start + 1); // next heading, or -1 if last section
const before = body.substring(0, start);
const after = end === -1 ? '' : body.substring(end);
const replacement = '<h2>Status</h2>\n<p>Updated content.</p>\n';
note.body = before + replacement + after;
```

---

### HTML formatting reference

All `note.body` values are HTML. Use these mappings:

| User input | HTML to write |
|---|---|
| `# Heading` | `<h1>Heading</h1>` |
| `## Heading` | `<h2>Heading</h2>` |
| `### Heading` | `<h3>Heading</h3>` |
| `**bold**` | `<b>bold</b>` |
| `*italic*` | `<i>italic</i>` |
| `- [ ] item` | `<li class="todo">item</li>` (inside `<ul class="checklist">`) |
| `- [x] item` | `<li class="checked">item</li>` (inside `<ul class="checklist">`) |
| `@Name` | `@Name` (pass through as plain text) |
| Tables | Standard `<table><tr><td>` HTML |

**Checklist example:**

```html
<ul class="checklist">
  <li class="todo">Buy milk</li>
  <li class="checked">Buy eggs</li>
  <li class="todo">Buy bread</li>
</ul>
```

**Table example:**

```html
<table>
  <tr><th>Name</th><th>Status</th></tr>
  <tr><td>Alice</td><td>Done</td></tr>
  <tr><td>Bob</td><td>In progress</td></tr>
</table>
```

**@mentions:** Insert `@Name` as plain text inside any HTML element. The Notes app converts it to a live mention link when the user opens the note and taps/clicks the name. Example:

```html
<p>Action item for @Jane: review the proposal by Friday.</p>
```

---

### Markdown conversion

When the user provides markdown-style input, convert before writing to Notes:

1. Strip fenced code blocks and write them as `<pre><code>...</code></pre>`
2. Convert headings (`#`, `##`, `###`) to `<h1>`, `<h2>`, `<h3>`
3. Convert `- [ ]` / `- [x]` lines to checklist `<li>` elements, wrapping consecutive checklist lines in a single `<ul class="checklist">`
4. Convert `**text**` to `<b>text</b>` and `*text*` to `<i>text</i>`
5. Convert blank lines to paragraph breaks using `<p>` tags
6. Pass `@Name` tokens through unchanged

---

## Configuration

- Requires macOS with the Notes app installed and signed in to iCloud.
- Grant your terminal (or the app running Claude Code) automation access to Notes: **System Settings → Privacy & Security → Automation**, then enable the toggle for Notes under your terminal app.
- No additional packages, API keys, or MCP servers required.

---

## Examples

**Example 1: Create a note with a checklist**

User: "Create a note titled 'Groceries' with: milk, eggs, bread (all unchecked)"

```bash
TMPFILE=$(mktemp /tmp/claude-notes-XXXXXX.js)
cat > "$TMPFILE" << 'SCRIPT'
const app = Application('Notes');
app.make({
  new: 'note',
  withProperties: {
    name: 'Groceries',
    body: '<b>Groceries</b>\n<ul class="checklist"><li class="todo">Milk</li><li class="todo">Eggs</li><li class="todo">Bread</li></ul>'
  },
  at: app.defaultAccount.notes
});
SCRIPT
osascript "$TMPFILE"
rm -f "$TMPFILE"
```

---

**Example 2: Append a checklist item**

User: "Add 'Call dentist' to my 'Tasks' note"

```bash
TMPFILE=$(mktemp /tmp/claude-notes-XXXXXX.js)
cat > "$TMPFILE" << 'SCRIPT'
const app = Application('Notes');
const note = app.defaultAccount.notes.whose({name: 'Tasks'})[0];
const body = note.body();
// Find existing checklist and append, or add a new one
const item = '<li class="todo">Call dentist</li>';
if (body.includes('class="checklist"')) {
  // Insert before the last </ul> to append into the existing checklist
  const lastClose = body.lastIndexOf('</ul>');
  note.body = body.substring(0, lastClose) + item + body.substring(lastClose);
} else {
  note.body = body + '\n<ul class="checklist">' + item + '</ul>';
}
SCRIPT
osascript "$TMPFILE"
rm -f "$TMPFILE"
```

---

**Example 3: @mention in a note**

User: "Add an action item for @Sarah to review the Q1 report in my 'Sprint Review' note"

```bash
TMPFILE=$(mktemp /tmp/claude-notes-XXXXXX.js)
cat > "$TMPFILE" << 'SCRIPT'
const app = Application('Notes');
const note = app.defaultAccount.notes.whose({name: 'Sprint Review'})[0];
note.body = note.body() + '\n<p>Action item for @Sarah: review the Q1 report.</p>';
SCRIPT
osascript "$TMPFILE"
rm -f "$TMPFILE"
```

The `@Sarah` text will become a live mention link when Sarah opens the note in the Notes app.

---

**Example 4: Read a large note in chunks**

User: "Read my 'Research Notes' note — it's very long"

```bash
TMPFILE=$(mktemp /tmp/claude-notes-XXXXXX.js)
cat > "$TMPFILE" << 'SCRIPT'
const app = Application('Notes');
const note = app.defaultAccount.notes.whose({name: 'Research Notes'})[0];
const body = note.body();
const chunkSize = 50000;
let offset = 0;
const chunks = [];
while (offset < body.length) {
  chunks.push(body.substring(offset, offset + chunkSize));
  offset += chunkSize;
}
const result = chunks.join('\n---CHUNK---\n');
result;
SCRIPT
osascript "$TMPFILE"
rm -f "$TMPFILE"
```

Split the output on `---CHUNK---` to reconstruct the full note content. Present the plaintext or summarize as the user requested.

---

## Verification

- **Notes app access:** `osascript -e 'tell application "Notes" to get name of every note'` returns a list without an error.
- **Create:** Run Example 1. Open Notes — a "Groceries" note appears with three unchecked checklist items.
- **Append:** Run Example 2 against a real note. Verify the new item appears without overwriting existing content.
- **Chunked read:** Run Example 4 against a note with more than 50,000 characters. Verify all chunks reassemble to the full content.
- **Automation permission:** If a dialog appears asking "Do you want to allow [Terminal] to control Notes?", click Allow. Subsequent runs will not prompt.

---

## Known Limitations

- No attachment support (images, files, PDFs) — AppleScript/JXA cannot add attachments to notes.
- @mentions appear as plain text until the user opens the note and taps/clicks the name in the Notes UI.
- Table rendering is basic; complex layouts (merged cells, nested tables) may not display as expected on iOS.
- iCloud sync delay: changes written on macOS may take a few seconds to a minute to appear on iOS devices.
- The automation permission dialog appears on first use per terminal app — the user must click Allow once.
- Searching by note name with `.whose({name: '...'})` returns the first match if multiple notes share the same name. For unique targeting, consider searching by creation date or using a unique title.
