# Plan: Custom Gmail MCP Server

## Goal

Build a self-owned MCP server (TypeScript/Node.js) that handles Gmail OAuth 2.0 authentication and exposes read + label tools to Claude. Replaces the third-party `@gongrzhe/server-gmail-autoauth-mcp` package with a pinned, auditable, locally-maintained implementation. The server supports multiple Gmail accounts and is registered with Claude Desktop/Cowork.

## Background

- The existing plan (`docs/plans/gmail-multi-account-mcp.md`) uses a third-party npm package for the MCP server. The supply chain risk (unknown author, `npx -y` at runtime, no version pin) motivated this replacement.
- Google OAuth 2.0 for a Desktop app (installed app flow) is well-documented and produces refresh tokens that survive restarts.
- MCP servers communicate with Claude over stdio using the MCP protocol (JSON-RPC). The `@modelcontextprotocol/sdk` npm package provides the server scaffolding.
- Required Gmail API scopes: `https://www.googleapis.com/auth/gmail.modify` (read + label; excludes permanent delete).
- The Google Cloud project and OAuth credentials from Unit 2 of the existing plan can be reused if already completed.

## Units

### Unit 1: Scaffold the MCP server project

**Goal:** Create a minimal Node.js/TypeScript project with the MCP server SDK wired up and a stub tool registered, runnable locally.

**Inputs:** Node.js installed. No Google credentials needed yet.

**Outputs:**
- `mcp-servers/gmail/` directory with `package.json`, `tsconfig.json`, `src/index.ts`
- Server starts without error and Claude can connect to it (tool list returns the stub)

**Steps:**
1. Create `mcp-servers/gmail/` in this repo
2. Init npm project: `npm init -y`
3. Add dependencies: `@modelcontextprotocol/sdk`, `googleapis`, `typescript`, `tsx` (for dev)
4. Add `tsconfig.json` (ESM target, `node16` module resolution)
5. Write `src/index.ts` that creates an `McpServer`, registers a stub tool `gmail_list_emails`, and connects via `StdioServerTransport`
6. Add a `start` script: `npx tsx src/index.ts`
7. Add `.gitignore` inside `mcp-servers/gmail/` with entries: `node_modules/`, `dist/`
8. Run `npm install` and commit `package-lock.json` to pin dependency versions
9. Register the server in `~/Library/Application Support/Claude/claude_desktop_config.json` pointing at the local script
10. Restart Claude and verify the stub tool appears

**Done when:** Claude shows `gmail_list_emails` in its tool list when the server is running.

---

### Unit 2: Google Cloud OAuth credentials (reuse or create)

**Goal:** Have a valid `gcp-oauth.keys.json` for a Desktop app OAuth client with Gmail API access.

**Inputs:** A Google account with Google Cloud Console access.

**Outputs:**
- `~/.gmail-mcp/gcp-oauth.keys.json` — OAuth client credentials (not committed)

**Steps:**
1. If already completed in the previous plan, verify the file exists and skip to Done.
2. Otherwise: create a Google Cloud project, enable Gmail API, configure OAuth consent screen with scope `gmail.modify`, create a Desktop app OAuth client, download JSON, and place at `~/.gmail-mcp/gcp-oauth.keys.json`.

**Done when:** `~/.gmail-mcp/gcp-oauth.keys.json` exists with valid Desktop app credentials.

---

### Unit 3: Implement OAuth flow and token storage

**Goal:** The MCP server can authenticate a Gmail account via browser-based OAuth and persist the refresh token for future restarts.

**Inputs:** Unit 1 (runnable server), Unit 2 (credentials file).

**Outputs:**
- `src/auth.ts` — functions to load credentials, run the OAuth consent flow, store/load tokens
- Tokens stored per-account at `~/.gmail-mcp/tokens/<email>.json` (not committed)
- A `gmail_auth` tool (or CLI flag) that triggers the consent flow for a given account email

**Steps:**
1. Write `src/auth.ts` using `googleapis` `OAuth2Client`:
   - `loadCredentials()` — reads `gcp-oauth.keys.json`
   - `getTokenPath(email)` — returns `~/.gmail-mcp/tokens/<email>.json`
   - `loadToken(email)` — reads stored token if present
   - `saveToken(email, token)` — writes token to disk
   - `runAuthFlow(email)` — generates consent URL, starts a local HTTP server on a random port to receive the redirect, opens the browser, exchanges code for tokens, saves them
