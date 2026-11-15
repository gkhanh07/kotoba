"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flashcardText, shuffleCards, type Vocab } from "@/lib/flashcards";
import { logActivity } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import { libraryText } from "@/lib/library";
import { daysUntil, isDue, isKnown } from "@/lib/srs";
import { review, today, useDeck } from "@/lib/store";
import { typedMatch } from "@/lib/typed";
import { Speak } from "../Speak";
import { useCardPrompt } from "../useCardPrompt";
import { KeyHelp } from "./KeyHelp";
import s from "./flashcards.module.css";

// `tabs` is the server-rendered level switcher; `empty` replaces the generic empty line when a level has no words.
export function FlashcardApp({ cards, lang, deck: name, tabs, empty, romaji = true, display }: { cards: Vocab[]; lang: Lang; deck: string; tabs?: ReactNode; empty?: string; romaji?: boolean; display?: ReactNode }) {
  const t = flashcardText[lang];
  const [order, setOrder] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [notice, setNotice] = useState("");
  // Phase 40d: type the reading instead of grading yourself. checked = the typed answer was graded.
  const [typing, setTyping] = useState(false);
  const [checked, setChecked] = useState(false);
  const deck = useDeck();
  const cardRef = useRef<HTMLButtonElement>(null);
  const card = order[index];
  const r = libraryText[lang].review;
  const asked = useCardPrompt(card ? `${card.id}#${index}` : "", card ? { kind: "vocab", word: card.word, reading: card.reading, meaning: card[lang] } : undefined);
  const state = card && deck?.srs[card.id];

  function move(next: number, message = "") {
    setIndex(next);
    setFlipped(false);
    setChecked(false);
    setNotice(message);
  }
  function restart(shuffle: boolean) {
    setOrder(shuffle ? shuffleCards(cards) : cards);
    move(0, shuffle ? t.shuffled : t.restarted);
  }
  function graded(knew: boolean): string {
    const before = deck?.srs;
    const after = review(card.id, knew);
    return !knew ? t.gradedMiss(card.word)
      : after === before ? t.gradedEarly(card.word)
      : isKnown(after, card.id) ? t.gradedKnown(card.word)
      : t.gradedHit(card.word, daysUntil(after[card.id].due, today()));
  }
  function grade(knew: boolean) {
    const message = graded(knew);
    if (index < order.length - 1) {
      move(index + 1, message);
      // The card button remounts per card, so hand focus to the new one.
      requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }));
    } else setNotice(`${message} ${t.end}`);
  }

  function flip() {
    if (!card) return;
    if (!flipped) {
      logActivity("vocab", card.id);
      // Once flipped the grade bar sticks to the bottom edge; bring the answer clear of it (scroll-margin on the overlay button).
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => cardRef.current?.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" }));
    }
    setFlipped((value) => !value);
  }

  // Typed mode: the first submit grades and shows the back, the next one moves on.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (checked) {
      if (index < order.length - 1) move(index + 1);
      return;
    }
    const typed = String(new FormData(e.currentTarget).get("answer") ?? "");
    if (!typed.trim()) return; // empty is ignored, not graded
    const knew = typedMatch(typed, card.reading, card.romaji);
    const message = graded(knew);
    if (!flipped) logActivity("vocab", card.id);
    setChecked(true);
    setFlipped(true);
    setNotice(knew ? message : t.typedWrong(card.reading, card.romaji));
  }

  // Space flips, 1/2 grade. Re-bound every render so the handler sees current state.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || !card) return;
      const el = e.target as Element;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === " " && !el.closest("a, button, summary")) { e.preventDefault(); flip(); }
      else if ((e.key === "1" || e.key === "2") && flipped && !typing) grade(e.key === "2");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <main className={s.app}>
      <header className={s.heading}><h1>{t.title}</h1><p>{t.lede}</p></header>
      {tabs}
      {!card ? <p className={s.empty}>{empty ?? t.empty}</p> : (
        <section className={`${s.study} ${s.split}`} aria-label={name}>
          <div className={s.side}>
            <div className={s.toolbar}>
              <p>{name}</p>
              <div className={s.tools}>
                <Speak text={card.word} label={t.speak} className={s.speak} />
                <button type="button" onClick={() => restart(true)} disabled={cards.length < 2}>{t.shuffle}</button>
                <button type="button" onClick={() => restart(false)}>{t.restart}</button>
                <button type="button" aria-pressed={typing} onClick={() => { setTyping((v) => !v); move(index); }}>{t.typeMode}</button>
                {display}
              </div>
            </div>
            <div className={s.progress}>
              <span aria-live="polite" aria-atomic="true">{index + 1} / {order.length}</span>
              {!deck ? <span>…</span> : (
                <span className="tag" data-state={!state ? "fresh" : isDue(state, today()) ? "warn" : isKnown(deck.srs, card.id) ? "known" : "learned"}>
                  {!state ? t.stateNone : isDue(state, today()) ? t.stateDue
                    : isKnown(deck.srs, card.id) ? t.stateKnown : t.stateLater(daysUntil(state.due, today()))}
                </span>
              )}
              <progress className="meter" aria-label={t.progress} value={index + 1} max={order.length} />
            </div>
            <KeyHelp title={r.shortcuts} keys={r.shortcutKeys} />
          </div>
          <div
            key={card.id + index}
            className={s.card}
            data-flipped={flipped}
          >
            <span className={s.inner}>
              <span id="flashcard-front" className={s.face} aria-hidden={flipped}>
                {typing ? (
                  <>
                    <span lang={lang} className={`${s.word} ${s.wordText}`}>{card[lang]}</span>
                    <span className={s.hint}>{t.typeAsk}</span>
                  </>
                ) : (
                  <>
                    <span lang={asked?.frontIsJa === false ? lang : "ja"} className={asked?.frontIsJa === false ? `${s.word} ${s.wordText}` : s.word}>{asked?.front ?? card.word}</span>
                    <span className={s.hint}>{r.recall[asked?.dir ?? "word-meaning"]} · {r.hint}<span className={s.keys}> · {r.keys}</span></span>
                  </>
                )}
              </span>
              <span id="flashcard-back" className={s.back} aria-hidden={!flipped}>
                <span lang="ja" className={s.backWord}>{card.word}{card.kanji && `（${card.kanji}）`}</span>
                <span className={s.label}>{t.reading}</span>
                <span><span lang="ja">{card.reading}</span>{romaji && <span className={s.romaji}> · {card.romaji}</span>}</span>
                <span className={s.label}>{t.meaning}</span>
                <strong className={s.meaning}>{card[lang]}</strong>
                <span className={s.label}>{t.example}</span>
                <span lang="ja">{card.example.ja}</span>
                <span className={s.translation}>{card.example[lang]}</span>
                {card.notes && <span className={s.notes}><strong>{t.notes}: </strong>{card.notes[lang]}</span>}
                <span className={s.hint}>{t.front}</span>
              </span>
            </span>
            {/* A text-less overlay is the control, so its name never has to repeat the faces (axe label-content-name-mismatch); the faces are its description. */}
            <button
              ref={cardRef}
              type="button"
              aria-label={flipped ? t.front : t.flip}
              aria-pressed={flipped}
              aria-describedby={flipped ? "flashcard-back" : "flashcard-front"}
              onClick={flip}
              className={s.hit}
            />
          </div>
          {typing ? (
            <form key={`typed-${card.id}-${index}`} className={s.typed} onSubmit={submit}>
              <input name="answer" className="field" aria-label={t.typeAsk} lang="ja" autoComplete="off" autoCapitalize="off" spellCheck={false} autoFocus onKeyDown={(e) => { if (e.key === "Enter" && e.repeat) e.preventDefault(); }} />
              <button type="submit" className="btn">{checked ? t.nextCard : t.check}</button>
            </form>
          ) : <fieldset className={s.status}>
            <legend>{flipped ? t.grade : t.gradeHint}</legend>
            <button type="button" className="btn btnGhost" disabled={!flipped} onClick={() => grade(false)}>{t.missed}</button>
            <button type="button" className="btn" disabled={!flipped} onClick={() => grade(true)}>{t.knew}</button>
          </fieldset>}
          <nav className={s.navigation} aria-label={t.title}>
            <button type="button" className="btn btnGhost" disabled={index === 0} onClick={() => move(index - 1)}>{t.previous}</button>
            <button type="button" className="btn btnGhost" disabled={index === order.length - 1} onClick={() => move(index + 1)}>{t.next}</button>
          </nav>
          <p className={s.notice} role="status">{notice || (index === order.length - 1 ? t.end : "")}</p>
          <p className={s.footnote}>{t.saved}</p>
          {deck && !deck.ok && <p className={s.warning} role="alert">{t.warning}</p>}
        </section>
      )}
    </main>
  );
}
