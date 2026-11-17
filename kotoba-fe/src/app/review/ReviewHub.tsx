"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { KINDS, libraryText, type Kind } from "@/lib/library";
import { hubSummary, type HubCard } from "@/lib/reviewHub";
import { today, useDeck } from "@/lib/store";
import { addDays, isDue } from "@/lib/srs";
import { STEP_SECONDS } from "@/config/session";
import { Arrow } from "../Arrow";
import s from "./reviewHub.module.css";

// Decorative 20px line icons, one per queue.
const ICONS: Record<Kind, string> = {
  kana: "M4 5h12M10 5v10M6 15h8",
  kanji: "M4 4h12v12H4zM7 8h6M7 12h6",
  vocab: "M3 5h9M7.5 5v1.5C7.5 10 5.5 12.5 3 13.5M5 9c1.5 2 3.5 3.5 6 4.5M12 17l3-8 3 8M13 14.5h4",
};

export function ReviewHub({ cards, grammar = [], lang }: { cards: HubCard[]; grammar?: string[]; lang: Lang }) {
  const t = libraryText[lang].review;
  const h = t.hub;
  const deck = useDeck();
  const day = today();
  const summary = deck ? hubSummary(cards, deck.srs, day) : null;
  // Due grammar points: the review session practises them after the cards (buildSession).
  const dueGrammar = deck ? grammar.filter((id) => isDue(deck.srs[id], day)).length : 0;
  const grammarStarted = deck ? grammar.some((id) => deck.srs[id]) : false;
  const due = (summary?.due ?? 0) + dueGrammar;
  const minutes = Math.ceil(((summary?.due ?? 0) * STEP_SECONDS.review + dueGrammar * STEP_SECONDS.practice) / 60);
  const weekMax = summary ? Math.max(1, ...summary.week) : 1;
  const dayName = (i: number) => (i === 0 ? h.today : h.days[new Date(`${addDays(day, i)}T00:00:00Z`).getUTCDay()]);
  const dash = h.noRetention;
  // Starred items in scope (phase 40a); the queue is offered only once there are some.
  const savedN = deck ? cards.filter((c) => deck.srs[c.id]?.saved).length : 0;
  const weakKinds = summary ? KINDS.filter((k) => summary.kinds[k].weak > 0) : [];

  return (
    <main className={s.hub}>
      <header className={s.heading}>
        <h1>{t.title}</h1>
        <p>{h.lede}</p>
      </header>

      {!summary ? (
        <p className={s.notice} role="status">{h.loading}</p>
      ) : summary.started === 0 && !grammarStarted ? (
        <section className={s.panel} aria-labelledby="hub-empty" role="status">
          <h2 id="hub-empty">{h.emptyHeading}</h2>
          <p className={s.muted}>{h.emptyBody}</p>
          <Link href="/lessons" className="btn">{h.emptyLink} <Arrow /></Link>
        </section>
      ) : (
        <section className={s.panel} aria-labelledby="hub-today">
          <div className={s.panelHead}>
            <h2 id="hub-today">{due > 0 ? h.dueHeading : h.idleHeading}</h2>
            <span className={s.pill}>{h.today}</span>
          </div>
          <dl className={s.stats} aria-label={h.stats}>
            <div><dd>{due}</dd><dt>{h.due}</dt></div>
            <div><dd>{summary.overdue}</dd><dt>{h.overdue}</dt></div>
            <div><dd>{summary.retention === null ? dash : `${summary.retention}%`}</dd><dt>{h.retention}</dt></div>
          </dl>
          {due > 0 && (
            <Link href="/session?mode=review" className={`btn ${s.start}`}>{h.start(minutes)} <Arrow /></Link>
          )}
        </section>
      )}

      {summary && summary.started > 0 && (
        <div className={s.pair}>
          <section className={s.panel} aria-labelledby="hub-week">
            <h2 id="hub-week">{h.week}</h2>
            <ol className={s.week} aria-labelledby="hub-week">
              {summary.week.map((n, i) => (
                <li key={i} aria-label={h.dayDue(dayName(i), n)}>
                  <span className={s.count} aria-hidden="true">{n}</span>
                  <span className={s.track} aria-hidden="true"><span className={s.bar} style={{ height: `${(100 * n) / weekMax}%` }} /></span>
                  <span className={s.day} aria-hidden="true">{dayName(i)}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className={s.panel} aria-labelledby="hub-levels">
            <h2 id="hub-levels">{h.levels}</h2>
            <ol className={s.levels}>
              {summary.levels.map((n, i) => <li key={i}><span>{h.levelNames[i]}</span><strong>{n}</strong></li>)}
            </ol>
            <p className={s.muted}>{h.levelNote}</p>
          </section>
        </div>
      )}

      <section aria-labelledby="hub-kinds">
        <h2 id="hub-kinds" className={s.sectionTitle}>{h.categories}</h2>
        <ul className={s.grid}>
          {KINDS.map((k) => (
            <li key={k}>
              <Link href={`/review?kind=${k}`} className={s.card}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[k]} /></svg>
                <span className={s.cardTitle}>{t.kinds[k]}</span>
                <span className={s.muted}>{h.kindNote[k]}</span>
                {summary && <span className={s.cardDue}>{h.categoryDue(summary.kinds[k].due)}</span>}
              </Link>
            </li>
          ))}
        </ul>
        {savedN > 0 && <p><Link href="/review?saved=1" className={s.textLink}>{h.saved(savedN)} <Arrow /></Link></p>}
      </section>

      {summary && summary.started > 0 && (
        <section aria-labelledby="hub-weak">
          <div className={s.sectionHead}>
            <h2 id="hub-weak" className={s.sectionTitle}>{h.weak}</h2>
            {summary.weakTotal > 0 && <Link href="/review?weak=1" className={s.textLink}>{h.weakAll}</Link>}
          </div>
          {summary.weakTotal === 0 ? <p className={s.muted}>{h.weakEmpty}</p> : (
            <ul className={s.weakList}>
              {weakKinds.map((k) => (
                <li key={k}>
                  <Link href={`/review?weak=1&kind=${k}`} className={s.weakRow}>
                    <span>{h.weakRow(t.kinds[k])}</span>
                    <span>{h.weakCount(summary.kinds[k].weak)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="hub-more">
        <h2 id="hub-more" className={s.sectionTitle}>{h.more}</h2>
        <ul className={s.grid}>
          {h.tiles.map((x) => (
            <li key={x.href}>
              <Link href={x.href} className={s.card}>
                <span className={s.cardTitle}>{x.title}</span>
                <span className={s.muted}>{x.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {deck && !deck.ok && <p className={s.notice} role="alert">{t.warning}</p>}
    </main>
  );
}
