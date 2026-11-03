import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
const hdrs = { get: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => jar, headers: async () => hdrs }));
vi.mock("./api", async (orig) => ({ ...(await orig<typeof import("./api")>()), api: vi.fn() }));

import { ApiError, api } from "./api";
import { changePassword, currentUser, deleteAccount, exportProgress, pushProgress, requestReset, resetPassword, saveProfile, signIn, signOut, signUp } from "./auth";

const apiMock = vi.mocked(api);
const withToken = (t: string | undefined) => jar.get.mockReturnValue(t ? { value: t } : undefined);

beforeEach(() => {
  apiMock.mockReset();
  jar.get.mockReset();
  jar.set.mockReset();
  jar.delete.mockReset();
  hdrs.get.mockReset().mockReturnValue(null);
});

describe("currentUser", () => {
  it("is null without a cookie and does not call the BE", async () => {
    withToken(undefined);
    expect(await currentUser()).toBeNull();
    expect(apiMock).not.toHaveBeenCalled();
  });
  it("returns email and profile", async () => {
    withToken("tok");
    apiMock.mockResolvedValue({ email: "a@b.co", goal: "N5" });
    expect(await currentUser()).toEqual({ email: "a@b.co", profile: { email: "a@b.co", goal: "N5" } });
    expect(apiMock).toHaveBeenCalledWith("/me", { token: "tok" });
  });
  it("reads a dead token as guest", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(401, ""));
    expect(await currentUser()).toBeNull();
  });
  it("throws other failures", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(500, ""));
    await expect(currentUser()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("signIn", () => {
  it("sets a persistent cookie when remembered and forwards the last forwarded ip", async () => {
    hdrs.get.mockReturnValue("9.9.9.9, 1.2.3.4");
    apiMock.mockResolvedValue({ token: "t1", expiresAt: "2030-01-01T00:00:00.000Z", onboarded: true });
    expect(await signIn("a@b.co", "pw", true)).toEqual({ onboarded: true });
    expect(apiMock).toHaveBeenCalledWith("/auth/login", { method: "POST", body: { email: "a@b.co", password: "pw", remember: true }, ip: "1.2.3.4" });
    expect(jar.set).toHaveBeenCalledWith("kotoba.session", "t1", { httpOnly: true, sameSite: "lax", path: "/", secure: false, expires: new Date("2030-01-01T00:00:00.000Z") });
  });
  it("sets a session cookie when not remembered", async () => {
    apiMock.mockResolvedValue({ token: "t2", expiresAt: "2030-01-01T00:00:00.000Z", onboarded: false });
    expect(await signIn("a@b.co", "pw", false)).toEqual({ onboarded: false });
    expect(jar.set).toHaveBeenCalledWith("kotoba.session", "t2", { httpOnly: true, sameSite: "lax", path: "/", secure: false });
    expect(apiMock.mock.calls[0][1]).toMatchObject({ ip: undefined });
  });
  it.each(["credentials", "rate"])("returns the %s refusal without a cookie", async (code) => {
    apiMock.mockRejectedValue(new ApiError(401, code));
    expect(await signIn("a@b.co", "pw", false)).toEqual({ error: code });
    expect(jar.set).not.toHaveBeenCalled();
  });
  it("throws unknown failures", async () => {
    apiMock.mockRejectedValue(new ApiError(500, "boom"));
    await expect(signIn("a@b.co", "pw", false)).rejects.toBeInstanceOf(ApiError);
  });
  it("throws non-API errors", async () => {
    apiMock.mockRejectedValue(new Error("network"));
    await expect(signIn("a@b.co", "pw", false)).rejects.toThrow("network");
  });
});

describe("signUp", () => {
  it("registers and sets a session cookie", async () => {
    apiMock.mockResolvedValue({ token: "t3", expiresAt: "2030-01-01T00:00:00.000Z", onboarded: false });
    expect(await signUp("a@b.co", "password1", "N4")).toEqual({});
    expect(apiMock).toHaveBeenCalledWith("/auth/register", { method: "POST", body: { email: "a@b.co", password: "password1", goal: "N4" }, ip: undefined });
    expect(jar.set).toHaveBeenCalledWith("kotoba.session", "t3", expect.objectContaining({ httpOnly: true }));
  });
  it("returns taken", async () => {
    apiMock.mockRejectedValue(new ApiError(409, "taken"));
    expect(await signUp("a@b.co", "password1", "N4")).toEqual({ error: "taken" });
  });
});

describe("profile and session", () => {
  it("saveProfile patches /me with the token", async () => {
    withToken("tok");
    const p = { name: null, goal: "N5" as const, exam: "unknown", minutes: 15 };
    await saveProfile(p);
    expect(apiMock).toHaveBeenCalledWith("/me", { method: "PATCH", body: p, token: "tok" });
  });
  it("signOut logs out on the BE and deletes the cookie", async () => {
    withToken("tok");
    apiMock.mockResolvedValue(undefined);
    await signOut();
    expect(apiMock).toHaveBeenCalledWith("/auth/logout", { method: "POST", token: "tok" });
    expect(jar.delete).toHaveBeenCalledWith("kotoba.session");
  });
  it("signOut still deletes the cookie when the BE fails", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new Error("down"));
    await signOut();
    expect(jar.delete).toHaveBeenCalledWith("kotoba.session");
  });
  it("signOut without a session skips the BE", async () => {
    withToken(undefined);
    await signOut();
    expect(apiMock).not.toHaveBeenCalled();
    expect(jar.delete).toHaveBeenCalledWith("kotoba.session");
  });
});

