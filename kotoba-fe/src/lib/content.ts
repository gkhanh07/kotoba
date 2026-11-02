// Learning content from kotoba-be. Server-only, like api.ts.
import "server-only";
import { api, ApiError } from "./api";
import type { Kanji, KanjiDetail, Lesson } from "./library";
import type { Vocab } from "./flashcards";
import type { Group, Kana, KanaSet, Script } from "./kana";

// ponytail: content only changes when kotoba-be reseeds, so an hour of staleness is fine;
// add revalidateTag on a BE webhook if editors ever need instant updates.
const HOUR = 3600;

export const getKana = (query = "") => api<Kana[]>(`/content/kana${query}`, { revalidate: HOUR });

export async function getKanaSet(script: Script, group: Group): Promise<KanaSet> {
  const items = await getKana(`?script=${script}&group=${group}`);
  return { script, group, name: script === "katakana" ? "Katakana" : "Hiragana", items };
}

export const getVocab = (query = "") => api<Vocab[]>(`/content/vocab${query}`, { revalidate: HOUR });

export const getKanji = () => api<Kanji[]>("/content/kanji", { revalidate: HOUR });
export const getLessons = () => api<Lesson[]>("/content/lesson", { revalidate: HOUR });

// null when the BE has no such item; other failures still throw to the error boundary.
export const getKanjiDetail = (char: string) =>
  api<KanjiDetail>(`/content/item/${encodeURIComponent(`kanji:${char}`)}`, { revalidate: HOUR }).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
