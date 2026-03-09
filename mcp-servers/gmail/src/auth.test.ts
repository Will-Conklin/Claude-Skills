import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs/promises (readFile, writeFile, mkdir) and fs (existsSync) separately
// since auth.ts imports from both module specifiers.
vi.mock("fs/promises");
vi.mock("fs");

// runAuthFlow is intentionally NOT tested here — it opens a real browser,
// starts an HTTP server, and waits for an OAuth callback. It is an
// integration/manual test only.

import * as fsp from "fs/promises";
import * as fs from "fs";
import { loadCredentials, loadToken, saveToken, getTokenPath, getAuthClient } from "./auth.js";

const mockReadFile = vi.mocked(fsp.readFile);
const mockWriteFile = vi.mocked(fsp.writeFile);
const mockMkdir = vi.mocked(fsp.mkdir);
const mockExistsSync = vi.mocked(fs.existsSync);

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// loadCredentials
// ---------------------------------------------------------------------------

describe("loadCredentials", () => {
  it("returns credentials from the installed key", async () => {
    const creds = { client_id: "cid", client_secret: "csec", redirect_uris: ["http://localhost"] };
    mockReadFile.mockResolvedValue(JSON.stringify({ installed: creds }) as never);

    const result = await loadCredentials();

    expect(result.client_id).toBe("cid");
    expect(result.client_secret).toBe("csec");
  });

  it("returns credentials from the web key when installed is absent", async () => {
    const creds = { client_id: "web-cid", client_secret: "web-csec" };
    mockReadFile.mockResolvedValue(JSON.stringify({ web: creds }) as never);

    const result = await loadCredentials();

    expect(result.client_id).toBe("web-cid");
  });

  it("throws a descriptive error when the credentials file is missing", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT: file not found") as never);

    await expect(loadCredentials()).rejects.toThrow("Credentials file not found");
  });

  it('throws when JSON contains neither "installed" nor "web" key', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({}) as never);

    await expect(loadCredentials()).rejects.toThrow(
      'expected an "installed" or "web" key'
    );
  });

  it("throws SyntaxError on malformed JSON (existing behaviour)", async () => {
    mockReadFile.mockResolvedValue("not valid json" as never);

    await expect(loadCredentials()).rejects.toThrow(SyntaxError);
  });
});

// ---------------------------------------------------------------------------
// getTokenPath
// ---------------------------------------------------------------------------

describe("getTokenPath", () => {
  it("includes the email and ends with .json", () => {
    const path = getTokenPath("user@example.com");
    expect(path).toContain("user@example.com");
    expect(path).toMatch(/\.json$/);
  });
});

// ---------------------------------------------------------------------------
// loadToken
// ---------------------------------------------------------------------------

describe("loadToken", () => {
  it("returns null when the token file does not exist", async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await loadToken("user@example.com");

    expect(result).toBeNull();
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it("returns the parsed token object when the file exists", async () => {
    const token = { access_token: "abc", refresh_token: "xyz" };
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify(token) as never);

    const result = await loadToken("user@example.com");

    expect(result).toEqual(token);
  });
});

// ---------------------------------------------------------------------------
// saveToken
// ---------------------------------------------------------------------------

describe("saveToken", () => {
  it("creates the tokens directory and writes JSON", async () => {
    mockMkdir.mockResolvedValue(undefined as never);
    mockWriteFile.mockResolvedValue(undefined as never);

    const token = { access_token: "tok" };
    await saveToken("user@example.com", token);

    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("tokens"), { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("user@example.com"),
      expect.stringContaining('"access_token"'),
      "utf-8"
    );
  });
});

// ---------------------------------------------------------------------------
// getAuthClient
// ---------------------------------------------------------------------------

describe("getAuthClient", () => {
  const fakeCreds = { client_id: "cid", client_secret: "csec" };
  const fakeToken = { access_token: "at", refresh_token: "rt" };

  it('throws "not authenticated" when no token is saved for the account', async () => {
    // loadCredentials → succeed; loadToken → null
    mockReadFile.mockResolvedValue(JSON.stringify({ installed: fakeCreds }) as never);
    mockExistsSync.mockReturnValue(false);

    await expect(getAuthClient("nobody@example.com")).rejects.toThrow("not authenticated");
  });

  it("returns an OAuth2Client with credentials set when a token exists", async () => {
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify({ installed: fakeCreds }) as never) // loadCredentials
      .mockResolvedValueOnce(JSON.stringify(fakeToken) as never);               // loadToken readFile
    mockExistsSync.mockReturnValue(true);

    const client = await getAuthClient("user@example.com");

    // OAuth2Client.credentials is set by setCredentials()
    expect(client.credentials).toMatchObject({ access_token: "at" });
  });
});
