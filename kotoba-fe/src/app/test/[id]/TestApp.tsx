"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHOICE_KEYS, TEST_SESSION_VERSION, TEST_TICK_MS, TEST_WARN_MINUTES } from "@/config/test";
import type { Lang } from "@/lib/i18n";
import { useMounted } from "@/lib/mounted";
import { flatten, formatClock, headline, remaining, score, subset, weakest, wrongIds, type Paper } from "@/lib/test";
import { clearSession, readResults, readSession, saveResult, writeSession } from "@/lib/testStore";
import { testText } from "@/lib/testText";
import { Arrow } from "../../Arrow";
import { QuestionText } from "../QuestionText";
import s from "../test.module.css";

type Stage = "intro" | "taking" | "result" | "review";
type Answers = (number | null)[];
// `active` is the whole paper, or the wrong-answers subset during a retry (no clock, nothing saved).
type State = { stage: Stage; active: Paper; retry: boolean; startedAt: number | null; answers: Answers; flagged: number[]; current: number; timeUp: boolean };

const MS_PER_MINUTE = 60_000;
const blanks = (n: number): Answers => Array<number | null>(n).fill(null);

function initial(paper: Paper): State {
  const n = flatten(paper).length;
  const base: State = { stage: "intro", active: paper, retry: false, startedAt: null, answers: blanks(n), flagged: [], current: 0, timeUp: false };
  const saved = readSession(paper.id);
  // A saved attempt of another size belongs to an older version of the paper: ignore it.
  if (!saved || saved.answers.length !== n || n === 0) return base;
  const answers = saved.answers.map((a) => (a !== null && Number.isInteger(a) && a >= 0 && a < CHOICE_KEYS.length ? a : null));
  const flagged = saved.flagged.filter((i) => Number.isInteger(i) && i >= 0 && i < n);
  const current = Math.min(n - 1, Math.max(0, Math.trunc(saved.current)));
    // A start in the future (clock change, tampering) would show more than the full time.
  const startedAt = Math.min(saved.startedAt, Date.now());
  return { ...base, stage: "taking", startedAt, answers, flagged, current };
}

export function TestApp({ paper, lang }: { paper: Paper; lang: Lang }) {
  const mounted = useMounted();
  if (!mounted)
    return (
      <main className={s.app}>
        <h1 className={s.title}>{paper.title[lang]}</h1>
        <p role="status" className={s.note}>{testText[lang].loading}</p>
      </main>
    );
  return <Run paper={paper} lang={lang} />;
}

