# Plan: Gmail Multi-Account Email Skill (Claude Cowork, MCP)

> **Superseded.** The MCP server approach in Units 3–4 used a third-party npm package (`@gongrzhe/server-gmail-autoauth-mcp`) with supply chain risks. See `docs/plans/gmail-custom-mcp.md` for the replacement plan that builds a self-owned, auditable MCP server. The skill file format defined in Unit 1 and the GCP credentials setup in Unit 2 remain valid and reusable.

## Context

The built-in Gmail connector in Claude Cowork does not support multiple accounts. This plan delivers a Claude Cowork skill that reads email from multiple Gmail inboxes and supports label management, using a self-hosted Gmail MCP (Model Context Protocol) server as the integration layer. MCP is the standard protocol for Claude tool integrations and is the most direct, durable approach compared to AppleScript or direct IMAP scripting.

This is also the first integration-type skill in this repository, so Unit 1 defines the skill file format that all future skills will follow.

---

## Goal

A working Claude Cowork skill (`skills/gmail-multi-account.md`) that, when invoked, uses a locally-running Gmail MCP server to read email from multiple configured Gmail accounts and apply/remove labels — without relying on the built-in Gmail connector.

---

## Background

- **Platform**: Claude Cowork (not Claude Code)
- **User's Gmail accounts**: Already configured in macOS Mail.app
- **Setup tolerance**: Full (willing to create a Google Cloud project and complete OAuth flow)
- **Required capability**: Read emails + label/organize across multiple accounts
- **MCP server chosen**: `@gongrzhe/server-gmail-autoauth-mcp` — most documented, supports auto-OAuth, available via npm, designed for Claude Desktop/Cowork integration
- **No skill format exists yet** — this plan defines it as Unit 1

---

## Units

### Unit 1: Define the Claude Cowork Skill File Format

**Goal:** Establish a standard structure for Claude Cowork integration skills in this repo so this skill and all future skills are consistent and portable.

**Inputs:** Nothing — this is a design decision.

**Outputs:**
- `skills/README.md` — skill format spec with a copyable template
- Updated `docs/CLAUDE.md` — add `skills/` to the file map

**Steps:**
1. Create `skills/` directory with `skills/README.md`
2. Define frontmatter fields for integration skills:
   - `name`: short slug (e.g., `gmail-multi-account`)
   - `title`: human-readable name
   - `type`: `integration` | `prompt` | `workflow`
   - `platform`: `cowork` | `code` | `both`
   - `mcp_servers`: list of required MCP server IDs (for integration skills)
   - `version`: semver
   - `description`: one-line summary
3. Define body sections: **Invocation**, **Prompt**, **Configuration**, **Examples**, **Known Limitations**
4. Add `skills/` and `skills/<name>.md` rows to `docs/CLAUDE.md` file map
5. Add a note to root `CLAUDE.md` under "Repository Purpose" that skills live in `skills/`

**Done when:** `skills/README.md` exists with a complete, copyable template; `docs/CLAUDE.md` is updated.

---

### Unit 2: Google Cloud OAuth Credentials Setup (Manual / User-Executed)

**Goal:** Create the OAuth 2.0 credentials that the Gmail MCP server will use to authenticate with Gmail on behalf of each account.

**Inputs:** A Google account with access to Google Cloud Console.

**Outputs:**
- A Google Cloud project with the Gmail API enabled
- An OAuth 2.0 "Desktop app" client credentials JSON file (`gcp-oauth.keys.json`)
- Credentials file stored at `~/.gmail-mcp/gcp-oauth.keys.json`

**Steps:**
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com) and create a new project (e.g., `claude-gmail-mcp`)
2. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
3. Configure OAuth consent screen: APIs & Services → OAuth consent screen → External → fill in app name and support email → add scope `https://www.googleapis.com/auth/gmail.modify` → save
4. Create credentials: APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type: **Desktop app** → name it `gmail-mcp-client` → Download JSON
5. Create local config dir and place credentials:
   ```bash
   mkdir -p ~/.gmail-mcp
   mv ~/Downloads/client_secret_*.json ~/.gmail-mcp/gcp-oauth.keys.json
   ```

**Done when:** `~/.gmail-mcp/gcp-oauth.keys.json` exists and contains valid OAuth client credentials with Gmail API scope.

---

### Unit 3: Install and Configure the Gmail MCP Server

**Goal:** Install the Gmail MCP server locally and register it with Claude so it appears as an available tool.

**Inputs:** Output of Unit 2 (`~/.gmail-mcp/gcp-oauth.keys.json`), Node.js installed.

**Outputs:**
- Gmail MCP server registered in `~/Library/Application Support/Claude/claude_desktop_config.json`

