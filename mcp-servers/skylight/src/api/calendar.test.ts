import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSkylightRequest = vi.fn();
const mockGetFrameId = vi.fn().mockReturnValue("frame1");

vi.mock("../client.js", () => ({
  skylightRequest: (...args: unknown[]) => mockSkylightRequest(...args),
  getFrameId: () => mockGetFrameId(),
}));

import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  listSourceCalendars,
} from "./calendar.js";

describe("calendar API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listEvents calls correct endpoint with date params", async () => {
    mockSkylightRequest.mockResolvedValue([]);
    const result = await listEvents("2026-01-01", "2026-01-31");
    expect(result).toEqual([]);
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/calendar_events",
      { params: { start_date: "2026-01-01", end_date: "2026-01-31" } }
    );
  });

  it("createEvent sends POST with event data", async () => {
    const event = { summary: "Test", start_at: "2026-01-01", end_at: "2026-01-01", all_day: true };
    mockSkylightRequest.mockResolvedValue({ id: "e1", ...event });
    const result = await createEvent(event);
    expect(result.id).toBe("e1");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/calendar_events",
      { method: "POST", body: { calendar_event: event } }
    );
  });

  it("updateEvent sends PUT with updates", async () => {
    mockSkylightRequest.mockResolvedValue({ id: "e1", summary: "Updated" });
    await updateEvent("e1", { summary: "Updated" });
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/calendar_events/e1",
      { method: "PUT", body: { calendar_event: { summary: "Updated" } } }
    );
  });

  it("deleteEvent sends DELETE", async () => {
    mockSkylightRequest.mockResolvedValue(undefined);
    await deleteEvent("e1");
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/calendar_events/e1",
      { method: "DELETE" }
    );
  });

  it("listSourceCalendars calls correct endpoint", async () => {
    mockSkylightRequest.mockResolvedValue([{ id: "sc1", name: "Google" }]);
    const result = await listSourceCalendars();
    expect(result).toHaveLength(1);
    expect(mockSkylightRequest).toHaveBeenCalledWith(
      "/frames/frame1/source_calendars"
    );
  });
});