function Run({ paper, lang }: { paper: Paper; lang: Lang }) {
  const t = testText[lang];
  const [run, setRun] = useState(() => initial(paper));
  const [now, setNow] = useState(() => Date.now());
  const [storageFailed, setStorageFailed] = useState(false);
  // The saved result of this paper, if its answers still fit the paper (an older version of another size does not).
  const [last] = useState(() => {
    const saved = readResults()[paper.id];
    return saved && saved.answers.length === flatten(paper).length ? saved : null;
  });
  const finished = useRef(false); // the timer and a confirm can both ask to submit; only the first counts
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const shownStage = useRef(run.stage);

  const { stage, active, retry, startedAt, answers, flagged, current } = run;
  const flat = useMemo(() => flatten(active), [active]);
  const total = flat.length;
  const timed = stage === "taking" && !retry && startedAt !== null;
  const left = timed ? remaining(startedAt, active.minutes, now) : 0;

  function commit(next: State) {
    setRun(next);
    if (next.retry || next.stage !== "taking" || next.startedAt === null) return;
    const saved = writeSession(paper.id, { v: TEST_SESSION_VERSION, startedAt: next.startedAt, answers: next.answers, flagged: next.flagged, current: next.current });
    if (!saved) setStorageFailed(true);
  }
  function start() {
    finished.current = false;
    const at = Date.now();
    setNow(at);
    commit({ ...run, stage: "taking", startedAt: at });
  }
  function answer(choice: number) {
    if (stage !== "taking") return;
    commit({ ...run, answers: answers.map((a, i) => (i === current ? choice : a)) });
  }
  function go(to: number) {
    if (to >= 0 && to < total) commit({ ...run, current: to });
  }
  function toggleFlag() {
    commit({ ...run, flagged: flagged.includes(current) ? flagged.filter((i) => i !== current) : [...flagged, current].sort((a, b) => a - b) });
  }
  // Saves the result and drops the attempt, once, however many paths ask (confirm, timer, effect re-run).
  function persist(): boolean {
    if (finished.current || retry) return true;
    finished.current = true;
    const saved = saveResult(paper.id, { ...score(active, answers), answers, at: Date.now() });
    clearSession(paper.id);
    return saved;
  }
  function submit() {
    if (!persist()) setStorageFailed(true);
    setRun({ ...run, stage: "result" });
  }
  // Reopens the saved result; it is already stored, so nothing is saved again.
  function openLast() {
    if (!last) return;
    finished.current = true;
    setRun({ ...run, stage: "result", answers: last.answers });
  }
  function retryWrong() {
    const ids = wrongIds(active, answers);
    if (ids.length === 0) return;
    finished.current = false;
    setRun({ stage: "taking", active: subset(active, ids), retry: true, startedAt: null, answers: blanks(ids.length), flagged: [], current: 0, timeUp: false });
  }

  // Ticks only refresh `now`; the time left is always computed from startedAt.
  useEffect(() => {
    if (!timed) return;
    const id = setInterval(() => setNow(Date.now()), TEST_TICK_MS);
    return () => clearInterval(id);
  }, [timed]);

  // Time is up (also when the deadline passed while the page was closed): the view moves to the result right away
  // and the effect below saves it. A storage failure here is not announced; the attempt already warned on its first failed write.
  if (timed && left === 0) setRun({ ...run, stage: "result", timeUp: true });
  useEffect(() => {
    if (stage === "result") persist();
  });

  // 1-4 choose, arrows move, F flags. Re-bound every render so the handler sees current state.
  useEffect(() => {
    if (stage !== "taking") return;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if ((e.target as Element).closest("input:not([type=radio]), textarea, select, [contenteditable]")) return;
      if (dialogRef.current?.open) return;
      const choice = CHOICE_KEYS.indexOf(e.key as (typeof CHOICE_KEYS)[number]);
      if (choice >= 0 && choice < flat[current].choices.length) answer(choice);
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault(); // a focused radio would otherwise change its own answer
        go(current + (e.key === "ArrowRight" ? 1 : -1));
      } else if (e.key.toLowerCase() === "f") toggleFlag();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // The view replaces itself on a stage change, so focus moves to the new heading explicitly.
  useEffect(() => {
    if (shownStage.current === stage) return;
    shownStage.current = stage;
    (resultRef.current ?? titleRef.current)?.focus();
  }, [stage]);

  const partName = (part: string) => t.parts[part] ?? part;
  const answered = answers.filter((a) => a !== null).length;
  const header = (
    <header className={s.top}>
      <h1 ref={titleRef} tabIndex={-1} className={s.title}>{paper.title[lang]}</h1>
      {timed && (
        <p role="timer" aria-label={t.timer} className={s.timer} data-low={left <= TEST_WARN_MINUTES * MS_PER_MINUTE ? "" : undefined}>
          {formatClock(left)}
        </p>
      )}
    </header>
  );
  const warning = storageFailed && <p role="alert" className={s.warning}>{t.storageWarn}</p>;

  if (stage === "intro") {
    const parts = score(paper, []).parts;
    return (
      <main className={`${s.app} ${s.wide}`}>
        <Link href="/test" className={s.back}><Arrow back />{t.back}</Link>
        {header}
        {/* Wide screens: the parts on the left, the one decision (start) in a raised panel beside them. */}
        <div className={s.intro}>
          <section className={`panel ${s.partsPanel}`} aria-labelledby="test-parts">
            <p className={s.facts}><span>{t.count(total)}</span> · <span>{t.minutes(paper.minutes)}</span></p>
            <p className={s.note}>{t.noListening}</p>
            <h2 id="test-parts">{t.partsHeading}</h2>
            <ul className={s.partList}>
              {parts.map((p) => <li key={p.part}><span>{partName(p.part)}</span> <span className={s.partCount}>{t.count(p.total)}</span></li>)}
            </ul>
          </section>
          <div className={`panel ${s.startPanel}`} data-raised="">
            <p>{t.startNote}</p>
            {warning}
            <button type="button" className="btn" onClick={start} disabled={total === 0}>{t.start} <Arrow /></button>
            {last && (
              <p className={s.lastResult}>
                <span>{t.last}</span> <strong>{headline(last.right, last.total)}</strong>{" "}
                <button type="button" className="btn btnGhost" onClick={openLast}>{t.openLast}</button>
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (stage === "result") {
    const result = score(active, answers);
    const worst = weakest(result);
    const wrong = wrongIds(active, answers).length;
    return (
      <main className={s.app}>
        {header}
        <section className={s.section} aria-labelledby="test-score">
          <p className={s.scoreLabel}>{retry ? t.retryKicker : t.resultKicker}</p>
          <h2 id="test-score" ref={resultRef} tabIndex={-1} className={s.score}>{headline(result.right, result.total)}</h2>
          {run.timeUp && <p role="status" className={s.note}>{t.timeUp}</p>}
          {warning}
          <table className={s.table}>
            <caption className="sr-only">{t.perPart}</caption>
            <thead><tr><th scope="col">{t.part}</th><th scope="col">{t.score}</th></tr></thead>
            <tbody>
              {result.parts.map((p) => <tr key={p.part}><th scope="row">{partName(p.part)}</th><td>{p.right}/{p.total}</td></tr>)}
            </tbody>
          </table>
          {worst && worst.right < worst.total && (
            <p className={s.weakest}><span>{t.weakest}</span> <strong>{partName(worst.part)}</strong> <span>{worst.right}/{worst.total}</span></p>
          )}
          <div className={s.actions}>
            <button type="button" className="btn btnGhost" onClick={() => setRun({ ...run, stage: "review" })}>{t.reviewWrong}</button>
            <button type="button" className="btn" disabled={wrong === 0} onClick={retryWrong}>{t.retryWrong}</button>
            <Link href="/test" className={s.textLink}>{t.back}</Link>
          </div>
        </section>
      </main>
    );
  }

  if (stage === "review") {
    const wrong = wrongIds(active, answers);
    return (
      <main className={s.app}>
        {header}
        <section className={s.section} aria-labelledby="test-review">
          <h2 id="test-review">{t.reviewHeading}</h2>
          {wrong.length === 0 ? <p className={s.note}>{t.reviewNone}</p> : (
            <ol className={s.review}>
              {wrong.map((i) => {
                const f = flat[i];
                const picked = answers[i];
                return (
                  <li key={i}>
                    <h3>{`${t.question(i + 1, total)} · ${partName(f.part)}`}</h3>
                    {f.passage && <p lang="ja" className={s.passage}>{f.passage}</p>}
                    <p className={s.qtext}><QuestionText text={f.q} lang={lang} /></p>
                    <p className={s.answerRow}>
                      <span className={s.label}>{t.yourChoice}</span>{" "}
                      {picked === null ? <span>{t.notAnswered}</span> : <span lang="ja">{f.choices[picked]}</span>}
                    </p>
                    <p className={s.answerRow}><span className={s.label}>{t.rightAnswer}</span> <strong lang="ja">{f.choices[f.answer]}</strong></p>
                    <div className={s.explain}>
                      <p className={s.label}>{t.explain}</p>
                      <p>{f.explain}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div className={s.actions}>
            <button type="button" className="btn btnGhost" onClick={() => setRun({ ...run, stage: "result" })}>{t.backToResult}</button>
            <button type="button" className="btn" disabled={wrong.length === 0} onClick={retryWrong}>{t.retryWrong}</button>
          </div>
        </section>
      </main>
    );
  }

  const q = flat[current];
  const stateOf = (i: number) => (flagged.includes(i) ? "flagged" : answers[i] !== null ? "answered" : "unanswered");
  const open = total - answered;
  return (
    <main className={s.app}>
      {header}
      {retry && <p className={s.note}>{t.retryNote}</p>}
      {timed && <p role="status" className="sr-only">{left <= TEST_WARN_MINUTES * MS_PER_MINUTE ? t.fiveLeft(TEST_WARN_MINUTES) : ""}</p>}
      <div className={s.progress}>
        <p aria-live="polite">{t.answered} <span>{answered}/{total}</span></p>
        <button type="button" className="btn btnGhost" aria-pressed={flagged.includes(current)} onClick={toggleFlag}>{t.flag}</button>
      </div>
      <section className={s.card}>
        {q.passage && <p lang="ja" className={s.passage}>{q.passage}</p>}
        <fieldset className={s.choices} aria-describedby="test-qtext">
          <legend>{t.question(current + 1, total)} · {partName(q.part)}</legend>
          <p id="test-qtext" className={s.qtext}><QuestionText text={q.q} lang={lang} /></p>
          {q.choices.map((c, i) => (
            <label key={i} className={s.choice}>
              <input type="radio" name={`q-${current}`} checked={answers[current] === i} onChange={() => answer(i)} />
              <span className={s.key} aria-hidden="true">{i + 1}</span>
              <span lang="ja">{c}</span>
            </label>
          ))}
        </fieldset>
      </section>
      <div className={s.moves}>
        <button type="button" className="btn btnGhost" disabled={current === 0} onClick={() => go(current - 1)}><Arrow back /> {t.prev}</button>
        <button type="button" className="btn btnGhost" disabled={current === total - 1} onClick={() => go(current + 1)}>{t.next} <Arrow /></button>
        <button type="button" className="btn" onClick={() => dialogRef.current?.showModal()}>{t.submit}</button>
      </div>
      {/* The palette follows the question: on a phone 45 buttons would push the question below the fold (BUG-024). */}
      <nav aria-label={t.palette} className={s.palette}>
        {flat.map((f) => (
          <button
            key={f.index}
            type="button"
            className={s.dot}
            data-state={stateOf(f.index)}
            aria-label={t.paletteLabel(f.index + 1, stateOf(f.index))}
            aria-current={f.index === current ? "step" : undefined}
            onClick={() => go(f.index)}
          >
            {f.index + 1}
          </button>
        ))}
      </nav>
      {warning}
      <details className={s.help}>
        <summary>{t.shortcuts}</summary>
        <dl>
          {t.keys.map(([key, what]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{what}</dd></div>)}
        </dl>
      </details>
      <dialog ref={dialogRef} className={s.dialog} aria-labelledby="test-confirm">
        <h2 id="test-confirm">{t.confirmTitle}</h2>
        <p className={s.unanswered}>{t.unanswered(open)}</p>
        <p>{t.confirmBody}</p>
        <div className={s.actions}>
          <button type="button" className="btn btnGhost" onClick={() => dialogRef.current?.close()}>{t.keepGoing}</button>
          <button type="button" className="btn" onClick={() => { dialogRef.current?.close(); submit(); }}>{t.submit}</button>
        </div>
      </dialog>
    </main>
  );
}