2. Register a `gmail_auth` MCP tool that accepts `{ email: string }` and calls `runAuthFlow`
3. Test: invoke `gmail_auth` from Claude with a Gmail address, complete the browser flow, verify token file written

**Done when:** Token file exists at `~/.gmail-mcp/tokens/<email>.json` after invoking `gmail_auth` for one account.

---

### Unit 4: Implement Gmail read and label tools

**Goal:** The server exposes functional tools for listing emails, reading a message, and applying/removing labels across any authenticated account.

**Inputs:** Unit 3 (auth working, token loadable).

**Outputs:**
- `src/gmail.ts` — Gmail API wrapper functions
- Three MCP tools registered: `gmail_list_emails`, `gmail_get_message`, `gmail_update_labels`

**Steps:**
1. Write `src/gmail.ts`:
   - `getClient(email)` — loads token, returns an authenticated `OAuth2Client`
   - `listEmails(email, query, maxResults)` — calls `gmail.users.messages.list` + `get` for snippets
   - `getMessage(email, messageId)` — returns full message (headers + body)
   - `updateLabels(email, messageId, addLabelIds, removeLabelIds)` — calls `gmail.users.messages.modify`
2. Replace the stub `gmail_list_emails` with a real implementation using `listEmails`
3. Register `gmail_get_message` and `gmail_update_labels`
4. All tools accept `email` as the first parameter to select the account
5. Return sensible error messages if the account is not authenticated (prompt user to run `gmail_auth`)

**Done when:** All three tools return real data for an authenticated account when invoked from Claude.

---

### Unit 5: Update the skill file and existing plan

**Goal:** Point `skills/gmail-multi-account.md` at the new custom server and retire/supersede the third-party package approach in the old plan.

**Inputs:** Unit 4 complete and verified.

**Outputs:**
- `skills/gmail-multi-account.md` updated — configuration section updated to reference the custom server
- `docs/plans/gmail-multi-account-mcp.md` — add a note that this plan is superseded by `gmail-custom-mcp.md`

**Steps:**
1. Update the Configuration section in the skill file to reference the local `mcp-servers/gmail` server path instead of the npm package
2. Add a `> **Note:** This plan is superseded by ...` callout at the top of the old plan

**Done when:** Skill file reflects the custom server setup; old plan is annotated.

---

### Unit 6: End-to-end verification

**Goal:** Confirm the custom server works for two accounts with all three tools.

**Inputs:** Units 1–5 complete.

**Outputs:** Verified working server; Known Limitations updated in skill file.

**Steps:**
1. Authenticate two Gmail accounts using `gmail_auth`
2. `gmail_list_emails` — list 5 unread emails from each account
3. `gmail_get_message` — read a specific message from each account
4. `gmail_update_labels` — apply label "Processed" to a message, verify in Gmail web UI, then remove it
5. Update `## Known Limitations` in the skill file with any gaps found

**Done when:** All test cases pass for both accounts.

---

## Files Modified / Created

| File | Action |
|---|---|
| `mcp-servers/gmail/package.json` | Create |
| `mcp-servers/gmail/tsconfig.json` | Create |
| `mcp-servers/gmail/src/index.ts` | Create — server entrypoint |
| `mcp-servers/gmail/src/auth.ts` | Create — OAuth flow and token storage |
| `mcp-servers/gmail/src/gmail.ts` | Create — Gmail API wrapper |
| `skills/gmail-multi-account.md` | Edit — update config to use custom server |
| `docs/plans/gmail-multi-account-mcp.md` | Edit — superseded note |
| `~/.gmail-mcp/gcp-oauth.keys.json` | Create (local, not committed) |
| `~/.gmail-mcp/tokens/<email>.json` | Create per account (local, not committed) |
| `~/Library/Application Support/Claude/claude_desktop_config.json` | Edit (local) |

---

## Status

| Unit | Status | Notes |
|---|---|---|
| Unit 1: Scaffold MCP server project | pending | |
| Unit 2: Google Cloud OAuth credentials | pending | May reuse existing credentials |
| Unit 3: OAuth flow and token storage | pending | |
| Unit 4: Gmail read and label tools | pending | |
| Unit 5: Update skill file and old plan | pending | |
| Unit 6: End-to-end verification | pending | |

## Dependency Order

```
Unit 1 (scaffold) ──► Unit 3 (auth) ──► Unit 4 (tools) ──► Unit 5 (skill update) ──► Unit 6 (verify)
Unit 2 (credentials) ──────────────────────────────────────────────────────────────────────────────┘
```

Units 1 and 2 can be done in parallel. Units 3–6 are sequential.
