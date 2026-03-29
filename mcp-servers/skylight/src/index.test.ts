import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

// ---------------------------------------------------------------------------
// Mocks — prevent real network/file I/O
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  loadConfig: vi.fn().mockReturnValue({
    email: "test@example.com",
    password: "secret",
    frameId: "frame1",
    timezone: "America/New_York",
  }),
  getToken: vi.fn().mockResolvedValue("tok123"),
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  listSourceCalendars: vi.fn(),
  listChores: vi.fn(),
  createChore: vi.fn(),
  updateChore: vi.fn(),
  deleteChore: vi.fn(),
  listLists: vi.fn(),
  getList: vi.fn(),
  createList: vi.fn(),
  updateList: vi.fn(),
  deleteList: vi.fn(),
  addListItem: vi.fn(),
  updateListItem: vi.fn(),
  deleteListItem: vi.fn(),
  createTask: vi.fn(),
  getFrameInfo: vi.fn(),
  listDevices: vi.fn(),
  listFamilyMembers: vi.fn(),
}));

vi.mock("./auth.js", () => ({
  loadConfig: mocks.loadConfig,
  getToken: mocks.getToken,
  login: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock("./api/calendar.js", () => ({
  listEvents: mocks.listEvents,
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
  deleteEvent: mocks.deleteEvent,
  listSourceCalendars: mocks.listSourceCalendars,
}));

vi.mock("./api/chores.js", () => ({
  listChores: mocks.listChores,
  createChore: mocks.createChore,
  updateChore: mocks.updateChore,
  deleteChore: mocks.deleteChore,
}));

vi.mock("./api/lists.js", () => ({
  listLists: mocks.listLists,
  getList: mocks.getList,
  createList: mocks.createList,
  updateList: mocks.updateList,
  deleteList: mocks.deleteList,
  addListItem: mocks.addListItem,
  updateListItem: mocks.updateListItem,
  deleteListItem: mocks.deleteListItem,
}));

vi.mock("./api/tasks.js", () => ({
  createTask: mocks.createTask,
}));

vi.mock("./api/family.js", () => ({
  getFrameInfo: mocks.getFrameInfo,
  listDevices: mocks.listDevices,
  listFamilyMembers: mocks.listFamilyMembers,
}));

import { createServer } from "./index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function connectClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverTransport);

  const client = new Client({ name: "test-client", version: "0.0.1" });
  await client.connect(clientTransport);

  return { client, server };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.loadConfig.mockReturnValue({
    email: "test@example.com",
    password: "secret",
    frameId: "frame1",
    timezone: "America/New_York",
  });
  mocks.getToken.mockResolvedValue("tok123");
});

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

describe("tool registration", () => {
  it("registers all 21 Skylight tools", async () => {
    const { client } = await connectClient();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);

    const expected = [
      "skylight_status",
      "skylight_list_events",
      "skylight_create_event",
      "skylight_update_event",
      "skylight_delete_event",
      "skylight_list_source_calendars",
      "skylight_list_chores",
      "skylight_create_chore",
      "skylight_update_chore",
      "skylight_delete_chore",
      "skylight_list_lists",
      "skylight_create_list",
      "skylight_update_list",
      "skylight_delete_list",
      "skylight_add_list_item",
      "skylight_update_list_item",
      "skylight_delete_list_item",
      "skylight_create_task",
      "skylight_frame_info",
      "skylight_list_devices",
      "skylight_list_family_members",
    ];

    for (const name of expected) {
      expect(names).toContain(name);
    }
    expect(tools.length).toBe(expected.length);
  });
});

// ---------------------------------------------------------------------------
// Status tool
// ---------------------------------------------------------------------------

