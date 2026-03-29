---
name: skylight-calendar
title: Skylight Calendar
type: integration
platform: cowork
version: 1.0.0
description: Manage your Skylight smart calendar — events, chores, lists, tasks, and family — using a local Skylight MCP server.
mcp_servers:
  - skylight
---

## Invocation

Invoke with natural language in Claude Cowork. Examples:

- "What's on my calendar this week?"
- "Add a dentist appointment on Friday at 2pm"
- "Show my chore list" / "Create a chore for cleanup"
- "Add milk to my grocery list"
- "Who's in my family on Skylight?"
- `/skylight` (if configured as a slash command)

## Prompt

Use the following as a system prompt addition when invoking this skill:

---

You have access to a Skylight Calendar MCP server that manages a Skylight smart calendar frame. When the user asks about their calendar, chores, lists, tasks, or family, use the Skylight tools:

1. **Calendar events**: Use `skylight_list_events` to show upcoming events. Use `skylight_create_event`, `skylight_update_event`, and `skylight_delete_event` to manage them. Use `skylight_list_source_calendars` to see connected calendar sources (Google, iCloud, etc.).

2. **Chores**: Use `skylight_list_chores` to show chores (optionally filtered by date range or status). Use `skylight_create_chore`, `skylight_update_chore`, and `skylight_delete_chore` to manage them. Chores can be assigned to family members via `category_id`.

3. **Lists**: Use `skylight_list_lists` to show all lists. Use `skylight_create_list` and `skylight_delete_list` to manage lists. Use `skylight_add_list_item`, `skylight_update_list_item`, and `skylight_delete_list_item` to manage items within lists.

4. **Tasks**: Use `skylight_create_task` to add unscheduled tasks to the Skylight task box.

5. **Family**: Use `skylight_list_family_members` to see who's in the household. Use `skylight_frame_info` for household details. Use `skylight_list_devices` to see connected Skylight devices.

6. **Status**: Use `skylight_status` to check server health and authentication status.

When creating events, ask for the title and time. Default to all_day: false unless the user says "all day." Use ISO 8601 for dates and times.

---

## Configuration

This skill requires a locally-running Skylight MCP server connected to Claude. Follow the setup steps below.

### Prerequisites

- Node.js installed (`node --version` should succeed)
- A Skylight account (email and password)
- Your Skylight frame ID (visible in Skylight API calls or the app)
- Claude Desktop or Claude Cowork with MCP support

### Step 1: Set Environment Variables

The server reads credentials from environment variables:

```bash
export SKYLIGHT_EMAIL="you@example.com"
export SKYLIGHT_PASSWORD="your-password"
export SKYLIGHT_FRAME_ID="your-frame-id"
export SKYLIGHT_TIMEZONE="America/New_York"  # optional, defaults to America/New_York
```

### Step 2: Register the MCP Server with Claude

Add the following to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "skylight": {
      "command": "npx",
      "args": ["tsx", "/path/to/Claude-Skills/mcp-servers/skylight/src/index.ts"],
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

Replace `/path/to/Claude-Skills` with the absolute path to this repo.

### Step 3: Install Dependencies

```bash
cd /path/to/Claude-Skills/mcp-servers/skylight
npm install
```

### Verification

Restart Claude and ask: "Check my Skylight status." Claude should invoke `skylight_status` and report the server is running with your frame ID.

## Examples

**View this week's events:**
> "What's on my Skylight calendar this week?"

Claude calls `skylight_list_events` with the current week's date range and lists events.

---

**Create an event:**
> "Add a dentist appointment on Friday at 2pm for 1 hour"

Claude calls `skylight_create_event` with the appropriate start/end times.

---

**View and manage chores:**
> "What chores are due today?" / "Mark the dishes chore as completed"

Claude uses `skylight_list_chores` with date filters, then `skylight_update_chore` to change status.

---

**Grocery list:**
> "Add eggs, butter, and bread to my grocery list"

Claude finds the shopping list with `skylight_list_lists`, then calls `skylight_add_list_item` for each item.

---

**Family info:**
> "Who's in my Skylight family?"

Claude calls `skylight_list_family_members` and lists names and colors.

## Known Limitations

- The Skylight API is reverse-engineered and unofficial. It may change without notice.
- Authentication uses email/password — tokens are cached at `~/.skylight-mcp/token.json` and refreshed automatically on 401 errors.
- Skylight Plus features (meals, rewards, photos) are not included in this version.
- The task box API only supports creating tasks, not listing or deleting them.
- Finding your frame ID requires inspecting API traffic or the Skylight app — there is no discovery endpoint.
