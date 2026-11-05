import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("api", () => {
  it("sends an uncached GET with no headers by default", async () => {
    fetchMock.mockResolvedValue(json(200, { a: 1 }));
    expect(await api("/x")).toEqual({ a: 1 });
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/x", { method: "GET", headers: {}, body: undefined, cache: "no-store" });
  });
  it("sends json body, bearer token and client ip", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await api("/y", { method: "POST", body: { a: 1 }, token: "tok", ip: "1.2.3.4" });
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/y", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer tok", "x-client-ip": "1.2.3.4" },
      body: '{"a":1}',
      cache: "no-store",
    });
  });
  it("uses the Next fetch cache when revalidate is set", async () => {
    fetchMock.mockResolvedValue(json(200, []));
    await api("/z", { revalidate: 3600 });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "force-cache", next: { revalidate: 3600 } });
  });
  it("returns undefined for 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await api("/n", { method: "DELETE" })).toBeUndefined();
  });
  it("throws ApiError with status and the BE message code", async () => {
    fetchMock.mockResolvedValue(json(409, { message: "taken" }));
    const e = await api("/r").catch((x) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(409);
    expect(e.code).toBe("taken");
    expect(e.message).toBe("409 taken");
  });
  it("uses an empty code when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));
    const e = await api("/r").catch((x) => x);
    expect(e.status).toBe(500);
    expect(e.code).toBe("");
  });
  it("uses an empty code when message is not a string", async () => {
    fetchMock.mockResolvedValue(json(400, { message: ["email", "password"] }));
    const e = await api("/r").catch((x) => x);
    expect(e.code).toBe("");
  });
});
