---
name: gmail-multi-account
title: Gmail Multi-Account Reader
type: integration
platform: cowork
version: 1.0.0
description: Read, search, and label emails across multiple Gmail inboxes using a local Gmail MCP server.
mcp_servers:
  - gmail
---

## Invocation

Invoke with natural language in Claude Cowork. Examples:

- "Check my email" / "What's in my inbox?"
- "Check my work email" / "Check my personal Gmail"
- "Find emails from {{sender}} in {{account}}"
- "Label this email as {{label}}"
- `/gmail` (if configured as a slash command)

To target a specific account, include the email address or a label you use for it (e.g., "work email", "personal Gmail").

## Prompt

Use the following as a system prompt addition when invoking this skill, or paste it directly into Cowork at the start of an email-focused session:

---

You have access to a Gmail MCP server that can read and organize email across multiple Gmail accounts. When the user asks about email, use the Gmail tools to:

1. **List recent emails**: Fetch unread or recent messages from the requested account. Default to the last 10 messages unless the user specifies otherwise. Present results as a concise list: sender, subject, date, and a one-sentence summary.

2. **Search emails**: Use Gmail search syntax (e.g., `from:alice@example.com after:2024/01/01 is:unread`) to find specific messages. Report the count and list matching messages.

3. **Read a message**: When the user asks about a specific email, retrieve the full message body and summarize it. Offer to reply or take an action.

4. **Apply a label**: When asked to label, tag, or organize a message, use the MCP tool to add the specified Gmail label. Confirm the action after completing it.

5. **Remove a label**: When asked to remove a label or archive a message, use the MCP tool to modify labels accordingly.

**Multi-account behavior**: When the user doesn't specify an account, ask which account they mean if more than one is configured. When they say "work email" or "personal Gmail", map that to the appropriate account email address (the user will tell you these mappings on first use; remember them for the session).

**Account references**: Each Gmail account is identified by its email address (e.g., `alice@gmail.com`). Pass this as the `account` parameter to MCP tool calls that support it.

---

## Configuration

This skill requires a locally-running Gmail MCP server connected to Claude Cowork. Follow the setup steps below before using this skill.

### Prerequisites

- macOS with Node.js installed (`node --version` should succeed)
- One or more Gmail accounts you want to connect
- Claude Desktop or Claude Cowork with MCP support

### Step 1: Create Google Cloud OAuth Credentials

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com) and create a project (e.g., `claude-gmail-mcp`)
2. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
3. Configure OAuth consent screen: APIs & Services → OAuth consent screen → External → fill in app name → add scope `https://www.googleapis.com/auth/gmail.modify` → Save
4. Create credentials: APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type: **Desktop app** → Download JSON
5. Store the credentials:
   ```bash
   mkdir -p ~/.gmail-mcp
   mv ~/Downloads/client_secret_*.json ~/.gmail-mcp/gcp-oauth.keys.json
   ```

### Step 2: Register the MCP Server with Claude

The MCP server lives in `mcp-servers/gmail/` in this repo. Add the following to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["tsx", "/path/to/Claude-Skills/mcp-servers/gmail/src/index.ts"]
    }
  }
}
```

Replace `/path/to/Claude-Skills` with the absolute path to this repo (e.g. `~/Claude-Skills`).

### Step 3: Authenticate Each Gmail Account

Restart Claude. Ask Claude to run the `gmail_auth` tool with your email address:

> "Authenticate alice@gmail.com with the Gmail MCP server"

Claude will invoke `gmail_auth`, which starts a local HTTP server, opens your browser to Google's OAuth consent page, and saves the token to `~/.gmail-mcp/tokens/<email>.json` once you approve access.

Repeat for each Gmail account. Tokens are stored per-account and persist across restarts.

### Verification

Ask Claude: "List my 5 most recent unread emails from [your email address]." If the MCP server is connected, Claude will fetch and display them.

## Examples

**Read inbox:**
> "What are my last 5 unread emails in alice@gmail.com?"

Claude will list: sender, subject, date, one-line summary for each message.

---

**Search across an account:**
> "Find emails from bob@example.com in my work inbox from the last 2 weeks"

Claude uses Gmail search syntax: `from:bob@example.com after:YYYY/MM/DD` and returns matching messages.

---

**Apply a label:**
> "Label that last email as 'Action Required'"

Claude calls the MCP label tool to add the `Action Required` label. If the label doesn't exist in Gmail, it will be created automatically.

---

**Remove a label / archive:**
> "Archive that email" / "Remove the 'Needs Reply' label from the thread about the Q3 budget"

Claude calls the MCP tool to remove the specified label or move the message out of Inbox.

---

**Multi-account summary:**
> "Give me a summary of unread emails across all my accounts"

Claude fetches unread counts and recent messages from each configured account and presents a combined summary.

## Verification

- **Read inbox:** "List my 5 most recent unread emails from [address]" → Claude returns a list of up to 5 messages with sender, subject, date, and summary
- **Search:** "Find emails from [sender] in the last 7 days" → Claude uses Gmail search syntax and returns matching messages or reports none found
- **Label:** "Label that last email as 'Processed'" → Claude calls the MCP label tool and confirms; label appears in Gmail web UI
- **Multi-account prompt:** with two accounts configured and no account specified → Claude asks which account to use

## Known Limitations

- `gmail_update_labels` accepts Gmail label IDs, not display names. Use `INBOX`, `UNREAD`, `STARRED`, or the opaque ID for custom labels (visible in Gmail settings URLs). A `gmail_list_labels` tool could be added in a future iteration.
- OAuth tokens expire; if Claude loses access, re-run `gmail_auth` for the affected account.
- The Gmail API `gmail.modify` scope allows reading and labeling but not permanent deletion — use `gmail.trash` to move to trash if needed (requires updating the OAuth scope and re-authenticating).
- Multi-part MIME messages (HTML-only bodies) may return an empty body — the snippet field is used as a fallback.
- This skill has not been verified end-to-end; complete Unit 6 of `docs/plans/gmail-custom-mcp.md` to validate.
