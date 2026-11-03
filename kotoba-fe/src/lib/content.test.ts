import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", async (orig) => ({ ...(await orig<typeof import("./api")>()), api: vi.fn() }));

import { ApiError, api } from "./api";
import { getGrammar, getGrammarItem, getKana, getKanaSet, getKanji, getKanjiDetail, getLessons, getTest, getTests, getVocab, search } from "./content";

const apiMock = vi.mocked(api);
beforeEach(() => {
  apiMock.mockReset();
});

describe("content", () => {
  it("getKana requests the list cached for an hour", async () => {
    apiMock.mockResolvedValue([]);
    await getKana();
    expect(apiMock).toHaveBeenCalledWith("/content/kana", { revalidate: 3600 });
  });
  it("getKanaSet builds the set with the Katakana name", async () => {
    apiMock.mockResolvedValue([{ id: "katakana:ka" }]);
    expect(await getKanaSet("katakana", "basic")).toEqual({ script: "katakana", group: "basic", name: "Katakana", items: [{ id: "katakana:ka" }] });
    expect(apiMock).toHaveBeenCalledWith("/content/kana?script=katakana&group=basic", { revalidate: 3600 });
  });
  it("getKanaSet names hiragana sets Hiragana", async () => {
    apiMock.mockResolvedValue([]);
    expect((await getKanaSet("hiragana", "yoon")).name).toBe("Hiragana");
  });
  it("getVocab, getKanji, getLessons and getGrammar hit their paths", async () => {
    apiMock.mockResolvedValue([]);
    await getVocab("?lesson=1");
    await getKanji();
    await getLessons();
    await getGrammar();
    expect(apiMock.mock.calls).toEqual([
      ["/content/vocab?lesson=1", { revalidate: 3600 }],
      ["/content/kanji", { revalidate: 3600 }],
      ["/content/lesson", { revalidate: 3600 }],
      ["/content/grammar", { revalidate: 3600 }],
    ]);
  });
  it("getKanjiDetail encodes the id", async () => {
    apiMock.mockResolvedValue({ id: "kanji:日" });
    expect(await getKanjiDetail("日")).toEqual({ id: "kanji:日" });
    expect(apiMock).toHaveBeenCalledWith(`/content/item/${encodeURIComponent("kanji:日")}`, { revalidate: 3600 });
  });
  it("returns null on a 404", async () => {
    apiMock.mockImplementation(() => Promise.reject(new ApiError(404, "")));
    expect(await getGrammarItem("nope")).toBeNull();
    expect(apiMock).toHaveBeenCalledWith("/content/item/grammar%3Anope", { revalidate: 3600 });
  });
  it("rethrows other API errors", async () => {
    const err = new ApiError(500, "");
    apiMock.mockImplementation(() => Promise.reject(err));
    await expect(getKanjiDetail("日")).rejects.toBe(err);
  });
  it("rethrows non-API errors", async () => {
    const err = new Error("down");
    apiMock.mockImplementation(() => Promise.reject(err));
    await expect(getGrammarItem("x")).rejects.toBe(err);
  });
  it("search encodes the query", async () => {
    apiMock.mockResolvedValue([]);
    await search("a b&c");
    expect(apiMock).toHaveBeenCalledWith("/search?q=a%20b%26c", { revalidate: 3600 });
  });
});

describe("mock tests", () => {
  it("getTests lists the papers cached for an hour", async () => {
    apiMock.mockResolvedValue([]);
    await getTests();
    expect(apiMock).toHaveBeenCalledWith("/tests", { revalidate: 3600 });
  });
  it("getTest returns the paper and encodes the id", async () => {
    apiMock.mockResolvedValue({ id: "n5-1" });
    expect(await getTest("n5-1")).toEqual({ id: "n5-1" });
    await getTest("a/b");
    expect(apiMock).toHaveBeenLastCalledWith("/tests/a%2Fb", { revalidate: 3600 });
  });
  it("getTest returns null on 404 and rethrows other errors", async () => {
    apiMock.mockImplementation(() => Promise.reject(new ApiError(404, "")));
    expect(await getTest("nope")).toBeNull();
    const err = new ApiError(500, "");
    apiMock.mockImplementation(() => Promise.reject(err));
    await expect(getTest("x")).rejects.toBe(err);
  });
});
