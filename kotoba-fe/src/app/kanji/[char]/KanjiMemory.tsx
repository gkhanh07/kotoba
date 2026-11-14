"use client";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { libraryText } from "@/lib/library";
import { daysUntil, KNOWN_AT } from "@/lib/srs";
import { today, useDeck } from "@/lib/store";
import { Arrow } from "../../Arrow";
import { stateOf } from "../KanjiGrid";
import s from "../kanji.module.css";

// This browser's memory of one kanji, beside the character, with the one way to practise it: its lesson.
// The server has no deck, so it renders "…" until hydration. Hits after "known" keep raising the box,
// so the meter stops at the last box (as on /vocab/[word]).
export function KanjiMemory({ id, lesson, lang }: { id: string; lesson: number; lang: Lang }) {
  const t = libraryText[lang].kanji;
  const deck = useDeck();
  const card = deck?.srs[id];
  const state = stateOf(deck?.srs, id);
  const box = Math.min(card?.box ?? 0, KNOWN_AT);
  return (
    <aside className={`panel ${s.memory}`} data-raised="" aria-labelledby="kanji-memory">
      <h2 id="kanji-memory">{t.memory}</h2>
      {!deck ? <p className={s.memoryText}>…</p> : !card || !state ? <p className={s.memoryText}>{t.fresh}</p> : (
        <>
          <span className="tag" data-state={state}>{t.state[state]}</span>
          <progress className="meter" aria-label={t.memory} value={box} max={KNOWN_AT} />
          <p className={s.memoryText}>
            {t.box(box, KNOWN_AT)} · {card.due <= today() ? t.dueToday : t.dueIn(daysUntil(card.due, today()))}
          </p>
        </>
      )}
      <Link href={`/lessons/${lesson}`} className="btn">{t.study(lesson)} <Arrow /></Link>
    </aside>
  );
}
