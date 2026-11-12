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
// Stats and the action cover every deck; only decks[from, to) are listed.
export function Decks({ decks, from, to, lang }: { decks: Deck[]; from: number; to: number; lang: Lang }) {
  const t = libraryText[lang].vocab;
  const states = libraryText[lang].lessons.state;
  const srs = useDeck()?.srs;
  const day = today();
  const stats = decks.map((d) => ({
    ...d,
    learned: srs ? d.ids.filter((id) => isLearned(srs, id)).length : 0,
    due: srs ? d.ids.filter((id) => isDue(srs[id], day)).length : 0,
  }));
  const due = stats.reduce((n, d) => n + d.due, 0);
  const learned = stats.reduce((n, d) => n + d.learned, 0);
  const total = stats.reduce((n, d) => n + d.ids.length, 0);
  const next = stats.find((d) => d.learned < d.ids.length);
  return (
    <div className={s.layout}>
      <section className={`panel ${s.summary}`} aria-labelledby="vocab-progress">
        <h2 id="vocab-progress">{t.progress}</h2>
        {srs ? (
          <>
            <progress className="meter" aria-label={t.progress} value={learned} max={total} />
            <p className={s.summaryCount}>{t.learnedOf(learned, total)}</p>
            <p className={s.summaryDue}>{t.dueNow(due)}</p>
          </>
        ) : <p className={s.summaryCount}>—</p>}
        {/* Holds the button's height before the schedule loads, so the panel does not jump. */}
        <div className={s.action}>
          {srs && (due > 0 ? (
            <Link href="/review?kind=vocab" className="btn">{t.review(due)} <Arrow /></Link>
          ) : next && (
            <Link href={`/flashcards?deck=${next.lesson}`} className="btn">{t.next} <Arrow /></Link>
          ))}
        </div>
      </section>
      <div>
        <h2 className="sr-only">{t.decks}</h2>
        <ul className={s.decks}>
          {stats.slice(from, to).map((d) => {
            const state = d.learned === d.ids.length ? "learned" : d.learned ? "started" : "fresh";
            const label = state === "learned" ? states.done : state === "started" ? states.started : states.fresh;
            return (
              <li key={d.lesson}>
                <Link href={`/flashcards?deck=${d.lesson}`} className={s.deck}>
                  <span className={s.num}>{t.lesson(d.lesson)}</span>
                  <span className={s.title}>{d.title}</span>
                  <span className={s.count}>{t.count(d.ids.length)}</span>
                  <span className={s.stats}>
                    {!srs ? "—" : (
                      <>
                        <span className="tag" data-state={state}>{label}</span>
                        {state !== "fresh" && <span>{t.stats(d.learned, d.due)}</span>}
                      </>
                    )}
                  </span>
                  <Arrow />
                  {/* The bar repeats the learned count in the text beside it, so it is hidden from assistive tech. */}
                  {srs && <span className={`meter ${s.deckMeter}`} aria-hidden="true"><span style={{ transform: `scaleX(${d.learned / d.ids.length})` }} /></span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
