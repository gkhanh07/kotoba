"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { KINDS, libraryText, type Kind } from "@/lib/library";
import { hubSummary, type HubCard } from "@/lib/reviewHub";
import { today, useDeck } from "@/lib/store";
import { Arrow } from "../Arrow";
import s from "./reviewHub.module.css";

// Decorative 20px line icons, one per queue.
const ICONS: Record<Kind, string> = {
  kana: "M4 5h12M10 5v10M6 15h8",
  kanji: "M4 4h12v12H4zM7 8h6M7 12h6",
  vocab: "M3 5h9M7.5 5v1.5C7.5 10 5.5 12.5 3 13.5M5 9c1.5 2 3.5 3.5 6 4.5M12 17l3-8 3 8M13 14.5h4",
};

export function ReviewHub({ cards, lang }: { cards: HubCard[]; lang: Lang }) {
  const t = libraryText[lang].review;
  const h = t.hub;
  const deck = useDeck();
  const summary = deck ? hubSummary(cards, deck.srs, today()) : null;
  const dash = h.noRetention;
  const weakKinds = summary ? KINDS.filter((k) => summary.kinds[k].weak > 0) : [];

  return (
    <main className={s.hub}>
      <header className={s.heading}>
        <h1>{t.title}</h1>
        <p>{h.lede}</p>
      </header>

      {!summary ? (
        <p className={s.notice} role="status">{h.loading}</p>
      ) : summary.started === 0 ? (
        <section className={s.panel} aria-labelledby="hub-empty" role="status">
          <h2 id="hub-empty">{h.emptyHeading}</h2>
          <p className={s.muted}>{h.emptyBody}</p>
          <Link href="/lessons" className="btn">{h.emptyLink} <Arrow /></Link>
        </section>
      ) : (
        <section className={s.panel} aria-labelledby="hub-today">
          <div className={s.panelHead}>
            <h2 id="hub-today">{summary.due > 0 ? h.dueHeading : h.idleHeading}</h2>
            <span className={s.pill}>{h.today}</span>
          </div>
          <dl className={s.stats} aria-label={h.stats}>
            <div><dd>{summary.due}</dd><dt>{h.due}</dt></div>
            <div><dd>{summary.overdue}</dd><dt>{h.overdue}</dt></div>
            <div><dd>{summary.retention === null ? dash : `${summary.retention}%`}</dd><dt>{h.retention}</dt></div>
          </dl>
          <Link href="/review?start=1" className={`btn ${s.start}`}>{h.start} <Arrow /></Link>
        </section>
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

      {deck && !deck.ok && <p className={s.notice} role="alert">{t.warning}</p>}
    </main>
  );
}
