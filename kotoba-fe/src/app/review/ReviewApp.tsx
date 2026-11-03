"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logActivity } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import { KINDS, libraryText, type Kind, type ReviewItem } from "@/lib/library";
import { daysUntil, isDue, isKnown, isLearned, nextDue, weakest } from "@/lib/srs";
import { review, today, useDeck } from "@/lib/store";
import { Arrow } from "../Arrow";
import f from "../flashcards/flashcards.module.css";
import s from "./review.module.css";

export function ReviewApp({ items, lang, kind, lesson, weak }: {
  items: ReviewItem[]; lang: Lang; kind?: Kind; weak?: boolean; lesson?: { n: number; title: string };
}) {
  const t = libraryText[lang].review;
  const deck = useDeck();
  // Ids to answer, fixed when the deck first loads; a miss appends the id again.
  const [order, setOrder] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [notice, setNotice] = useState("");
  const cardRef = useRef<HTMLButtonElement>(null);

  const scoped = items.filter((i) => (!kind || i.kind === kind) && (!lesson || i.lesson === lesson.n));
  if (deck && order === null) {
    const day = today();
    // Weak queue: worst first, whatever the due date.
    const ranked = weak ? weakest(deck.srs, Infinity).flatMap((w) => scoped.filter((i) => i.id === w.id)) : [];
    const due = scoped.filter((i) => isDue(deck.srs[i.id], day));
    // A lesson queue also brings in what that lesson has not started yet,
    // and when nothing there is due or new it runs the whole lesson again.
    const fresh = lesson ? scoped.filter((i) => !deck.srs[i.id]) : [];
    const queue = due.length + fresh.length || !lesson ? [...due, ...fresh] : scoped;
    setOrder((weak ? ranked : queue).map((i) => i.id));
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  const item = order?.[index] !== undefined ? byId.get(order[index]) : undefined;

  function flip() {
    if (!item) return;
    if (!flipped) {
      logActivity(item.kind, item.id);
      // The answer must clear the sticky grade bar on short screens (scroll-margin on the card's overlay button).
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => cardRef.current?.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" }));
    }
    setFlipped((v) => !v);
  }
  function grade(knew: boolean) {
    if (!item || !order || !flipped) return;
    const after = review(item.id, knew);
    const due = after[item.id]?.due;
    setNotice(!knew ? t.gradedMiss(item.front)
      : isKnown(after, item.id) ? t.gradedKnown(item.front)
      : t.gradedHit(item.front, due ? daysUntil(due, today()) : 1));
    if (!knew) setOrder([...order, item.id]);
    setIndex(index + 1);
    setFlipped(false);
    // The card button remounts per card, so hand focus to the new one.
    requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }));
  }

  // Space flips, 1/2 grade. Re-bound every render so the handler sees current state.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const el = e.target as Element;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === " " && !el.closest("a, button, summary")) { e.preventDefault(); flip(); }
      else if (e.key === "1" || e.key === "2") grade(e.key === "2");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const left = order ? order.slice(index) : [];
  const parts = KINDS.map((k) => [k, left.filter((id) => byId.get(id)?.kind === k).length] as const)
    .filter(([, n]) => n > 0).map(([k, n]) => `${t.kinds[k]} ${n}`).join(" · ");
  const scope = [lesson && t.scopeLesson(lesson.n, lesson.title), kind && (lesson ? t.kinds[kind] : t.scope[kind])]
    .filter(Boolean).join(" · ") || t.scope.all;
  // The first lesson that still has something never answered right.
  const nextLesson = deck && items.find((i) => !isLearned(deck.srs, i.id))?.lesson;
  const soon = deck && nextDue(deck.srs, today(), scoped.map((i) => i.id));

  const panel = (body: string, extra?: string) => (
    <div className={s.panel} role="status">
      <p className={s.panelTitle}>{body}</p>
      {extra && <p>{extra}</p>}
      <div className={s.actions}>
        {nextLesson ? <Link href={`/lessons/${nextLesson}`} className="btn">{t.study(nextLesson)} <Arrow /></Link>
          : <Link href="/lessons" className="btn">{t.path} <Arrow /></Link>}
        <Link href="/" className={s.textLink}>{t.dashboard}</Link>
      </div>
    </div>
  );

  return (
    <main className={f.app}>
      {/* While a card is up the page is the card: a small title, no lede. */}
      <header className={item ? s.compact : f.heading}><h1>{t.title}</h1>{!item && <p>{t.lede}</p>}</header>
      <section className={f.study} aria-label={scope}>
        <div className={f.toolbar}>
          <p>{scope}</p>
          {(kind || lesson) && <div className={f.tools}><Link href="/review" className={s.textLink}>{t.all}</Link></div>}
        </div>
        {!deck || !order ? <p className={f.notice} role="status">…</p>
          : !order.length ? (weak ? panel(t.weakEmpty) : soon ? panel(t.waiting, t.next(daysUntil(soon.day, today()), soon.n)) : panel(t.empty))
          : !item ? <>{notice && <p className={f.notice}>{notice}</p>}{panel(t.done, soon ? t.next(daysUntil(soon.day, today()), soon.n) : undefined)}</>
          : (
            <>
              <div className={f.progress}>
                <span aria-live="polite" aria-atomic="true">{t.left(left.length, parts)}</span>
                <progress aria-label={t.progress} value={index} max={order.length} />
              </div>
              <div
                key={item.id + index}
                className={`${f.card} ${s.card}`}
                data-flipped={flipped}
              >
                <span className={f.inner}>
                  <span id="review-front" className={f.face} aria-hidden={flipped}>
                    <span lang="ja" className={f.word}>{item.front}</span>
                    <span className={f.hint}>{item.tag} · {t.recall[item.kind]} · {t.hint}<span className={s.keys}> · {t.keys}</span></span>
                  </span>
                  <span id="review-back" className={f.back} aria-hidden={!flipped}>
                    <span lang="ja" className={f.backWord}>{item.front}</span>
                    {item.back.map((r) => (
                      <span key={r.label} className={s.row}>
                        <span className={f.label}>{r.label}</span>
                        {r.strong ? <strong className={s.answer} lang={r.ja ? "ja" : undefined}>{r.text}</strong>
                          : <span lang={r.ja ? "ja" : undefined}>{r.text}</span>}
                        {r.sub && <span className={f.romaji}>{r.sub}</span>}
                      </span>
                    ))}
                    <span className={f.hint}>{t.front}</span>
                  </span>
                </span>
                {/* A text-less overlay is the control, so its name never has to repeat the faces (axe label-content-name-mismatch); the faces are its description. */}
                <button
                  ref={cardRef}
                  type="button"
                  aria-label={flipped ? t.front : t.flip}
                  aria-pressed={flipped}
                  aria-describedby={flipped ? "review-back" : "review-front"}
                  onClick={flip}
                  className={f.hit}
                />
              </div>
              <fieldset className={f.status}>
                <legend>{flipped ? t.grade : t.gradeHint}</legend>
                <button type="button" className="btn btnGhost" disabled={!flipped} onClick={() => grade(false)}>{t.missed}<span className={s.keys} aria-hidden="true"> 1</span></button>
                <button type="button" className="btn" disabled={!flipped} onClick={() => grade(true)}>{t.knew}<span className={s.keys} aria-hidden="true"> 2</span></button>
              </fieldset>
              <p className={f.notice} role="status">{notice}</p>
            </>
          )}
        <p className={f.footnote}>{t.saved}</p>
        {deck && !deck.ok && <p className={f.warning} role="alert">{t.warning}</p>}
      </section>
    </main>
  );
}
