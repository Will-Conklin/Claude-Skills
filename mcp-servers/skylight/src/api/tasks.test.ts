import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSkylightRequest = vi.fn();
const mockGetFrameId = vi.fn().mockReturnValue("frame1");

vi.mock("../client.js", () => ({
  skylightRequest: (...args: unknown[]) => mockSkylightRequest(...args),
  getFrameId: () => mockGetFrameId(),
}));

import { createTask } from "./tasks.js";

describe("tasks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createTask sends POST with text", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "t1", text: "Buy groceries" });
    const result = await createTask("Buy groceries");
    expect(result.id).toBe("t1");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/task_box/items",
      { method: "POST", body: { item: { text: "Buy groceries" } } }
    );
  });
});
