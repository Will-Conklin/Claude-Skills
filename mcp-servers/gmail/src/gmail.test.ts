import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock seams
//
// vi.mock() is hoisted before imports; mock factories must be self-contained.
// We use module-level vi.fn() refs captured via vi.hoisted() so they can be
// shared between the factory and the tests.
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  getAuthClient: vi.fn(),
  gmailFn: vi.fn(),
  gmailList: vi.fn(),
  gmailGet: vi.fn(),
  gmailModify: vi.fn(),
}));

vi.mock("./auth.js", () => ({
  getAuthClient: mocks.getAuthClient,
}));

vi.mock("googleapis", () => ({
  google: {
    gmail: mocks.gmailFn,
  },
}));

import { listEmails, getMessage, updateLabels } from "./gmail.js";

const FAKE_AUTH = {} as never; // truthy auth placeholder

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getAuthClient.mockResolvedValue(FAKE_AUTH);
  // Restore the gmail factory after resetAllMocks clears its implementation
  mocks.gmailFn.mockReturnValue({
    users: {
      messages: {
        list: mocks.gmailList,
        get: mocks.gmailGet,
        modify: mocks.gmailModify,
      },
    },
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessageStub(id: string) {
  return { id };
}

function makeDetailResponse(id: string, headers: Array<{ name: string; value: string }>, snippet: string) {
  return {
    data: {
      payload: { headers },
      snippet,
    },
  };
}

// ---------------------------------------------------------------------------
// listEmails
// ---------------------------------------------------------------------------

describe("listEmails", () => {
  it("returns an empty array when the API returns an empty messages list", async () => {
    mocks.gmailList.mockResolvedValue({ data: { messages: [] } });

    const result = await listEmails("user@example.com", "", 10);

    expect(result).toEqual([]);
  });

  it("returns an empty array when messages is undefined (??  branch)", async () => {
    mocks.gmailList.mockResolvedValue({ data: {} });

    const result = await listEmails("user@example.com", "", 10);

    expect(result).toEqual([]);
  });

  it("returns correctly shaped EmailSummary objects", async () => {
    mocks.gmailList.mockResolvedValue({
      data: { messages: [makeMessageStub("msg1"), makeMessageStub("msg2")] },
    });
    mocks.gmailGet
      .mockResolvedValueOnce(
        makeDetailResponse("msg1", [
          { name: "From", value: "alice@example.com" },
          { name: "Subject", value: "Hello" },
          { name: "Date", value: "Mon, 1 Jan 2024" },
        ], "snippet1")
      )
      .mockResolvedValueOnce(
        makeDetailResponse("msg2", [
          { name: "From", value: "bob@example.com" },
          { name: "Subject", value: "World" },
          { name: "Date", value: "Tue, 2 Jan 2024" },
        ], "snippet2")
      );

    const result = await listEmails("user@example.com", "", 10);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "msg1", from: "alice@example.com", subject: "Hello", snippet: "snippet1" });
    expect(result[1]).toMatchObject({ id: "msg2", from: "bob@example.com", subject: "World", snippet: "snippet2" });
  });

  it("passes q: undefined to the API when query is an empty string (|| undefined branch)", async () => {
    mocks.gmailList.mockResolvedValue({ data: { messages: [] } });

    await listEmails("user@example.com", "", 5);

    expect(mocks.gmailList).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined })
    );
  });

  it("passes the query string to the API when provided", async () => {
    mocks.gmailList.mockResolvedValue({ data: { messages: [] } });

    await listEmails("user@example.com", "is:unread", 5);

    expect(mocks.gmailList).toHaveBeenCalledWith(
      expect.objectContaining({ q: "is:unread" })
    );
  });

  it("propagates getAuthClient errors", async () => {
    mocks.getAuthClient.mockRejectedValue(new Error("not authenticated"));

    await expect(listEmails("nobody@example.com", "", 10)).rejects.toThrow("not authenticated");
  });
});

// ---------------------------------------------------------------------------
// getMessage
// ---------------------------------------------------------------------------

describe("getMessage", () => {
  it("decodes base64 body from text/plain part", async () => {
    const bodyText = "Hello from email";
    const encoded = Buffer.from(bodyText, "utf-8").toString("base64");
    mocks.gmailGet.mockResolvedValue({
      data: {
        id: "msg1",
        snippet: "Hello",
        labelIds: ["INBOX"],
        payload: {
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "To", value: "bob@example.com" },
            { name: "Subject", value: "Hi" },
            { name: "Date", value: "Mon, 1 Jan 2024" },
          ],
          parts: [{ mimeType: "text/plain", body: { data: encoded } }],
        },
      },
    });

    const result = await getMessage("user@example.com", "msg1");

    expect(result.body).toBe(bodyText);
    expect(result.from).toBe("alice@example.com");
    expect(result.labelIds).toEqual(["INBOX"]);
  });

  it("falls back to payload.body.data when no parts array is present", async () => {
    const bodyText = "Top-level body";
    const encoded = Buffer.from(bodyText, "utf-8").toString("base64");
    mocks.gmailGet.mockResolvedValue({
      data: {
        id: "msg1",
        snippet: "Top-level",
        labelIds: [],
        payload: {
          headers: [],
          parts: [],
          body: { data: encoded },
        },
      },
    });

    const result = await getMessage("user@example.com", "msg1");

    expect(result.body).toBe(bodyText);
  });

  it("returns body as empty string when neither parts nor top-level body data present", async () => {
    mocks.gmailGet.mockResolvedValue({
      data: {
        id: "msg1",
        snippet: "fallback snippet",
        labelIds: [],
        payload: {
          headers: [],
          parts: [],
        },
      },
    });

    const result = await getMessage("user@example.com", "msg1");

    expect(result.body).toBe("");
    expect(result.snippet).toBe("fallback snippet");
  });

  it("returns the correct labelIds array", async () => {
    mocks.gmailGet.mockResolvedValue({
      data: {
        id: "msg1",
        snippet: "",
        labelIds: ["INBOX", "UNREAD"],
        payload: { headers: [], parts: [] },
      },
    });

    const result = await getMessage("user@example.com", "msg1");

    expect(result.labelIds).toEqual(["INBOX", "UNREAD"]);
  });
});

// ---------------------------------------------------------------------------
// updateLabels
// ---------------------------------------------------------------------------

describe("updateLabels", () => {
  it("calls modify with the correct requestBody and returns id + labelIds", async () => {
    mocks.gmailModify.mockResolvedValue({
      data: { id: "msg1", labelIds: ["INBOX", "UNREAD"] },
    });

    const result = await updateLabels("user@example.com", "msg1", ["UNREAD"], ["SPAM"]);

    expect(mocks.gmailModify).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg1",
        requestBody: { addLabelIds: ["UNREAD"], removeLabelIds: ["SPAM"] },
      })
    );
    expect(result).toEqual({ id: "msg1", labelIds: ["INBOX", "UNREAD"] });
  });

  it("works with empty add and remove arrays", async () => {
    mocks.gmailModify.mockResolvedValue({
      data: { id: "msg2", labelIds: ["INBOX"] },
    });

    const result = await updateLabels("user@example.com", "msg2", [], []);

    expect(mocks.gmailModify).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: { addLabelIds: [], removeLabelIds: [] },
      })
    );
    expect(result.id).toBe("msg2");
  });
});