**Steps:**
1. Locate or create the Claude config file at `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add the MCP server entry:
   ```json
   {
     "mcpServers": {
       "gmail": {
         "command": "npx",
         "args": ["-y", "@gongrzhe/server-gmail-autoauth-mcp"],
         "env": {
           "GMAIL_OAUTH_PATH": "/Users/YOUR_USERNAME/.gmail-mcp/gcp-oauth.keys.json",
           "GMAIL_CREDENTIALS_PATH": "/Users/YOUR_USERNAME/.gmail-mcp/credentials.json"
         }
       }
     }
   }
   ```
3. Replace `YOUR_USERNAME` with output of `whoami`
4. Restart Claude Desktop/Cowork
5. Verify the `gmail` MCP server appears in Claude's tool list

**Done when:** The Gmail MCP server is listed as an active tool in Claude Cowork.

---

### Unit 4: Authenticate Each Gmail Account

**Goal:** Run the OAuth flow for each Gmail account so the MCP server has stored tokens and can access each inbox.

**Inputs:** MCP server installed (Unit 3), Gmail accounts to add.

**Outputs:**
- OAuth tokens for each account stored in `~/.gmail-mcp/credentials.json`
- Each account accessible via the MCP server

**Steps:**
1. Restart Claude Cowork after Unit 3
2. Ask Claude: "List my recent emails from [first account email]" — a browser OAuth consent window will open
3. Complete the OAuth flow and grant access
4. Repeat for each additional Gmail account
5. Verify: ask Claude to list emails from each account by email address

**Done when:** Claude can list recent emails from each Gmail account when asked.

---

### Unit 5: Create the Skill File

**Goal:** Write the actual Claude Cowork skill file that encapsulates how to use the Gmail MCP server for multi-account reading and label management.

**Inputs:** Unit 1 (skill format), Unit 4 (working MCP server with accounts authenticated).

**Outputs:**
- `skills/gmail-multi-account.md` — the skill file
- `docs/BACKLOG.md` updated (mark "Define skill file format" complete)
- `README.md` updated with skill entry

**Done when:** `skills/gmail-multi-account.md` is complete and follows the format template; README updated.

---

### Unit 6: Verify End-to-End

**Goal:** Confirm the skill works as intended across multiple accounts with label operations.

**Inputs:** Units 1–5 complete.

**Outputs:** Verified working skill; any bugs fixed; Known Limitations section updated.

**Steps:**
1. Open Claude Cowork and invoke the skill for Account 1: ask for the 5 most recent unread emails
2. Invoke for Account 2: same query on the second inbox
3. Test search: "Find emails from [sender] in [account] from the last 7 days"
4. Test label: ask Claude to apply label "Processed" to a specific message — verify label appears in Gmail web UI
5. Test label removal: remove the "Processed" label
6. Update `## Known Limitations` in the skill file with any gaps found

**Done when:** All five test cases pass; skill file reflects any known limitations.

---

## Files Modified / Created

| File | Action |
|---|---|
| `skills/README.md` | Create — skill format spec |
| `skills/gmail-multi-account.md` | Create — the skill |
| `docs/CLAUDE.md` | Edit — add `skills/` to file map |
| `CLAUDE.md` | Edit — mention `skills/` directory |
| `README.md` | Edit — add skill entry |
| `docs/BACKLOG.md` | Edit — mark "Define skill file format" complete |
| `~/.gmail-mcp/gcp-oauth.keys.json` | Create (local, not committed) — OAuth credentials |
| `~/Library/Application Support/Claude/claude_desktop_config.json` | Edit (local) — MCP server registration |

---

## Status

| Unit | Status | Notes |
|---|---|---|
| Unit 1: Define skill file format | complete | `skills/README.md` created; `docs/CLAUDE.md` updated |
| Unit 2: Google Cloud OAuth setup | pending | Manual/user-executed step |
| Unit 3: Install & configure MCP server | pending | Requires Node.js; config added to skill file |
| Unit 4: Authenticate Gmail accounts | pending | Depends on Units 2 & 3 |
| Unit 5: Create skill file | complete | `skills/gmail-multi-account.md` created |
| Unit 6: Verify end-to-end | pending | Requires local MCP setup (Units 2–4) |

---

## Dependency Order

```
Unit 1 (format) ──────────────────────────────────────────────────────────┐
Unit 2 (OAuth creds) ──► Unit 3 (install MCP) ──► Unit 4 (auth accounts) ──► Unit 6 (verify)
                                                                            ▲
Unit 5 (skill file) ────────────────────────────────────────────────────────┘
```

Units 1, 2, and 5 can be done in parallel. Units 3–4–6 are sequential and depend on local machine setup.
