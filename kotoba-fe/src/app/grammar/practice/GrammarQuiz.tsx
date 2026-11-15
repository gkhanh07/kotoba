"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GrammarQuestion } from "@/lib/grammarQuiz";
import { BLANK, grammarChoices as options } from "@/lib/grammarQuiz";
import type { Lang } from "@/lib/i18n";
import { libraryText } from "@/lib/library";
import { pickNext, type Srs } from "@/lib/srs";
import { review, today, useDeck } from "@/lib/store";
import s from "../grammar.module.css";

// AC-10/11: one question per point, picked like the kana quiz (due first, then new); answers go through review().
export function GrammarQuiz({ questions, lang }: { questions: GrammarQuestion[]; lang: Lang }) {
  const deck = useDeck();
  if (!deck) return <p className={s.quizLoading}>…</p>;
  return (
    <>
      {!deck.ok && <p className={s.warning} role="alert">{libraryText[lang].review.warning}</p>}
      <Quiz questions={questions} lang={lang} progress={deck.srs} />
    </>
  );
}

function Quiz({ questions, lang, progress }: { questions: GrammarQuestion[]; lang: Lang; progress: Srs }) {
  const t = libraryText[lang].grammar;
  const [q, setQ] = useState(() => pickNext(questions, progress, null, today()));
  const [choices, setChoices] = useState(() => (q ? options(q, questions) : []));
  const [picked, setPicked] = useState<string | null>(null);
  const [session, setSession] = useState({ right: 0, total: 0 });
  const nextRef = useRef<HTMLButtonElement>(null);

  const choose = useCallback((answer: string | undefined) => {
    if (!q || answer === undefined || picked !== null) return;
    const correct = answer === q.answer;
    review(q.id, correct);
    setPicked(answer);
    setSession((v) => ({ right: v.right + Number(correct), total: v.total + 1 }));
    requestAnimationFrame(() => nextRef.current?.focus({ preventScroll: true }));
  }, [q, picked]);

  const next = useCallback(() => {
    const n = pickNext(questions, progress, q?.id ?? null, today());
    setQ(n);
    setChoices(n ? options(n, questions) : []);
    setPicked(null);
  }, [questions, progress, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-4]$/.test(e.key)) choose(choices[Number(e.key) - 1]?.romaji);
      // A focused link or button handles its own Enter (the next button advances natively).
      else if (e.key === "Enter" && picked !== null && !(e.target as Element | null)?.closest?.("a,button,input,textarea,select")) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, picked, choose, next]);

  if (!q) return null;
  const correct = picked === q.answer;
  return (
    <section className={s.quiz} aria-labelledby="g-ask">
      <p lang="ja" className={s.sentence} key={q.id}>
        {q.before}<span className={s.blank} data-state={picked === null ? "idle" : correct ? "right" : "wrong"}>{picked === null ? BLANK : q.answer}</span>{q.after}
      </p>
      <p className={s.translation}>{q.translation[lang]}</p>
      <h2 id="g-ask" className={s.ask}>{t.ask}</h2>
      <div className={s.choices} role="group" aria-labelledby="g-ask">
        {choices.map((c, i) => {
          const mark = picked === null ? undefined : c.romaji === q.answer ? "answer" : c.romaji === picked ? "miss" : "rest";
          return (
            <button key={c.id} type="button" className={s.choice} data-mark={mark} aria-disabled={picked !== null} onClick={() => choose(c.romaji)}>
              <kbd>{i + 1}</kbd><span lang="ja">{c.romaji}</span>
            </button>
          );
        })}
      </div>
      <p className={s.feedback} aria-live="polite" data-state={picked === null ? "idle" : correct ? "right" : "wrong"}>
        {picked === null ? " " : correct ? t.right(q.answer) : t.wrong(q.answer)}
        {picked !== null && <> <Link href={`/grammar/${q.slug}`}><span lang="ja">{q.pattern}</span> · {t.seePoint}</Link></>}
      </p>
      <div className={s.quizFoot}>
        <button ref={nextRef} type="button" className="btn" onClick={next} disabled={picked === null}>{t.nextQuestion} <kbd>Enter</kbd></button>
        <p>{t.session(session.right, session.total)}</p>
      </div>
    </section>
  );
}
