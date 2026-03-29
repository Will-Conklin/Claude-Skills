import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSkylightRequest = vi.fn();
const mockGetFrameId = vi.fn().mockReturnValue("frame1");

vi.mock("../client.js", () => ({
  skylightRequest: (...args: unknown[]) => mockSkylightRequest(...args),
  getFrameId: () => mockGetFrameId(),
}));

import { listChores, createChore, updateChore, deleteChore } from "./chores.js";

describe("chores API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listChores with no filters", async () => {
    mockSkylightRequest.mockResolvedValue([]);
    await listChores();
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/chores",
      { params: {} }
    );
  });

  it("listChores with date and status filters", async () => {
    mockSkylightRequest.mockResolvedValue([]);
    await listChores("2026-01-01", "2026-01-31", "pending");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/chores",
      { params: { start_date: "2026-01-01", end_date: "2026-01-31", status: "pending" } }
    );
  });

  it("createChore sends POST", async () => {
    const chore = { summary: "Clean room", emoji: "🧹" };
    mockSkylightRequest.mockResolvedValue({ id: "c1", ...chore });
    const result = await createChore(chore);
    expect(result.id).toBe("c1");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/chores",
      { method: "POST", body: { chore } }
    );
  });

  it("updateChore sends PUT", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "c1", summary: "Updated" });
    await updateChore("c1", { summary: "Updated" });
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/chores/c1",
      { method: "PUT", body: { chore: { summary: "Updated" } } }
    );
  });

  it("deleteChore sends DELETE", async () => {
    mockSkylightRequest.mockResolvedValue(undefined);
    await deleteChore("c1");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/chores/c1",
      { method: "DELETE" }
    );
  });
});
