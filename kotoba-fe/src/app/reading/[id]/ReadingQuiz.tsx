"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { Question } from "@/lib/test";
import { testText } from "@/lib/testText";
import { QuestionText } from "../../test/QuestionText";
import s from "../../test/test.module.css";

// AC-12: answer every question, then check: each shows right or wrong, the right answer and why. Nothing is stored.
export function ReadingQuiz({ questions, lang }: { questions: Question[]; lang: Lang }) {
  const t = testText[lang];
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const right = questions.filter((q, i) => answers[i] === q.answer).length;
  return (
    <form
      className={s.card}
      onSubmit={(e) => {
        e.preventDefault();
        setChecked(true);
      }}
    >
      {questions.map((q, i) => (
        <fieldset key={i} className={s.choices} aria-describedby={`rq-${i}`}>
          <legend>{t.question(i + 1, questions.length)}</legend>
          <p id={`rq-${i}`} className={s.qtext}><QuestionText text={q.q} lang={lang} /></p>
          {q.choices.map((c, k) => (
            <label key={k} className={s.choice}>
              <input type="radio" name={`rq-${i}`} checked={answers[i] === k} disabled={checked} onChange={() => setAnswers((a) => a.map((v, j) => (j === i ? k : v)))} />
              <span lang="ja">{c}</span>
            </label>
          ))}
          {checked && (
            <div className={s.note}>
              <p><strong>{answers[i] === q.answer ? t.reading.right : t.reading.wrong}</strong> · {t.rightAnswer}: <span lang="ja">{q.choices[q.answer]}</span></p>
              <p>{t.explain}: {q.explain}</p>
            </div>
          )}
        </fieldset>
      ))}
      <p role="status" className={s.note}>{checked ? t.reading.result(right, questions.length) : ""}</p>
      <div className={s.moves}>
        {/* Separate keys: one reused <button> turning type=submit inside its own click would submit the form again. */}
        {checked ? (
          <button key="again" type="button" className="btn" onClick={() => { setAnswers(questions.map(() => null)); setChecked(false); }}>{t.reading.again}</button>
        ) : (
          <button key="check" type="submit" className="btn">{t.reading.check}</button>
        )}
      </div>
    </form>
  );
}
