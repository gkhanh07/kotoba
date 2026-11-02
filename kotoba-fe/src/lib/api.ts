// The only way to kotoba-be. Runs on the Next server; the browser never talks to the BE.
import "server-only";

const BASE = process.env.API_URL ?? "http://127.0.0.1:4000";

// status + the BE's short error code ("credentials", "rate", "taken", "token", or a field name).
export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(`${status} ${code}`);
  }
}

type Opts = { method?: string; body?: unknown; token?: string; ip?: string };

export async function api<T = void>(path: string, { method = "GET", body, token, ip }: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (ip) headers["x-client-ip"] = ip;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, typeof data.message === "string" ? data.message : "");
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