describe("skylight_status", () => {
  it("returns status with config info", async () => {
    const { client } = await connectClient();
    const res = await client.callTool({ name: "skylight_status", arguments: {} });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Skylight MCP server is running");
    expect(text).toContain("frame1");
    expect(text).toContain("Authenticated: true");
  });

  it("returns isError when config is missing", async () => {
    mocks.loadConfig.mockImplementation(() => {
      throw new Error("Missing required environment variables");
    });
    const { client } = await connectClient();
    const res = await client.callTool({ name: "skylight_status", arguments: {} });
    expect(res.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Calendar tools
// ---------------------------------------------------------------------------

describe("skylight_list_events", () => {
  it("returns formatted events", async () => {
    mocks.listEvents.mockResolvedValue([
      { id: "e1", summary: "Meeting", start_at: "2026-01-01T10:00:00", end_at: "2026-01-01T11:00:00", all_day: false },
    ]);
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_list_events",
      arguments: { start_date: "2026-01-01", end_date: "2026-01-31" },
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Meeting");
    expect(res.isError).toBeFalsy();
  });

  it("returns isError on failure", async () => {
    mocks.listEvents.mockRejectedValue(new Error("API error"));
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_list_events",
      arguments: { start_date: "2026-01-01", end_date: "2026-01-31" },
    });
    expect(res.isError).toBe(true);
  });
});

describe("skylight_create_event", () => {
  it("creates event and returns confirmation", async () => {
    mocks.createEvent.mockResolvedValue({ id: "e1", summary: "New Event" });
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_create_event",
      arguments: { summary: "New Event", start_at: "2026-01-01", end_at: "2026-01-01" },
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Created event");
    expect(text).toContain("e1");
  });
});

// ---------------------------------------------------------------------------
// Chore tools
// ---------------------------------------------------------------------------

describe("skylight_list_chores", () => {
  it("returns formatted chores", async () => {
    mocks.listChores.mockResolvedValue([
      { id: "c1", summary: "Clean room", status: "pending" },
    ]);
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_list_chores",
      arguments: {},
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Clean room");
  });

  it("returns isError on failure", async () => {
    mocks.listChores.mockRejectedValue(new Error("chore error"));
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_list_chores",
      arguments: {},
    });
    expect(res.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// List tools
// ---------------------------------------------------------------------------

describe("skylight_list_lists", () => {
  it("returns formatted lists", async () => {
    mocks.listLists.mockResolvedValue([
      { id: "l1", name: "Groceries", list_type: "shopping" },
    ]);
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_list_lists",
      arguments: {},
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Groceries");
  });
});

describe("skylight_add_list_item", () => {
  it("adds item and returns confirmation", async () => {
    mocks.addListItem.mockResolvedValue({ id: "i1", name: "Milk" });
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_add_list_item",
      arguments: { list_id: "l1", name: "Milk" },
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Milk");
  });
});

// ---------------------------------------------------------------------------
// Task tools
// ---------------------------------------------------------------------------

describe("skylight_create_task", () => {
  it("creates task and returns confirmation", async () => {
    mocks.createTask.mockResolvedValue({ id: "t1", text: "Buy groceries" });
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_create_task",
      arguments: { text: "Buy groceries" },
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Buy groceries");
  });

  it("returns isError on failure", async () => {
    mocks.createTask.mockRejectedValue(new Error("task error"));
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_create_task",
      arguments: { text: "test" },
    });
    expect(res.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Family tools
// ---------------------------------------------------------------------------

describe("skylight_frame_info", () => {
  it("returns frame info as JSON", async () => {
    mocks.getFrameInfo.mockResolvedValue({ id: "frame1", name: "Home" });
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_frame_info",
      arguments: {},
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Home");
  });
});

describe("skylight_list_family_members", () => {
  it("returns formatted members", async () => {
    mocks.listFamilyMembers.mockResolvedValue([
      { id: "m1", label: "Mom", color: "#ff0000" },
    ]);
    const { client } = await connectClient();
    const res = await client.callTool({
      name: "skylight_list_family_members",
      arguments: {},
    });
    const text = (res.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Mom");
  });
});
