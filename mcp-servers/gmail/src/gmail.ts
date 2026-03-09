import { google } from "googleapis";
import { getAuthClient } from "./auth.js";

interface EmailSummary {
  id: string | null | undefined;
  from: string;
  subject: string;
  date: string;
  snippet: string | null | undefined;
}

interface EmailDetail extends EmailSummary {
  to: string;
  body: string;
  labelIds: string[] | null | undefined;
}

interface LabelUpdateResult {
  id: string | null | undefined;
  labelIds: string[] | null | undefined;
}

function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string
): string {
  return headers.find((h) => h.name === name)?.value ?? "";
}

export async function listEmails(
  email: string,
  query: string,
  maxResults: number
): Promise<EmailSummary[]> {
  const auth = await getAuthClient(email);
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query || undefined,
    maxResults,
  });

  const messages = listRes.data.messages ?? [];

  const details = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });
      const headers = detail.data.payload?.headers ?? [];
      return {
        id: msg.id,
        from: getHeader(headers, "From"),
        subject: getHeader(headers, "Subject"),
        date: getHeader(headers, "Date"),
        snippet: detail.data.snippet,
      };
    })
  );

  return details;
}

export async function getMessage(email: string, messageId: string): Promise<EmailDetail> {
  const auth = await getAuthClient(email);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const msg = res.data;
  const headers = msg.payload?.headers ?? [];

  // Extract plain-text body, checking parts first then the top-level body
  let body = "";
  const parts = msg.payload?.parts ?? [];
  const textPart = parts.find((p) => p.mimeType === "text/plain");
  if (textPart?.body?.data) {
    body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
  } else if (msg.payload?.body?.data) {
    body = Buffer.from(msg.payload.body.data, "base64").toString("utf-8");
  }

  return {
    id: msg.id,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    snippet: msg.snippet,
    body,
    labelIds: msg.labelIds,
  };
}

export async function updateLabels(
  email: string,
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
): Promise<LabelUpdateResult> {
  const auth = await getAuthClient(email);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds,
      removeLabelIds,
    },
  });

  return {
    id: res.data.id,
    labelIds: res.data.labelIds,
  };
}
