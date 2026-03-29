import { getToken, clearToken, loadConfig } from "./auth.js";

const BASE_URL = "https://app.ourskylight.com/api";

export interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

export function getFrameId(): string {
  return loadConfig().frameId;
}

export function getTimezone(): string {
  return loadConfig().timezone;
}

export async function skylightFetch(
  path: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { method = "GET", body, params } = options;

  const makeRequest = async (): Promise<Response> => {
    const token = await getToken();
    let url = `${BASE_URL}${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchOptions: RequestInit = { method, headers };
    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    return fetch(url, fetchOptions);
  };

  let res = await makeRequest();

  if (res.status === 401) {
    clearToken();
    res = await makeRequest();
  }

  return res;
}

export async function skylightRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const res = await skylightFetch(path, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Skylight API error (${res.status}): ${text}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
