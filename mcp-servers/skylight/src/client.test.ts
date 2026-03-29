import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetToken = vi.fn();
const mockClearToken = vi.fn();
const mockLoadConfig = vi.fn();

vi.mock("./auth.js", () => ({
  getToken: () => mockGetToken(),
  clearToken: () => mockClearToken(),
  loadConfig: () => mockLoadConfig(),
}));

import { skylightFetch, skylightRequest, getFrameId, getTimezone } from "./client.js";

describe("getFrameId / getTimezone", () => {
  it("returns frameId from config", () => {
    mockLoadConfig.mockReturnValue({ frameId: "f1", timezone: "UTC" });
    expect(getFrameId()).toBe("f1");
  });

  it("returns timezone from config", () => {
    mockLoadConfig.mockReturnValue({ frameId: "f1", timezone: "America/Chicago" });
    expect(getTimezone()).toBe("America/Chicago");
  });
});

describe("skylightFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetToken.mockResolvedValue("tok123");
  });

  it("makes authenticated GET request", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200, ok: true });
    vi.stubGlobal("fetch", mockFetch);

    await skylightFetch("/frames/f1/calendar_events");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://app.ourskylight.com/api/frames/f1/calendar_events",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer tok123",
        }),
      })
    );
  });

  it("appends query params", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200, ok: true });
    vi.stubGlobal("fetch", mockFetch);

    await skylightFetch("/test", { params: { foo: "bar" } });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://app.ourskylight.com/api/test?foo=bar",
      expect.any(Object)
    );
  });

  it("sends JSON body for POST", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 201, ok: true });
    vi.stubGlobal("fetch", mockFetch);

    await skylightFetch("/test", { method: "POST", body: { name: "Test" } });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      })
    );
  });

  it("retries on 401 after clearing token", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true });
    vi.stubGlobal("fetch", mockFetch);

    mockGetToken
      .mockResolvedValueOnce("old-token")
      .mockResolvedValueOnce("new-token");

    const res = await skylightFetch("/test");

    expect(res.status).toBe(200);
    expect(mockClearToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("skylightRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetToken.mockResolvedValue("tok123");
  });

  it("returns parsed JSON on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ events: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await skylightRequest<{ events: unknown[] }>("/test");
    expect(result).toEqual({ events: [] });
  });

  it("throws on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
      text: async () => "Internal Server Error",
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(skylightRequest("/test")).rejects.toThrow("Skylight API error (500)");
  });

  it("returns undefined for 204 No Content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await skylightRequest("/test");
    expect(result).toBeUndefined();
  });
});
