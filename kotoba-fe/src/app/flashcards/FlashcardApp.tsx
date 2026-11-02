"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { FLASHCARDS_KEY, flashcardText, parseStatuses, shuffleCards, type Flashcard, type LearningStatus } from "@/lib/flashcards";
import { logActivity } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import s from "./flashcards.module.css";

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === FLASHCARDS_KEY || event.key === null) notify();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
function snapshot() {
  try { return window.localStorage.getItem(FLASHCARDS_KEY); } catch { return "!unavailable"; }
}
const serverSnapshot = () => null;

export function FlashcardApp({ cards, lang }: { cards: Flashcard[]; lang: Lang }) {
  const t = flashcardText[lang];
  const [order, setOrder] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [notice, setNotice] = useState<"shuffled" | "restarted" | null>(null);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const stored = useMemo(() => {
    try { return { statuses: parseStatuses(raw), ok: true }; }
    catch { return { statuses: {}, ok: false }; }
  }, [raw]);
  const [local, setLocal] = useState<Record<string, LearningStatus>>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const statuses = { ...stored.statuses, ...local };
  const card = order[index];

  function move(next: number) {
    setIndex(next);
    setFlipped(false);
    setNotice(null);
  }
  function restart(shuffle: boolean) {
    setOrder(shuffle ? shuffleCards(cards) : cards);
    move(0);
    setNotice(shuffle ? "shuffled" : "restarted");
  }
  function mark(status: LearningStatus) {
    const next = { ...statuses, [card.id]: status };
    setLocal(next);
    try { window.localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(next)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }

  return (
    <main className={s.app}>
      <header className={s.heading}><h1>{t.title}</h1><p>{t.lede}</p></header>
      {!card ? <p className={s.empty}>{t.empty}</p> : (
        <section className={s.study} aria-label={t.deck}>
          <div className={s.toolbar}>
            <p>{t.deck}</p>
            <div className={s.tools}>
              <button type="button" onClick={() => restart(true)} disabled={cards.length < 2}>{t.shuffle}</button>
              <button type="button" onClick={() => restart(false)}>{t.restart}</button>
            </div>
          </div>
          <div className={s.progress}>
            <span aria-live="polite" aria-atomic="true">{index + 1} / {order.length}</span>
            <progress aria-label={t.progress} value={index + 1} max={order.length} />
            <span>{t[statuses[card.id] ?? "new"]}</span>
          </div>
          <button
            key={card.id + index}
            type="button"
            className={s.card}
            data-flipped={flipped}
            aria-label={flipped ? t.front : t.flip}
            aria-pressed={flipped}
            aria-describedby={flipped ? "flashcard-back" : "flashcard-front"}
            onClick={() => { if (!flipped) logActivity("vocab", card.id); setFlipped(value => !value); }}
          >
            <span className={s.inner}>
              <span id="flashcard-front" className={s.face} aria-hidden={flipped}>
                <span lang="ja" className={s.word}>{card.word}</span>
                <span className={s.hint}>{t.hint}</span>
              </span>
              <span id="flashcard-back" className={s.back} aria-hidden={!flipped}>
                <span lang="ja" className={s.backWord}>{card.word}</span>
                <span className={s.label}>{t.reading}</span>
                <span><span lang="ja">{card.reading}</span><span className={s.romaji}> · {card.pronunciation}</span></span>
                <span className={s.label}>{t.meaning}</span>
                <strong className={s.meaning}>{card.meaning[lang]}</strong>
                <span className={s.label}>{t.example}</span>
                <span lang="ja">{card.example}</span>
                <span className={s.translation}>{card.translation[lang]}</span>
                {card.notes && <span className={s.notes}><strong>{t.notes}: </strong>{card.notes[lang]}</span>}
                <span className={s.hint}>{t.front}</span>
              </span>
            </span>
          </button>
          <fieldset className={s.status}>
            <legend>{t.status}</legend>
            {(["new", "learning", "learned"] as const).map(value => (
              <button key={value} type="button" aria-pressed={(statuses[card.id] ?? "new") === value} onClick={() => mark(value)}>{t[value]}</button>
            ))}
          </fieldset>
          <nav className={s.navigation} aria-label={t.title}>
            <button type="button" className="btn btnGhost" disabled={index === 0} onClick={() => move(index - 1)}>{t.previous}</button>
            <button type="button" className="btn" disabled={index === order.length - 1} onClick={() => move(index + 1)}>{t.next}</button>
          </nav>
          <p className={s.notice} role="status">{notice ? t[notice] : (index === order.length - 1 ? t.end : "")}</p>
          <p className={s.footnote}>{t.saved}</p>
          {(!stored.ok || saveFailed) && <p className={s.warning} role="alert">{t.warning}</p>}
        </section>
      )}
    </main>
  );
}

