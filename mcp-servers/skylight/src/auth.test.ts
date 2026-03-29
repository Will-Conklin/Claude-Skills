import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockExistsSync = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
}));

vi.mock("fs", () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
}));

import { loadConfig, login, getToken, clearToken } from "./auth.js";

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns config from environment variables", () => {
    process.env.SKYLIGHT_EMAIL = "test@example.com";
    process.env.SKYLIGHT_PASSWORD = "secret";
    process.env.SKYLIGHT_FRAME_ID = "frame123";
    process.env.SKYLIGHT_TIMEZONE = "America/Chicago";

    const config = loadConfig();
    expect(config).toEqual({
      email: "test@example.com",
      password: "secret",
      frameId: "frame123",
      timezone: "America/Chicago",
    });
  });

  it("defaults timezone to America/New_York", () => {
    process.env.SKYLIGHT_EMAIL = "test@example.com";
    process.env.SKYLIGHT_PASSWORD = "secret";
    process.env.SKYLIGHT_FRAME_ID = "frame123";
    delete process.env.SKYLIGHT_TIMEZONE;

    const config = loadConfig();
    expect(config.timezone).toBe("America/New_York");
  });

  it("throws when required env vars are missing", () => {
    delete process.env.SKYLIGHT_EMAIL;
    delete process.env.SKYLIGHT_PASSWORD;
    delete process.env.SKYLIGHT_FRAME_ID;

    expect(() => loadConfig()).toThrow("Missing required environment variables");
  });
});

describe("login", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SKYLIGHT_EMAIL: "test@example.com",
      SKYLIGHT_PASSWORD: "secret",
      SKYLIGHT_FRAME_ID: "frame123",
    };
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    clearToken();
  });

  it("logs in and returns token data", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "abc123", id: "user1" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await login();
    expect(result.token).toBe("abc123");
    expect(result.userId).toBe("user1");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://app.ourskylight.com/api/sessions",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws on failed login", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(login()).rejects.toThrow("Skylight login failed (401)");
  });

  it("throws when response has no token", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user1" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(login()).rejects.toThrow("missing token");
  });
});

describe("getToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SKYLIGHT_EMAIL: "test@example.com",
      SKYLIGHT_PASSWORD: "secret",
      SKYLIGHT_FRAME_ID: "frame123",
    };
    clearToken();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    clearToken();
  });

  it("returns cached token from disk", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({ token: "disk-token", userId: "u1", cachedAt: Date.now() })
    );

    const token = await getToken();
    expect(token).toBe("disk-token");
  });

  it("logs in when no cached token exists", async () => {
    mockExistsSync.mockReturnValue(false);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "fresh-token", id: "user1" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const token = await getToken();
    expect(token).toBe("fresh-token");
  });

  it("returns in-memory cached token on subsequent calls", async () => {
    mockExistsSync.mockReturnValue(false);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "mem-token", id: "user1" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await getToken();
    const token2 = await getToken();
    expect(token2).toBe("mem-token");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
