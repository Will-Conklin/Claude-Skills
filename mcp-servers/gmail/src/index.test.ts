import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

// ---------------------------------------------------------------------------
// Mock the Gmail and auth modules so no real network/file I/O occurs.
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  runAuthFlow: vi.fn(),
  listEmails: vi.fn(),
  getMessage: vi.fn(),
  updateLabels: vi.fn(),
}));

vi.mock("./auth.js", () => ({
  runAuthFlow: mocks.runAuthFlow,
  getAuthClient: vi.fn(),
  loadCredentials: vi.fn(),
  loadToken: vi.fn(),
  saveToken: vi.fn(),
  getTokenPath: vi.fn(),
}));

vi.mock("./gmail.js", () => ({
  listEmails: mocks.listEmails,
  getMessage: mocks.getMessage,
  updateLabels: mocks.updateLabels,
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
});

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

describe("tool registration", () => {
  it("registers all four Gmail tools", async () => {
    const { client } = await connectClient();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);

    expect(names).toContain("gmail_auth");
    expect(names).toContain("gmail_list_emails");
    expect(names).toContain("gmail_get_message");
    expect(names).toContain("gmail_update_labels");
  });
});

// ---------------------------------------------------------------------------
// Error-path handling in tool handlers
// ---------------------------------------------------------------------------

describe("gmail_auth", () => {
  it("returns success text when runAuthFlow resolves", async () => {
    mocks.runAuthFlow.mockResolvedValue("Successfully authenticated user@example.com.");
    const { client } = await connectClient();

    const res = await client.callTool({ name: "gmail_auth", arguments: { email: "user@example.com" } });

    expect(res.isError).toBeFalsy();
    expect((res.content as Array<{ text: string }>)[0].text).toContain("Successfully authenticated");
  });

  it("returns isError:true when runAuthFlow throws", async () => {
    mocks.runAuthFlow.mockRejectedValue(new Error("OAuth failed"));
    const { client } = await connectClient();

    const res = await client.callTool({ name: "gmail_auth", arguments: { email: "user@example.com" } });

    expect(res.isError).toBe(true);
  });
});

describe("gmail_list_emails", () => {
  it("returns isError:true when listEmails throws", async () => {
    mocks.listEmails.mockRejectedValue(new Error("not authenticated"));
    const { client } = await connectClient();

    const res = await client.callTool({
      name: "gmail_list_emails",
      arguments: { email: "user@example.com" },
    });

    expect(res.isError).toBe(true);
    expect((res.content as Array<{ text: string }>)[0].text).toContain("not authenticated");
  });
});

describe("gmail_get_message", () => {
  it("returns isError:true when getMessage throws", async () => {
    mocks.getMessage.mockRejectedValue(new Error("message not found"));
    const { client } = await connectClient();

    const res = await client.callTool({
      name: "gmail_get_message",
      arguments: { email: "user@example.com", messageId: "abc123" },
    });

    expect(res.isError).toBe(true);
    expect((res.content as Array<{ text: string }>)[0].text).toContain("message not found");
  });
});

describe("gmail_update_labels", () => {
  it("returns isError:true when updateLabels throws", async () => {
    mocks.updateLabels.mockRejectedValue(new Error("label error"));
    const { client } = await connectClient();

    const res = await client.callTool({
      name: "gmail_update_labels",
      arguments: { email: "user@example.com", messageId: "abc123" },
    });

    expect(res.isError).toBe(true);
    expect((res.content as Array<{ text: string }>)[0].text).toContain("label error");
  });
});
