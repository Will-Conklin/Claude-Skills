import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const MCP_DIR = join(homedir(), ".skylight-mcp");
const TOKEN_FILE = join(MCP_DIR, "token.json");

const BASE_URL = "https://app.ourskylight.com/api";

export interface SkylightConfig {
  email: string;
  password: string;
  frameId: string;
  timezone: string;
}

interface CachedToken {
  token: string;
  userId: string;
  cachedAt: number;
}

let cachedToken: CachedToken | null = null;

export function loadConfig(): SkylightConfig {
  const email = process.env.SKYLIGHT_EMAIL;
  const password = process.env.SKYLIGHT_PASSWORD;
  const frameId = process.env.SKYLIGHT_FRAME_ID;
  const timezone = process.env.SKYLIGHT_TIMEZONE ?? "America/New_York";

  if (!email || !password || !frameId) {
    throw new Error(
      "Missing required environment variables. Set SKYLIGHT_EMAIL, SKYLIGHT_PASSWORD, and SKYLIGHT_FRAME_ID."
    );
  }

  return { email, password, frameId, timezone };
}

export async function login(): Promise<CachedToken> {
  const config = loadConfig();

  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Skylight login failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token?: string; id?: string };
  if (!data.token) {
    throw new Error("Skylight login response missing token.");
  }

  const tokenData: CachedToken = {
    token: data.token,
    userId: data.id ?? "",
    cachedAt: Date.now(),
  };

  cachedToken = tokenData;
  await saveCachedToken(tokenData);
  return tokenData;
}

export async function getToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken.token;
  }

  const disk = await loadCachedToken();
  if (disk) {
    cachedToken = disk;
    return disk.token;
  }

  const fresh = await login();
  return fresh.token;
}

export function clearToken(): void {
  cachedToken = null;
}

async function loadCachedToken(): Promise<CachedToken | null> {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    const raw = await readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(raw) as CachedToken;
  } catch {
    return null;
  }
}

async function saveCachedToken(data: CachedToken): Promise<void> {
  await mkdir(MCP_DIR, { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), "utf-8");
}
