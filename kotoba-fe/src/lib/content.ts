// Learning content from kotoba-be. Server-only, like api.ts.
import "server-only";
import { api } from "./api";
import type { Group, Kana, KanaSet, Script } from "./kana";

// ponytail: content only changes when kotoba-be reseeds, so an hour of staleness is fine;
// add revalidateTag on a BE webhook if editors ever need instant updates.
const HOUR = 3600;

export const getKana = (query = "") => api<Kana[]>(`/content/kana${query}`, { revalidate: HOUR });

export async function getKanaSet(script: Script, group: Group): Promise<KanaSet> {
  const items = await getKana(`?script=${script}&group=${group}`);
  return { script, group, name: script === "katakana" ? "Katakana" : "Hiragana", items };
}
