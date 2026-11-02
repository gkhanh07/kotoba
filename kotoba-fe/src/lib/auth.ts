// Sessions live in kotoba-be; this side only keeps the opaque token in an httpOnly cookie.
import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { api, ApiError } from "./api";
import type { Goal, Profile } from "./account";
import type { Progress, SyncState } from "./store";

const SESSION = "kotoba.session";

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

type Session = { token: string; expiresAt: string; onboarded: boolean };
export type AuthError = "credentials" | "rate" | "taken" | "token";

// The BE rate-limits per IP. Next fills x-forwarded-for only when the request has none.
// ponytail: a client can send its own x-forwarded-for when Next faces the internet directly;
// the per-email limits still hold. Put a proxy that overwrites the header in front for real IP limits.
async function ip() {
  return (await headers()).get("x-forwarded-for")?.split(",").at(-1)?.trim() || undefined;
}

// Known BE refusals come back as a code; anything else (BE down, bug) throws to the error boundary.
async function attempt<T>(call: () => Promise<T>, known: AuthError[]): Promise<T | { error: AuthError }> {
  try {
    return await call();
  } catch (e) {
    if (e instanceof ApiError && (known as string[]).includes(e.code)) return { error: e.code as AuthError };
    throw e;
  }
}

async function token() {
  return (await cookies()).get(SESSION)?.value;
}

// One /me call per request. No cookie: guest, no fetch. A dead token reads as a guest too.
export const currentUser = cache(async (): Promise<{ email: string; profile: Profile } | null> => {
  const t = await token();
  if (!t) return null;
  try {
    const profile = await api<Profile>("/me", { token: t });
    return { email: profile.email, profile };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
});

// remember: cookie lasts as long as the BE session; otherwise it dies with the browser.
async function keep(s: Session, remember: boolean) {
  (await cookies()).set(SESSION, s.token, remember ? { ...base, expires: new Date(s.expiresAt) } : base);
}

export async function signIn(email: string, password: string, remember: boolean) {
  const r = await attempt(
    async () => api<Session>("/auth/login", { method: "POST", body: { email, password, remember }, ip: await ip() }),
    ["credentials", "rate"],
  );
  if ("error" in r) return r;
  await keep(r, remember);
  return { onboarded: r.onboarded };
}

export async function signUp(email: string, password: string, goal: Goal): Promise<{ error?: AuthError }> {
  const r = await attempt(
    async () => api<Session>("/auth/register", { method: "POST", body: { email, password, goal }, ip: await ip() }),
    ["taken", "rate"],
  );
  if ("error" in r) return r;
  await keep(r, false);
  return {};
}

// name: null clears it.
export async function saveProfile(profile: { name: string | null; goal: Goal; exam: string; minutes: number }) {
  await api("/me", { method: "PATCH", body: profile, token: await token() });
}

export async function signOut() {
  const t = await token();
  if (t) await api("/auth/logout", { method: "POST", token: t }).catch(() => {});
  (await cookies()).delete(SESSION);
}

// Always succeeds from the caller's view, so the form never reveals which emails have accounts.
export async function requestReset(email: string) {
  await api("/auth/forgot", { method: "POST", body: { email } });
}

export async function resetPassword(resetToken: string, password: string): Promise<{ error?: AuthError }> {
  const r = await attempt(() => api("/auth/reset", { method: "POST", body: { token: resetToken, password } }), ["token"]);
  return r ?? {};
}

// Sends the browser's changes, gets the whole account state back. null: no session (signed out meanwhile).
export async function pushProgress(push: { cards: Progress["cards"]; activity: Progress["activity"] | null; forget: SyncState["forget"] }) {
  const t = await token();
  if (!t) return null;
  try {
    return await api<Progress>("/progress", { method: "PUT", body: push, token: t });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}
