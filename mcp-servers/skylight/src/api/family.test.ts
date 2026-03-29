import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSkylightRequest = vi.fn();
const mockGetFrameId = vi.fn().mockReturnValue("frame1");

vi.mock("../client.js", () => ({
  skylightRequest: (...args: unknown[]) => mockSkylightRequest(...args),
  getFrameId: () => mockGetFrameId(),
}));

import { getFrameInfo, listDevices, listFamilyMembers } from "./family.js";

describe("family API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getFrameInfo fetches frame data", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "frame1", name: "Home" });
    const result = await getFrameInfo();
    expect(result.name).toBe("Home");
    expect(mockSkylightRequest).toHaveBeenCalledWith("/frames/frame1");
  });

  it("listDevices fetches devices", async () => {
    mockSkylightRequest.mockResolvedValue([{ id: "d1", name: "Kitchen Frame" }]);
    const result = await listDevices();
    expect(result).toHaveLength(1);
    expect(mockSkylightRequest).toHaveBeenCalledWith("/frames/frame1/devices");
  });

  it("listFamilyMembers fetches categories", async () => {
    mockSkylightRequest.mockResolvedValue([{ id: "m1", label: "Mom", color: "#ff0000" }]);
    const result = await listFamilyMembers();
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Mom");
    expect(mockSkylightRequest).toHaveBeenCalledWith("/frames/frame1/categories");
  });
});
