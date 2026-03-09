import { OAuth2Client } from "google-auth-library";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { createServer } from "http";
import { parse } from "url";
import { join } from "path";
import { homedir } from "os";
import { exec } from "child_process";

const MCP_DIR = join(homedir(), ".gmail-mcp");
const CREDENTIALS_FILE = join(MCP_DIR, "gcp-oauth.keys.json");
const TOKENS_DIR = join(MCP_DIR, "tokens");

interface GcpCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
}

interface GcpKeysFile {
  installed?: GcpCredentials;
  web?: GcpCredentials;
}

export async function loadCredentials(): Promise<GcpCredentials> {
  let raw: string;
  try {
    raw = await readFile(CREDENTIALS_FILE, "utf-8");
  } catch {
    throw new Error(
      `Credentials file not found at ${CREDENTIALS_FILE}. ` +
        `Create a Desktop app OAuth client in Google Cloud Console and save the JSON there.`
    );
  }
  const parsed: GcpKeysFile = JSON.parse(raw);
  const creds = parsed.installed ?? parsed.web;
  if (!creds) {
    throw new Error(`Invalid credentials file: expected an "installed" or "web" key.`);
  }
  return creds;
}

export function getTokenPath(email: string): string {
  return join(TOKENS_DIR, `${email}.json`);
}

export async function loadToken(email: string): Promise<Record<string, unknown> | null> {
  const path = getTokenPath(email);
  if (!existsSync(path)) return null;
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

export async function saveToken(email: string, token: Record<string, unknown>): Promise<void> {
  await mkdir(TOKENS_DIR, { recursive: true });
  await writeFile(getTokenPath(email), JSON.stringify(token, null, 2), "utf-8");
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {
    // ignore errors — user can open URL manually
  });
}

export async function runAuthFlow(email: string): Promise<string> {
  const creds = await loadCredentials();

  // Pick a random high port for the local redirect server
  const redirectPort = 3000 + Math.floor(Math.random() * 7000);
  const redirectUri = `http://localhost:${redirectPort}`;

  const client = new OAuth2Client(creds.client_id, creds.client_secret, redirectUri);

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.modify"],
    prompt: "consent",
    login_hint: email,
  });

  // Start a local HTTP server to receive the OAuth callback
  const code = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Auth flow timed out after 5 minutes. Try again."));
    }, 5 * 60 * 1000);

    const server = createServer((req, res) => {
      const parsed = parse(req.url ?? "", true);
      const code = parsed.query["code"];
      if (typeof code === "string" && code.length > 0) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body><h2>Authentication successful.</h2><p>You can close this tab and return to Claude.</p></body></html>"
        );
        server.close();
        clearTimeout(timeout);
        resolve(code);
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing authorization code.");
      }
    });

    server.listen(redirectPort, () => {
      openBrowser(authUrl);
    });
  });

  const { tokens } = await client.getToken(code);
  await saveToken(email, tokens as Record<string, unknown>);

  return (
    `Successfully authenticated ${email}. ` +
    `Token saved to ${getTokenPath(email)}.`
  );
}

export async function getAuthClient(email: string): Promise<OAuth2Client> {
  const creds = await loadCredentials();
  const client = new OAuth2Client(creds.client_id, creds.client_secret);

  const token = await loadToken(email);
  if (!token) {
    throw new Error(
      `Account ${email} is not authenticated. ` +
        `Use the gmail_auth tool to complete the OAuth flow first.`
    );
  }

  client.setCredentials(token);

  // Persist refreshed tokens automatically
  client.on("tokens", async (newTokens) => {
    const merged = { ...token, ...newTokens };
    await saveToken(email, merged as Record<string, unknown>);
  });

  return client;
}
