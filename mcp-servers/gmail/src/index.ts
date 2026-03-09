import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runAuthFlow } from "./auth.js";
import { listEmails, getMessage, updateLabels } from "./gmail.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gmail",
    version: "1.0.0",
  });

  server.tool(
    "gmail_auth",
    "Authenticate a Gmail account via browser OAuth flow. Returns the auth URL to open if the browser cannot be opened automatically.",
    { email: z.string().describe("Gmail address to authenticate") },
    async ({ email }) => {
      try {
        const result = await runAuthFlow(email);
        return { content: [{ type: "text", text: result }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Auth failed: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "gmail_list_emails",
    "List recent emails from a Gmail account.",
    {
      email: z.string().describe("Authenticated Gmail address"),
      query: z.string().optional().describe("Gmail search query, e.g. 'is:unread from:alice@example.com'"),
      maxResults: z.number().optional().default(10).describe("Maximum number of messages to return (default 10)"),
    },
    async ({ email, query, maxResults }) => {
      try {
        const emails = await listEmails(email, query ?? "", maxResults ?? 10);
        if (emails.length === 0) {
          return { content: [{ type: "text", text: "No messages found." }] };
        }
        const text = emails
          .map(
            (e) =>
              `ID: ${e.id}\nFrom: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nSnippet: ${e.snippet}`
          )
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "gmail_get_message",
    "Get the full content of a specific Gmail message.",
    {
      email: z.string().describe("Authenticated Gmail address"),
      messageId: z.string().describe("Message ID from gmail_list_emails"),
    },
    async ({ email, messageId }) => {
      try {
        const msg = await getMessage(email, messageId);
        const text = [
          `From: ${msg.from}`,
          `To: ${msg.to}`,
          `Subject: ${msg.subject}`,
          `Date: ${msg.date}`,
          `Labels: ${(msg.labelIds ?? []).join(", ")}`,
          ``,
          msg.body || msg.snippet || "(no body)",
        ].join("\n");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  server.tool(
    "gmail_update_labels",
    "Add or remove labels on a Gmail message. Use Gmail label IDs (e.g. INBOX, UNREAD, or custom label IDs).",
    {
      email: z.string().describe("Authenticated Gmail address"),
      messageId: z.string().describe("Message ID"),
      addLabelIds: z
        .array(z.string())
        .optional()
        .default([])
        .describe("Label IDs to add (e.g. ['UNREAD', 'Label_123'])"),
      removeLabelIds: z
        .array(z.string())
        .optional()
        .default([])
        .describe("Label IDs to remove (e.g. ['INBOX'])"),
    },
    async ({ email, messageId, addLabelIds, removeLabelIds }) => {
      try {
        const result = await updateLabels(
          email,
          messageId,
          addLabelIds ?? [],
          removeLabelIds ?? []
        );
        return {
          content: [
            {
              type: "text",
              text: `Updated labels on message ${result.id}. Current labels: ${(result.labelIds ?? []).join(", ")}`,
            },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }
  );

  return server;
}

const transport = new StdioServerTransport();
await createServer().connect(transport);
