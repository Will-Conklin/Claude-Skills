import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSkylightRequest = vi.fn();
const mockGetFrameId = vi.fn().mockReturnValue("frame1");

vi.mock("../client.js", () => ({
  skylightRequest: (...args: unknown[]) => mockSkylightRequest(...args),
  getFrameId: () => mockGetFrameId(),
}));

import {
  listLists,
  getList,
  createList,
  updateList,
  deleteList,
  addListItem,
  updateListItem,
  deleteListItem,
} from "./lists.js";

describe("lists API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listLists fetches all lists", async () => {
    mockSkylightRequest.mockResolvedValue([{ id: "l1", name: "Groceries" }]);
    const result = await listLists();
    expect(result).toHaveLength(1);
    expect(mockSkylightRequest).toHaveBeenCalledWith("/frames/frame1/lists");
  });

  it("getList fetches specific list", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "l1", name: "Groceries", items: [] });
    await getList("l1");
    expect(mockSkylightRequest).toHaveBeenCalledWith("/frames/frame1/lists/l1");
  });

  it("createList sends POST", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "l1", name: "Shopping", list_type: "shopping" });
    await createList("Shopping", "shopping");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/lists",
      { method: "POST", body: { list: { name: "Shopping", list_type: "shopping" } } }
    );
  });

  it("updateList sends PUT", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "l1", name: "Updated" });
    await updateList("l1", { name: "Updated" });
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/lists/l1",
      { method: "PUT", body: { list: { name: "Updated" } } }
    );
  });

  it("deleteList sends DELETE", async () => {
    mockSkylightRequest.mockResolvedValue(undefined);
    await deleteList("l1");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/lists/l1",
      { method: "DELETE" }
    );
  });

  it("addListItem sends POST with name", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "i1", name: "Milk" });
    await addListItem("l1", "Milk");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/lists/l1/list_items",
      { method: "POST", body: { list_item: { name: "Milk" } } }
    );
  });

  it("addListItem includes section when provided", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "i1", name: "Milk", section: "Dairy" });
    await addListItem("l1", "Milk", "Dairy");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/lists/l1/list_items",
      { method: "POST", body: { list_item: { name: "Milk", section: "Dairy" } } }
    );
  });

  it("updateListItem sends PUT", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "i1", name: "Milk", status: "completed" });
    await updateListItem("l1", "i1", { status: "completed" });
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/lists/l1/list_items/i1",
      { method: "PUT", body: { list_item: { status: "completed" } } }
    );
  });

  it("deleteListItem sends DELETE", async () => {
    mockSkylightRequest.mockResolvedValue(undefined);
    await deleteListItem("l1", "i1");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/lists/l1/list_items/i1",
      { method: "DELETE" }
    );
  });
});
