"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { levelLabel, type Level } from "@/lib/library";
import { suggest, type PlacementQ } from "@/lib/placement";
import { testText } from "@/lib/testText";
import { QuestionText } from "../test/QuestionText";
import s from "../test/test.module.css";

export type Start = { level: Level; lesson: number; title: string };

// Nothing is stored: the result only points at where to start.
export function PlacementQuiz({ questions, starts, lang }: { questions: PlacementQ[]; starts: Start[]; lang: Lang }) {
  const t = testText[lang];
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const result = checked ? suggest(questions, answers) : null;
  const start = result && starts.find((x) => x.level === result.level);
  return (
    <form className={s.card} onSubmit={(e) => { e.preventDefault(); setChecked(true); }}>
      {questions.map((q, i) => (
        <fieldset key={i} className={s.choices} aria-describedby={`pq-${i}`}>
          <legend>{t.question(i + 1, questions.length)}</legend>
          <p id={`pq-${i}`} className={s.qtext}><QuestionText text={q.q} lang={lang} /></p>
          {q.choices.map((c, k) => (
            <label key={k} className={s.choice}>
              <input type="radio" name={`pq-${i}`} checked={answers[i] === k} disabled={checked} onChange={() => setAnswers((a) => a.map((v, j) => (j === i ? k : v)))} />
              <span lang="ja">{c}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <div role="status" className={s.note}>
        {result && (
          <>
            <p><strong>{t.placement.suggest(levelLabel(result.level))}</strong></p>
            <ul>
              {result.levels.map((l) => <li key={l.level}>{t.placement.level(levelLabel(l.level), l.right, l.total)}</li>)}
            </ul>
          </>
        )}
      </div>
      <div className={s.moves}>
        {result ? (
          <>
            {start && <Link href={`/lessons/${start.lesson}`} className="btn">{t.placement.start(start.lesson, start.title)}</Link>}
            <Link href="/" className={s.textLink}>{t.placement.home}</Link>
          </>
        ) : (
          <button type="submit" className="btn">{t.placement.check}</button>
        )}
      </div>
    </form>
  );
}
