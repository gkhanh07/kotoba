// What the dashboard block "Hay sai" shows for each often-wrong card.
import { weakest, type Srs } from "./srs";
import type { Vocab } from "./flashcards";
import type { Kana } from "./kana";
import { vocabHref, type Kanji } from "./library";

export type ItemLink = { front: string; href: string };
export type WeakItem = ItemLink & { id: string; lapses: number };

// Each kind links to its own page: the kana chart, the kanji page, the word page.
export function itemLinks(kana: Kana[], kanji: Kanji[], vocab: Vocab[]): Record<string, ItemLink> {
  const links: Record<string, ItemLink> = {};
  for (const k of kana) links[k.id] = { front: k.char, href: `/kana?script=${k.script}` };
  for (const k of kanji) links[k.id] = { front: k.char, href: `/kanji/${encodeURIComponent(k.char)}` };
  for (const w of vocab) links[w.id] = { front: w.word, href: vocabHref(w.word) };
  return links;
}

// Cards whose item no longer exists are skipped before the cut, so the list still fills up to n.
export function weakItems(srs: Srs, links: Record<string, ItemLink>, n: number): WeakItem[] {
  return weakest(srs, Infinity)
    .filter((w) => links[w.id])
    .slice(0, n)
    .map((w) => ({ ...links[w.id], id: w.id, lapses: w.lapses }));
}
