"use client";

import type { Lang } from "@/lib/i18n";
import { formatDay, libraryText } from "@/lib/library";
import { KNOWN_AT } from "@/lib/srs";
import { today, useDeck } from "@/lib/store";

// This browser's schedule for one word. The server has no deck, so it renders "…" until hydration.
export function VocabSchedule({ id, lang }: { id: string; lang: Lang }) {
  const t = libraryText[lang].vocab;
  const deck = useDeck();
  const card = deck?.srs[id];
  // Hits after "known" keep raising box, so the display stops at the last box.
  const text = !deck ? "…" : !card ? t.fresh : [
    t.box(Math.min(card.box, KNOWN_AT), KNOWN_AT),
    card.box >= KNOWN_AT && t.known,
    card.due <= today() ? t.dueToday : t.due(formatDay(card.due)),
    t.lapses(card.lapses ?? 0),
  ].filter(Boolean).join(" · ");
  return <p>{text}</p>;
}
