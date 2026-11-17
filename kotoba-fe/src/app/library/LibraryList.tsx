"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { libraryText, type Filter } from "@/lib/library";
import { isLearned } from "@/lib/srs";
import { useDeck } from "@/lib/store";
import { stateOf } from "../kanji/KanjiGrid";
import s from "./library.module.css";
import { libraryPageText } from "./text";

export type LibraryRow = { id: string; front: string; sub: string; href: string };

// Learned and saved live in this browser, so a filtered list waits for the deck instead of guessing (as KanjiGrid does).
export function LibraryList({ rows, filter, lang }: { rows: LibraryRow[]; filter: Filter; lang: Lang }) {
  const t = libraryPageText[lang];
  const state = libraryText[lang].kanji.state;
  const deck = useDeck();
  if (filter !== "all" && !deck) return <p className={s.note}>—</p>;
  const keep = (id: string) => filter === "all" ? true
    : filter === "saved" ? !!deck?.srs[id]?.saved
    : (!!deck && isLearned(deck.srs, id)) === (filter === "learned");
  const shown = rows.filter((r) => keep(r.id));
  if (!shown.length) return <p className={s.note}>{t.none}</p>;
  return (
    <>
      <p className={s.note}>{t.count(shown.length)}</p>
      <ul className={s.list}>
        {shown.map((r) => {
          const st = stateOf(deck?.srs, r.id);
          return (
            <li key={r.id}>
              <Link href={r.href} lang="ja" className={s.front}>{r.front}</Link>
              <span className={s.sub}>{r.sub}</span>
              {st && <span className="tag" data-state={st}><span className="sr-only">, </span>{state[st]}</span>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
