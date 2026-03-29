# Plan: Skylight Calendar MCP Server

## Goal

Build a custom MCP server for the Skylight smart calendar, following the Gmail MCP pattern in this repo. The server exposes 21 tools covering calendar events, chores, lists, tasks, and family management. Core features only — Plus features (meals, rewards, photos) deferred.

## Background

- Skylight has no official API; all implementations use a reverse-engineered API at `https://app.ourskylight.com/api`
- An existing third-party MCP (TheEagleByte/skylight-mcp) exists but the user chose to build a custom one for full control
- Authentication uses email/password login returning a bearer token
- The Gmail MCP at `mcp-servers/gmail/` serves as the architectural template

## Units

### Unit 1: Scaffold project and configuration

**Goal:** Create `mcp-servers/skylight/` with all config files and a stub MCP server.
**Outputs:** package.json, tsconfig.json, vitest.config.ts, .gitignore, src/index.ts
**Done when:** `npx tsx src/index.ts` starts without error; typecheck passes.

### Unit 2: Auth module and token caching

**Goal:** Email/password login with token caching at `~/.skylight-mcp/token.json`.
**Outputs:** src/auth.ts, src/auth.test.ts
**Done when:** All auth tests pass.

### Unit 3: HTTP client with auto re-auth

**Goal:** Shared HTTP client that injects Bearer tokens and retries on 401.
**Outputs:** src/client.ts, src/client.test.ts
**Done when:** All client tests pass.

### Unit 4: Calendar tools

**Goal:** Calendar event CRUD + source calendar listing.
**Outputs:** src/api/calendar.ts, src/api/calendar.test.ts, 5 tools in index.ts
**Done when:** 5 calendar tools registered and tests pass.

### Unit 5: Chores tools

**Goal:** Chore CRUD as MCP tools.
**Outputs:** src/api/chores.ts, src/api/chores.test.ts, 4 tools in index.ts
**Done when:** 4 chore tools registered and tests pass.

### Unit 6: Lists and list items tools

**Goal:** Full CRUD for lists and their items.
**Outputs:** src/api/lists.ts, src/api/lists.test.ts, 7 tools in index.ts
**Done when:** 7 list tools registered and tests pass.

### Unit 7: Tasks, family, and status tools

**Goal:** Task creation, family info retrieval, and real status tool.
**Outputs:** src/api/tasks.ts, src/api/family.ts, tests, 5 tools in index.ts
**Done when:** 5 tools working, tests pass.

### Unit 8: Integration tests

**Goal:** Full server test with InMemoryTransport + MCP Client.
**Outputs:** src/index.test.ts
**Done when:** All integration tests pass.

### Unit 9: Documentation and skill file

**Goal:** Integrate Skylight MCP into repo documentation.
**Outputs:** skills/skylight-calendar.md, updates to INDEX.md, SETUP.md, BACKLOG.md, this plan file
**Done when:** All docs consistent and skill discoverable.

## Status

| Unit | Status | Notes |
|---|---|---|
| Unit 1: Scaffold | complete | |
| Unit 2: Auth | complete | |
| Unit 3: Client | complete | |
| Unit 4: Calendar | complete | |
| Unit 5: Chores | complete | |
| Unit 6: Lists | complete | |
| Unit 7: Tasks/Family | complete | |
| Unit 8: Integration tests | complete | 55 tests across 8 files |
| Unit 9: Documentation | complete | |