describe("passwords and account", () => {
  it("requestReset posts the email", async () => {
    await requestReset("a@b.co");
    expect(apiMock).toHaveBeenCalledWith("/auth/forgot", { method: "POST", body: { email: "a@b.co" } });
  });
  it("resetPassword succeeds with {}", async () => {
    apiMock.mockResolvedValue(undefined);
    expect(await resetPassword("rt", "newpassword")).toEqual({});
    expect(apiMock).toHaveBeenCalledWith("/auth/reset", { method: "POST", body: { token: "rt", password: "newpassword" } });
  });
  it("resetPassword reports a bad token", async () => {
    apiMock.mockRejectedValue(new ApiError(400, "token"));
    expect(await resetPassword("rt", "newpassword")).toEqual({ error: "token" });
  });
  it("changePassword succeeds with {}", async () => {
    withToken("tok");
    apiMock.mockResolvedValue(undefined);
    expect(await changePassword("old", "new12345")).toEqual({});
    expect(apiMock).toHaveBeenCalledWith("/me/password", { method: "POST", body: { current: "old", password: "new12345" }, token: "tok" });
  });
  it("changePassword reports wrong credentials", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(401, "credentials"));
    expect(await changePassword("old", "new12345")).toEqual({ error: "credentials" });
  });
  it("deleteAccount removes the cookie on success", async () => {
    withToken("tok");
    apiMock.mockResolvedValue(undefined);
    expect(await deleteAccount("pw")).toEqual({});
    expect(apiMock).toHaveBeenCalledWith("/me", { method: "DELETE", body: { password: "pw" }, token: "tok" });
    expect(jar.delete).toHaveBeenCalledWith("kotoba.session");
  });
  it("deleteAccount keeps the cookie on a wrong password", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(401, "credentials"));
    expect(await deleteAccount("bad")).toEqual({ error: "credentials" });
    expect(jar.delete).not.toHaveBeenCalled();
  });
});

describe("pushProgress", () => {
  const push = { cards: {}, activity: null, forget: [] };
  it("is null without a session", async () => {
    withToken(undefined);
    expect(await pushProgress(push)).toBeNull();
    expect(apiMock).not.toHaveBeenCalled();
  });
  it("returns the account state", async () => {
    withToken("tok");
    apiMock.mockResolvedValue({ cards: {}, activity: { days: {} } });
    expect(await pushProgress(push)).toEqual({ cards: {}, activity: { days: {} } });
    expect(apiMock).toHaveBeenCalledWith("/progress", { method: "PUT", body: push, token: "tok" });
  });
  it("is null when the session died meanwhile", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(401, ""));
    expect(await pushProgress(push)).toBeNull();
  });
  it("throws other failures", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(500, ""));
    await expect(pushProgress(push)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("exportProgress (phase 21)", () => {
  it("is null without a session and does not call the BE", async () => {
    withToken(undefined);
    expect(await exportProgress()).toBeNull();
    expect(apiMock).not.toHaveBeenCalled();
  });
  it("returns the export file with the session's token", async () => {
    withToken("tok");
    apiMock.mockResolvedValue({ format: "kotoba-export", cards: {} });
    expect(await exportProgress()).toEqual({ format: "kotoba-export", cards: {} });
    expect(apiMock).toHaveBeenCalledWith("/me/export", { token: "tok" });
  });
  it("is null when the session died meanwhile", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(401, ""));
    expect(await exportProgress()).toBeNull();
  });
  it("throws other failures", async () => {
    withToken("tok");
    apiMock.mockRejectedValue(new ApiError(500, ""));
    await expect(exportProgress()).rejects.toBeInstanceOf(ApiError);
  });
});
