# Setup Guide

How to install skills and get each one working. Start here if you are setting up
for the first time.

---

## 1. Install Skills into a Project

Skills must be placed in `.claude/skills/` inside the project where you want to use
them. Two ways to do this:

**Option A — Use the sync-skills skill (recommended):**
Once Claude Code is open in your target project, run:
```
/sync-skills
```
This shallow-clones the Claude-Skills repo and copies all skill files into
`.claude/skills/` automatically. Requires `git` on PATH and an internet connection.
See [`skills/sync-skills.md`](../skills/sync-skills.md) for details.

**Option B — Copy manually:**
```bash
mkdir -p /your/project/.claude/skills
cp /path/to/Claude-Skills/skills/*.md /your/project/.claude/skills/
rm /your/project/.claude/skills/README.md /your/project/.claude/skills/INDEX.md
```

> **Tip:** Add `.claude/skills/` to `.gitignore` if you don't want skill files
> version-controlled inside each project.

---

## 2. Skills — Setup Requirements at a Glance

| Skill | Setup Required |
|---|---|
| [commit-message-helper](../skills/commit-message-helper.md) | None — works in any git repo |
| [pr-review](../skills/pr-review.md) | None — works in any git repo |
| [retry-limit](../skills/retry-limit.md) | Paste prompt into `CLAUDE.md` — no other setup |
| [sync-skills](../skills/sync-skills.md) | `git` on PATH; internet connection |
| [ios-notes](../skills/ios-notes.md) | macOS; Notes automation permission (one-time) |
| [gmail-multi-account](../skills/gmail-multi-account.md) | Gmail MCP server; Google Cloud OAuth credentials |
| [skylight-calendar](../skills/skylight-calendar.md) | Skylight MCP server; Skylight account credentials |

---

## 3. iOS Notes — Setup

**Requirements:** macOS with the Notes app installed and signed in to iCloud.

**One-time permission grant:**
1. Open **System Settings → Privacy & Security → Automation**
2. Find your terminal app (e.g., Terminal, iTerm2, or the app running Claude Code)
3. Enable the toggle for **Notes**

If you skip this step, macOS will prompt you the first time Claude runs an
`osascript` command targeting Notes — click **Allow**.

**Verify it works:**
```bash
osascript -e 'tell application "Notes" to get name of every note'
```
This should return a list of note names without an error.

No API keys, packages, or MCP servers are required for this skill.

---

## 4. Gmail MCP — Setup

The `gmail-multi-account` skill requires a locally-running Gmail MCP server.
The server lives in `mcp-servers/gmail/` in this repo.

### Prerequisites

- macOS or Linux with Node.js installed (`node --version` should succeed)
- One or more Gmail accounts you want to connect
- Claude Desktop or Claude Cowork with MCP support enabled

### Step 1: Create Google Cloud OAuth Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a
   project (e.g., `claude-gmail-mcp`)
2. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
3. Configure the OAuth consent screen:
   - APIs & Services → OAuth consent screen → External
   - Fill in app name → add scope `https://www.googleapis.com/auth/gmail.modify`
   - Save
4. Create credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Desktop app** → Download JSON
5. Store the credentials file:
   ```bash
   mkdir -p ~/.gmail-mcp
   mv ~/Downloads/client_secret_*.json ~/.gmail-mcp/gcp-oauth.keys.json
   ```

### Step 2: Register the MCP Server with Claude

Add the following to your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/Claude-Skills/mcp-servers/gmail/src/index.ts"]
    }
  }
}
```

Replace `/absolute/path/to/Claude-Skills` with the actual path on your machine
(e.g., `/Users/you/Claude-Skills`).

### Step 3: Authenticate Each Gmail Account

Restart Claude. Then ask Claude to authenticate each account:

> "Authenticate alice@gmail.com with the Gmail MCP server"

Claude will invoke the `gmail_auth` tool, which:
1. Starts a local HTTP server
2. Opens your browser to Google's OAuth consent page
3. Saves the token to `~/.gmail-mcp/tokens/<email>.json` after you approve

Repeat for each Gmail account. Tokens persist across restarts.

### Step 4: Verify

Ask Claude: *"List my 5 most recent unread emails from [your address]."*

If the MCP server is connected and authenticated, Claude will fetch and display them.

**Token expiry:** If Claude loses access later, re-run `gmail_auth` for the affected
account.

---

## 5. Skylight MCP — Setup

The `skylight-calendar` skill requires a locally-running Skylight MCP server.
The server lives in `mcp-servers/skylight/` in this repo.

### Prerequisites

- Node.js installed (`node --version` should succeed)
- A Skylight account (email and password)
- Your Skylight frame ID
- Claude Desktop or Claude Cowork with MCP support

### Step 1: Set Up Credentials

The Skylight MCP server reads credentials from environment variables. You can
set them in your shell profile or pass them directly in the Claude config:

- `SKYLIGHT_EMAIL` — your Skylight account email
- `SKYLIGHT_PASSWORD` — your Skylight account password
- `SKYLIGHT_FRAME_ID` — your Skylight frame/household ID
- `SKYLIGHT_TIMEZONE` — optional, defaults to `America/New_York`

### Step 2: Register the MCP Server with Claude

Add the following to your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "skylight": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/Claude-Skills/mcp-servers/skylight/src/index.ts"],
      "env": {
        "SKYLIGHT_EMAIL": "you@example.com",
        "SKYLIGHT_PASSWORD": "your-password",
        "SKYLIGHT_FRAME_ID": "your-frame-id",
        "SKYLIGHT_TIMEZONE": "America/New_York"
      }
    }
  }
}
```

Replace `/absolute/path/to/Claude-Skills` with the actual path on your machine.

### Step 3: Install Dependencies

```bash
cd /path/to/Claude-Skills/mcp-servers/skylight
npm install
```

### Step 4: Verify

Restart Claude and ask: *"Check my Skylight status."*

Claude will invoke the `skylight_status` tool and report the server is running
with your frame ID and authentication status.

**Token caching:** After the first successful login, the auth token is cached at
`~/.skylight-mcp/token.json`. If the token expires, the server automatically
re-authenticates on the next request.

---

## 6. MCP Servers in This Repo

| Server | Directory | Used by skill |
|---|---|---|
| Gmail | `mcp-servers/gmail/` | `gmail-multi-account` |
| Skylight | `mcp-servers/skylight/` | `skylight-calendar` |

---

## 7. Keeping Skills Up to Date

Run `/sync-skills` in any project at any time to pull the latest versions from this
repo. Existing skill files at the target path are overwritten automatically.
