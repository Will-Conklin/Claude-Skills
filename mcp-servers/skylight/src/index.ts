import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, getToken } from "./auth.js";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  listSourceCalendars,
} from "./api/calendar.js";
import {
  listChores,
  createChore,
  updateChore,
  deleteChore,
} from "./api/chores.js";
import {
  listLists,
  getList,
  createList,
  updateList,
  deleteList,
  addListItem,
  updateListItem,
  deleteListItem,
} from "./api/lists.js";
import { createTask } from "./api/tasks.js";
import {
  getFrameInfo,
  listDevices,
  listFamilyMembers,
} from "./api/family.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "skylight",
    version: "1.0.0",
  });

  // --- Status ---

  server.tool(
    "skylight_status",
    "Check the Skylight MCP server status, authentication, and configuration.",
    {},
    async () => {
      try {
        const config = loadConfig();
        const token = await getToken();
        const authenticated = !!token;
        const text = [
          `Skylight MCP server is running.`,
          `Frame ID: ${config.frameId}`,
          `Timezone: ${config.timezone}`,
          `Authenticated: ${authenticated}`,
        ].join("\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  // --- Calendar ---

  server.tool(
    "skylight_list_events",
    "List calendar events within a date range.",
    {
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
    },
    async ({ start_date, end_date }) => {
      try {
        const events = await listEvents(start_date, end_date);
        if (events.length === 0) {
          return { content: [{ type: "text", text: "No events found." }] };
        }
        const text = events
          .map(
            (e) =>
              `ID: ${e.id}\nSummary: ${e.summary}\nStart: ${e.start_at}\nEnd: ${e.end_at}\nAll day: ${e.all_day}`
          )
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_create_event",
    "Create a new calendar event on the Skylight frame.",
    {
      summary: z.string().describe("Event title"),
      start_at: z.string().describe("Start date/time (ISO 8601)"),
      end_at: z.string().describe("End date/time (ISO 8601)"),
      all_day: z.boolean().optional().default(false).describe("Whether this is an all-day event"),
      description: z.string().optional().describe("Event description"),
      location: z.string().optional().describe("Event location"),
    },
    async ({ summary, start_at, end_at, all_day, description, location }) => {
      try {
        const event = await createEvent({ summary, start_at, end_at, all_day: all_day ?? false, description, location });
        return { content: [{ type: "text", text: `Created event "${event.summary}" (ID: ${event.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_update_event",
    "Update an existing calendar event.",
    {
      event_id: z.string().describe("Event ID to update"),
      summary: z.string().optional().describe("New event title"),
      start_at: z.string().optional().describe("New start date/time"),
      end_at: z.string().optional().describe("New end date/time"),
      all_day: z.boolean().optional().describe("Whether this is an all-day event"),
      description: z.string().optional().describe("New description"),
      location: z.string().optional().describe("New location"),
    },
    async ({ event_id, ...updates }) => {
      try {
        const event = await updateEvent(event_id, updates);
        return { content: [{ type: "text", text: `Updated event "${event.summary}" (ID: ${event.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_delete_event",
    "Delete a calendar event.",
    {
      event_id: z.string().describe("Event ID to delete"),
    },
    async ({ event_id }) => {
      try {
        await deleteEvent(event_id);
        return { content: [{ type: "text", text: `Deleted event ${event_id}.` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_list_source_calendars",
    "List connected calendar sources (Google, iCloud, etc.).",
    {},
    async () => {
      try {
        const calendars = await listSourceCalendars();
        if (calendars.length === 0) {
          return { content: [{ type: "text", text: "No source calendars found." }] };
        }
        const text = calendars
          .map((c) => `ID: ${c.id}\nName: ${c.name}\nProvider: ${c.provider}\nEnabled: ${c.enabled}`)
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  // --- Chores ---

  server.tool(
    "skylight_list_chores",
    "List chores, optionally filtered by date range and status.",
    {
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
      status: z.string().optional().describe("Filter by status (e.g. 'pending', 'completed')"),
    },
    async ({ start_date, end_date, status }) => {
      try {
        const chores = await listChores(start_date, end_date, status);
        if (chores.length === 0) {
          return { content: [{ type: "text", text: "No chores found." }] };
        }
        const text = chores
          .map(
            (c) =>
              `ID: ${c.id}\nSummary: ${c.summary}\nStatus: ${c.status ?? "unknown"}\nDue: ${c.due_at ?? "none"}`
          )
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_create_chore",
    "Create a new chore.",
    {
      summary: z.string().describe("Chore title"),
      due_at: z.string().optional().describe("Due date/time (ISO 8601)"),
      category_id: z.string().optional().describe("Family member ID to assign"),
      emoji: z.string().optional().describe("Emoji icon for the chore"),
      reward_points: z.number().optional().describe("Reward points for completion"),
      rrule: z.string().optional().describe("Recurrence rule (RRULE format)"),
    },
    async ({ summary, due_at, category_id, emoji, reward_points, rrule }) => {
      try {
        const chore = await createChore({ summary, due_at, category_id, emoji, reward_points, rrule });
        return { content: [{ type: "text", text: `Created chore "${chore.summary}" (ID: ${chore.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_update_chore",
    "Update an existing chore.",
    {
      chore_id: z.string().describe("Chore ID to update"),
      summary: z.string().optional().describe("New chore title"),
      due_at: z.string().optional().describe("New due date/time"),
      status: z.string().optional().describe("New status"),
      category_id: z.string().optional().describe("New family member assignment"),
      emoji: z.string().optional().describe("New emoji icon"),
    },
    async ({ chore_id, ...updates }) => {
      try {
        const chore = await updateChore(chore_id, updates);
        return { content: [{ type: "text", text: `Updated chore "${chore.summary}" (ID: ${chore.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_delete_chore",
    "Delete a chore.",
    {
      chore_id: z.string().describe("Chore ID to delete"),
    },
    async ({ chore_id }) => {
      try {
        await deleteChore(chore_id);
        return { content: [{ type: "text", text: `Deleted chore ${chore_id}.` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  // --- Lists ---

  server.tool(
    "skylight_list_lists",
    "List all Skylight lists (shopping, to-do, etc.).",
    {},
    async () => {
      try {
        const lists = await listLists();
        if (lists.length === 0) {
          return { content: [{ type: "text", text: "No lists found." }] };
        }
        const text = lists
          .map((l) => `ID: ${l.id}\nName: ${l.name}\nType: ${l.list_type}`)
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_create_list",
    "Create a new list.",
    {
      name: z.string().describe("List name"),
      list_type: z.string().describe("List type (e.g. 'shopping', 'to_do')"),
    },
    async ({ name, list_type }) => {
      try {
        const list = await createList(name, list_type);
        return { content: [{ type: "text", text: `Created list "${list.name}" (ID: ${list.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_update_list",
    "Update a list's name or type.",
    {
      list_id: z.string().describe("List ID to update"),
      name: z.string().optional().describe("New list name"),
      list_type: z.string().optional().describe("New list type"),
    },
    async ({ list_id, name, list_type }) => {
      try {
        const list = await updateList(list_id, { name, list_type });
        return { content: [{ type: "text", text: `Updated list "${list.name}" (ID: ${list.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_delete_list",
    "Delete a list.",
    {
      list_id: z.string().describe("List ID to delete"),
    },
    async ({ list_id }) => {
      try {
        await deleteList(list_id);
        return { content: [{ type: "text", text: `Deleted list ${list_id}.` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_add_list_item",
    "Add an item to a list.",
    {
      list_id: z.string().describe("List ID"),
      name: z.string().describe("Item name"),
      section: z.string().optional().describe("Section/category within the list"),
    },
    async ({ list_id, name, section }) => {
      try {
        const item = await addListItem(list_id, name, section);
        return { content: [{ type: "text", text: `Added "${item.name}" to list (ID: ${item.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_update_list_item",
    "Update a list item (name, status, section).",
    {
      list_id: z.string().describe("List ID"),
      item_id: z.string().describe("Item ID to update"),
      name: z.string().optional().describe("New item name"),
      status: z.string().optional().describe("New status (e.g. 'completed')"),
      section: z.string().optional().describe("New section"),
    },
    async ({ list_id, item_id, name, status, section }) => {
      try {
        const item = await updateListItem(list_id, item_id, { name, status, section });
        return { content: [{ type: "text", text: `Updated item "${item.name}" (ID: ${item.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_delete_list_item",
    "Delete an item from a list.",
    {
      list_id: z.string().describe("List ID"),
      item_id: z.string().describe("Item ID to delete"),
    },
    async ({ list_id, item_id }) => {
      try {
        await deleteListItem(list_id, item_id);
        return { content: [{ type: "text", text: `Deleted item ${item_id} from list ${list_id}.` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  // --- Tasks ---

  server.tool(
    "skylight_create_task",
    "Create an unscheduled task in the Skylight task box.",
    {
      text: z.string().describe("Task text"),
    },
    async ({ text }) => {
      try {
        const task = await createTask(text);
        return { content: [{ type: "text", text: `Created task "${task.text}" (ID: ${task.id})` }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  // --- Family ---

  server.tool(
    "skylight_frame_info",
    "Get information about the Skylight frame/household.",
    {},
    async () => {
      try {
        const info = await getFrameInfo();
        return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_list_devices",
    "List Skylight devices connected to the household.",
    {},
    async () => {
      try {
        const devices = await listDevices();
        if (devices.length === 0) {
          return { content: [{ type: "text", text: "No devices found." }] };
        }
        const text = devices
          .map((d) => `ID: ${d.id}\nName: ${d.name}`)
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "skylight_list_family_members",
    "List family members (categories) in the household.",
    {},
    async () => {
      try {
        const members = await listFamilyMembers();
        if (members.length === 0) {
          return { content: [{ type: "text", text: "No family members found." }] };
        }
        const text = members
          .map(
            (m) =>
              `ID: ${m.id}\nName: ${m.label}\nColor: ${m.color ?? "none"}`
          )
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  return server;
}

const transport = new StdioServerTransport();
await createServer().connect(transport);
