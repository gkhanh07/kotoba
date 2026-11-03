// Learning content from kotoba-be. Server-only, like api.ts.
import "server-only";
import { api, ApiError } from "./api";
import type { Grammar, Hit, Kanji, KanjiDetail, Lesson } from "./library";
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
const item = <T,>(id: string) =>
  api<T>(`/content/item/${encodeURIComponent(id)}`, { revalidate: HOUR }).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
export const getKanjiDetail = (char: string) => item<KanjiDetail>(`kanji:${char}`);

export const getGrammar = () => api<Grammar[]>("/content/grammar", { revalidate: HOUR });
export const getGrammarItem = (slug: string) => item<Grammar>(`grammar:${slug}`);

// Up to 20 hits per kind, in BE sort order.
export const search = (q: string) => api<Hit[]>(`/search?q=${encodeURIComponent(q)}`, { revalidate: HOUR });
