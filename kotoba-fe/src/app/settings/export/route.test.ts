import { beforeEach, describe, expect, it, vi } from "vitest";

// The data source and Next's redirect are stubbed; the handler's own branching is under test.
const exportProgress = vi.fn();
vi.mock("@/lib/auth", () => ({ exportProgress: () => exportProgress() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));
const { GET } = await import("./route");

beforeEach(() => {
  exportProgress.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /settings/export", () => {
  it("answers the export as a no-store JSON attachment", async () => {
    exportProgress.mockResolvedValue({ format: "kotoba-export", cards: { "hiragana:a": { box: 1 } } });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="kotoba-export.json"');
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(JSON.parse(await res.text())).toEqual({ format: "kotoba-export", cards: { "hiragana:a": { box: 1 } } });
  });
  it("sends a guest or an expired session to sign in", async () => {
    exportProgress.mockResolvedValue(null);
    await expect(GET()).rejects.toThrow("redirect:/login?next=/settings");
  });
  it("answers 503 text, never a file, when kotoba-be fails", async () => {
    exportProgress.mockRejectedValue(new TypeError("fetch failed"));
    const res = await GET();
    expect(res.status).toBe(503);
    expect(res.headers.get("content-disposition")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.text()).toBe("Export unavailable, try again later.");
  });
});
