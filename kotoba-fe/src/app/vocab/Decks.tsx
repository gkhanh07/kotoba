"use client";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { libraryText } from "@/lib/library";
import { Arrow } from "../Arrow";
import { isDue, isLearned } from "@/lib/srs";
import { today, useDeck } from "@/lib/store";
import s from "./vocab.module.css";

type Deck = { lesson: number; title: string; ids: string[] };

// Counts come from this browser's schedule, so they read "—" until it is loaded.
export function Decks({ decks, lang }: { decks: Deck[]; lang: Lang }) {
  const t = libraryText[lang].vocab;
  const srs = useDeck()?.srs;
  const day = today();
  const stats = decks.map((d) => ({
    ...d,
    learned: srs ? d.ids.filter((id) => isLearned(srs, id)).length : 0,
    due: srs ? d.ids.filter((id) => isDue(srs[id], day)).length : 0,
  }));
  const due = stats.reduce((n, d) => n + d.due, 0);
  const next = stats.find((d) => d.learned < d.ids.length);
  return (
    <>
      <div className={s.action}>
        {srs && (due > 0 ? (
          <Link href="/review?kind=vocab" className="btn">{t.review(due)} <Arrow /></Link>
        ) : next && (
          <Link href={`/flashcards?deck=${next.lesson}`} className="btn">{t.next} <Arrow /></Link>
        ))}
      </div>
      <h2 className="sr-only">{t.decks}</h2>
      <ul className={s.decks}>
        {stats.map((d) => (
          <li key={d.lesson}>
            <Link href={`/flashcards?deck=${d.lesson}`} className={s.deck}>
              <span className={s.num}>{t.lesson(d.lesson)}</span>
              <span className={s.title}>{d.title}</span>
              <span className={s.count}>{t.count(d.ids.length)}</span>
              <span className={s.stats}>{!srs ? "—" : d.learned || d.due ? t.stats(d.learned, d.due) : t.fresh}</span>
              <Arrow />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
