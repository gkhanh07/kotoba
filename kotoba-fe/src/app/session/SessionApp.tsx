"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { NEW_PER_DAY } from "@/config/srs";
import { ACTIVITY_KEY, logActivity, parseActivity, type Activity } from "@/lib/activity";
import { BLANK, grammarChoices, grammarQuestions, questionFor } from "@/lib/grammarQuiz";
import type { Lang } from "@/lib/i18n";
import type { Grammar } from "@/lib/library";
import { advance, buildSession, parseSession, resumable, runsIn, SESSION_KEY, type Mode, type SessionState, type Step, type StepKind } from "@/lib/session";
import { addDays, apply, choicesFor, daysUntil, dueCount, isLearned, type Srs } from "@/lib/srs";
import { learnedToday, review, today, useDeck } from "@/lib/store";
import { typedMatch } from "@/lib/typed";
import { xpOf } from "@/lib/xp";
import { SaveButton } from "../SaveButton";
import { Choices, dialogOpen, useKeys } from "./Choices";
import { sessionText, type SessionItem, type SessionText } from "./text";
import s from "./session.module.css";

type Done = (correct?: boolean) => void;
// onGrade: the step wrote its grade to the SRS; the session saves that, so a reload moves on instead of grading twice.
type Ctx = { t: SessionText; lang: Lang; srs: Srs; onDone: Done; onGrade: (right: boolean) => void };

const shuffle = <T,>(xs: T[], rand = Math.random): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const logItem = (i: SessionItem) => logActivity(i.kind, i.id);

// The sticky bar at the bottom: the step's main button (Space/Enter) and anything beside it.
function Bar({ children }: { children: React.ReactNode }) {
  return <div className={s.bar}>{children}</div>;
}
function Primary({ onClick, disabled, children, buttonRef }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; buttonRef?: React.Ref<HTMLButtonElement> }) {
  return <button ref={buttonRef} type="button" className={`btn ${s.primary}`} data-primary="" disabled={disabled} onClick={onClick}>{children}</button>;
}

function Facts({ item, t }: { item: SessionItem; t: SessionText }) {
  return (
    <dl className={s.facts}>
      {item.kind === "kana" && <div><dt>Romaji</dt><dd><strong>{item.answer}</strong></dd></div>}
      {item.reading && <div><dt>{t.reading}</dt><dd lang="ja">{item.reading}{item.romaji && <span className={s.sub}> {item.romaji}</span>}</dd></div>}
      {item.kind === "vocab" && <div><dt>{t.meaning}</dt><dd><strong>{item.answer}</strong></dd></div>}
      {item.hv && item.hv.length > 0 && <div><dt>{t.hv}</dt><dd><strong>{item.hv.join(" · ").toUpperCase()}</strong></dd></div>}
      {item.meaning && <div><dt>{t.meaning}</dt><dd>{item.meaning}</dd></div>}
      {item.on && item.on.length > 0 && <div><dt>{t.on}</dt><dd lang="ja">{item.on.join("、")}</dd></div>}
      {item.kun && item.kun.length > 0 && <div><dt>{t.kun}</dt><dd lang="ja">{item.kun.join("、")}</dd></div>}
    </dl>
  );
}

// AC-4: kana and words are recalled by typing the reading; a kanji is recalled in the head, then flipped.
function ReviewStep({ item, t, lang, srs, onDone }: Ctx & { item: SessionItem }) {
  const [shown, setShown] = useState(false);
  const [typed, setTyped] = useState<boolean | null>(null);
  const knewRef = useRef<HTMLButtonElement>(null);
  const forgotRef = useRef<HTMLButtonElement>(null);
  const day = today();
  const gap = (knew: boolean) => {
    const due = apply(srs, item.id, knew, day, 0)[item.id]?.due;
    return knew && due ? t.inDays(daysUntil(due, day)) : t.again;
  };
  const show = (right: boolean | null) => {
    setTyped(right);
    setShown(true);
    logItem(item);
    requestAnimationFrame(() => (right === false ? forgotRef : knewRef).current?.focus());
  };
  const grade = (knew: boolean) => {
    review(item.id, knew);
    onDone(knew);
  };
  useKeys((k) => { if (shown && (k === "1" || k === "2")) grade(k === "2"); });

  return (
    <>
      <div className={s.card}>
        <p className={s.big} lang="ja">{item.front}</p>
        {!shown && !item.typed && <p className={s.ask}>{t.recallKanji}</p>}
        {shown && (
          <>
            {typed !== null && <p className={typed ? s.ok : s.err} role="status">{typed ? `✓ ${t.typedRight}` : `✗ ${t.typedWrong(item.typed!.kana)}`}</p>}
            <Facts item={item} t={t} />
            {item.kind !== "kana" && <SaveButton id={item.id} lang={lang} />}
          </>
        )}
      </div>
      {!shown && item.typed ? (
        <form className={s.typed} onSubmit={(e) => {
          e.preventDefault();
          const v = String(new FormData(e.currentTarget).get("answer") ?? "");
          if (v.trim()) show(typedMatch(v, item.typed!.kana, item.typed!.romaji));
        }}>
          <label htmlFor="answer">{t.typeReading}</label>
          <input id="answer" name="answer" autoFocus autoComplete="off" autoCapitalize="off" spellCheck={false} lang="ja" />
          <Bar>
            <button type="button" className="btn btnGhost" onClick={() => show(false)}>{t.dontKnow}</button>
            <button type="submit" className={`btn ${s.primary}`}>{t.check}</button>
          </Bar>
        </form>
      ) : !shown ? (
        <Bar><Primary onClick={() => show(null)}>{t.flip}</Primary></Bar>
      ) : (
        <Bar>
          <button ref={forgotRef} type="button" className="btn btnGhost" onClick={() => grade(false)}>
            {t.forgot} <span className={s.gap}>{gap(false)}</span><kbd aria-hidden="true">1</kbd>
          </button>
          <button ref={knewRef} type="button" className={`btn ${s.primary}`} data-primary="" onClick={() => grade(true)}>
            {t.knew} <span className={s.gap}>{gap(true)}</span><kbd aria-hidden="true">2</kbd>
          </button>
        </Bar>
      )}
    </>
  );
}

// The example with the word being learned underlined (AC-5).
function Marked({ ja, word }: { ja: string; word: string }) {
  const at = ja.indexOf(word);
  if (at < 0) return <>{ja}</>;
  return <>{ja.slice(0, at)}<u>{word}</u>{ja.slice(at + word.length)}</>;
}

function LearnStep({ item, t, lang, srs, onDone }: Ctx & { item: SessionItem }) {
  useEffect(() => logItem(item), [item]);
  return (
    <>
      <div className={s.card}>
        {item.kind === "kanji" && item.hv && item.hv.length > 0 && <p className={s.hv}>{item.hv[0].toUpperCase()}</p>}
        <p className={s.big} lang="ja">{item.front}</p>
        <Facts item={item} t={t} />
        {item.strokes !== undefined && <p className={s.sub}>{t.strokes(item.strokes)}</p>}
        {item.example && (
          <div className={s.example}>
            <p className={s.label}>{t.example}</p>
            <p lang="ja"><Marked ja={item.example.ja} word={item.front} /></p>
            <p className={s.sub}>{item.example.tr}</p>
          </div>
        )}
        {item.words && item.words.length > 0 && (
          <div className={s.example}>
            <p className={s.label}>{t.words}</p>
            <ul className={s.words}>
              {item.words.map((w) => (
                <li key={w.id}>
                  <span lang="ja">{w.word}</span> <span lang="ja" className={s.sub}>{w.reading}</span> {w.meaning}
                  <span className="tag">{isLearned(srs, w.id) ? t.learned : t.notLearned}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {item.kind !== "kana" && <SaveButton id={item.id} lang={lang} />}
      </div>
      <Bar><Primary onClick={() => onDone()}>{t.next}</Primary></Bar>
    </>
  );
}

function QuizStep({ item, items, t, onDone, onGrade }: Ctx & { item: SessionItem; items: SessionItem[] }) {
  const [choices] = useState(() => {
    const pool = items.filter((i) => i.kind === item.kind).map((i) => ({ id: i.id, romaji: i.answer }));
    return choicesFor({ id: item.id, romaji: item.answer }, pool).map((c) => ({ id: c.id, label: c.romaji }));
  });
  const [picked, setPicked] = useState<string | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const correct = picked === item.id;
  const pick = (id: string) => {
    setPicked(id);
    review(item.id, id === item.id);
    onGrade(id === item.id);
    logItem(item);
    requestAnimationFrame(() => nextRef.current?.focus());
  };
  return (
    <>
      <div className={s.card}>
        <p className={s.ask}>{t.askQuiz[item.kind]}</p>
        <p className={s.big} lang="ja">{item.front}</p>
        <Choices choices={choices} picked={picked} answer={item.id} onPick={pick} t={t} />
        <p className={picked ? (correct ? s.ok : s.err) : s.sub} aria-live="polite">
          {picked && `${correct ? "✓" : "✗"} ${item.front}${item.reading ? ` (${item.reading})` : ""} = ${item.answer}`}
        </p>
      </div>
      <Bar><Primary buttonRef={nextRef} disabled={!picked} onClick={() => onDone(correct)}>{t.next}</Primary></Bar>
    </>
  );
}

function GrammarStep({ g, t, lang, onDone }: Ctx & { g: Grammar }) {
  useEffect(() => logActivity(), [g]);
  return (
    <>
      <div className={s.card}>
        <p className={s.pattern} lang="ja">{g.pattern}</p>
        <p className={s.lead}>{g.title[lang]}</p>
        <dl className={s.facts}><div><dt>{t.structure}</dt><dd lang="ja">{g.structure}</dd></div></dl>
        <p>{g.explain[lang]}</p>
        {g.examples.slice(0, 2).map((e) => (
          <div key={e.ja} className={s.example}>
            <p lang="ja">{e.ja}</p>
            <p className={s.sub}>{e[lang]}</p>
          </div>
        ))}
      </div>
      <Bar><Primary onClick={() => onDone()}>{t.next}</Primary></Bar>
    </>
  );
}

// AC-7: the example's parts, shuffled, plus one piece from another point's example. Tap (or press its number) to place it,
// tap a placed piece to take it back; Check stays off until as many pieces as the sentence has are placed.
function OrderStep({ g, grammar, t, lang, onDone, onGrade }: Ctx & { g: Grammar; grammar: Grammar[] }) {
  const ex = g.examples.find((e) => (e.parts?.length ?? 0) >= 2)!;
  const parts = ex.parts!;
  const [tiles] = useState(() => {
    const extra = grammar.flatMap((x) => (x.id === g.id ? [] : x.examples.flatMap((e) => e.parts ?? []))).find((p) => !parts.includes(p));
    return shuffle(extra ? [...parts, extra] : parts);
  });
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const place = (i: number) => { if (result === null && !placed.includes(i)) setPlaced([...placed, i]); };
  const check = () => {
    const right = placed.map((i) => tiles[i]).join("") === parts.join("");
    setResult(right);
    review(g.id, right);
    logActivity();
    onGrade(right);
    requestAnimationFrame(() => nextRef.current?.focus());
  };
  useKeys((k) => { if (/^[1-9]$/.test(k) && Number(k) <= tiles.length) place(Number(k) - 1); });
  return (
    <>
      <div className={s.card}>
        <p className={s.ask}>{t.orderAsk}</p>
        <p className={s.sub}>{ex[lang]}</p>
        <p className={s.label} id="placed">{t.placed}</p>
        <ol className={s.placed} aria-labelledby="placed">
          {placed.length === 0 && <li className={s.sub}>{t.placedEmpty}</li>}
          {placed.map((i) => (
            <li key={i}><button type="button" className={s.tile} lang="ja" disabled={result !== null} onClick={() => setPlaced(placed.filter((x) => x !== i))}>{tiles[i]}</button></li>
          ))}
        </ol>
        <p className={s.label} id="tiles">{t.tiles}</p>
        <ul className={s.pool} aria-labelledby="tiles">
          {tiles.map((p, i) => (
            <li key={i}>
              <button type="button" className={s.tile} disabled={placed.includes(i) || result !== null} onClick={() => place(i)}>
                <kbd aria-hidden="true">{i + 1}</kbd><span lang="ja">{p}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className={result === null ? s.sub : result ? s.ok : s.err} aria-live="polite">
          {result !== null && `${result ? `✓ ${t.right}` : `✗ ${t.wrong}`} · ${t.answerWas(parts.join(""))}`}
        </p>
      </div>
      <Bar>
        {result === null
          ? <Primary disabled={placed.length < parts.length} onClick={check}>{t.check}</Primary>
          : <Primary buttonRef={nextRef} onClick={() => onDone(result)}>{t.next}</Primary>}
      </Bar>
    </>
  );
}

function PracticeStep({ g, grammar, t, lang, onDone, onGrade }: Ctx & { g: Grammar; grammar: Grammar[] }) {
  const q = questionFor(g)!;
  const [choices] = useState(() => grammarChoices(q, grammarQuestions(grammar)).map((c) => ({ id: c.id, label: c.romaji!, ja: true })));
  const [picked, setPicked] = useState<string | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const correct = picked === q.id;
  const pick = (id: string) => {
    setPicked(id);
    review(g.id, id === q.id);
    logActivity();
    onGrade(id === q.id);
    requestAnimationFrame(() => nextRef.current?.focus());
  };
  return (
    <>
      <div className={s.card}>
        <p className={s.ask}>{t.practiceAsk}</p>
        <p className={s.sentence} lang="ja">{q.before}<span className={s.blank}>{picked ? q.answer : BLANK}</span>{q.after}</p>
        <p className={s.sub}>{q.translation[lang]}</p>
        <Choices choices={choices} picked={picked} answer={q.id} onPick={pick} t={t} />
        <p className={picked ? (correct ? s.ok : s.err) : s.sub} aria-live="polite">
          {picked && `${correct ? "✓" : "✗"} ${q.pattern}: ${q.title[lang]}`}
        </p>
      </div>
      <Bar><Primary buttonRef={nextRef} disabled={!picked} onClick={() => onDone(correct)}>{t.next}</Primary></Bar>
    </>
  );
}

// Study minutes for the 7 days ending on day, oldest first.
function weekMinutes(day: string): { day: string; minutes: number }[] {
  let a: Activity = { days: {} };
  try { a = parseActivity(localStorage.getItem(ACTIVITY_KEY)) ?? a; } catch { /* storage blocked: no minutes */ }
  return [6, 5, 4, 3, 2, 1, 0].map((n) => addDays(day, -n)).map((d) => ({ day: d, minutes: a.days[d]?.minutes.length ?? 0 }));
}

export function SessionApp({ items, grammar, lang, mode: start, goalMinutes }: {
  items: SessionItem[]; grammar: Grammar[]; lang: Lang; mode: Mode; goalMinutes: number;
}) {
  const t = sessionText[lang];
  const router = useRouter();
  const deck = useDeck();
  const [state, setState] = useState<SessionState | null>(null);
  const [asking, setAsking] = useState(false);
  const exitRef = useRef<HTMLButtonElement>(null);
  // Closing the exit dialog hands focus back to the button that opened it.
  const stay = () => { setAsking(false); requestAnimationFrame(() => exitRef.current?.focus()); };
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const gById = useMemo(() => new Map(grammar.map((g) => [g.id, g])), [grammar]);

  const build = (mode: Mode, srs: Srs): SessionState => ({
    day: today(), mode, index: 0, first: {}, xp0: xpOf(srs),
    steps: buildSession({ items, grammar, srs, today: today(), learnedToday: learnedToday(), perDay: NEW_PER_DAY, mode }),
  });
  if (deck && state === null) {
    let saved: SessionState | null = null;
    try { saved = parseSession(localStorage.getItem(SESSION_KEY), today(), start); } catch { /* storage blocked: a new session */ }
    // A finished session shows its end again; see resumable for what starts over.
    setState(resumable(saved, runsIn(items, grammar)) ?? build(start, deck.srs));
  }

  useEffect(() => {
    if (!state) return;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch { /* the deck warning covers blocked storage */ }
  }, [state]);

  const graded = state ? Object.keys(state.first).length > 0 || state.graded !== undefined : false;
  // Esc leaves (asking first once something was graded); Space/Enter press the step's main button.
  useKeys((k) => {
    if (k === "Escape") { if (asking) stay(); else if (graded) setAsking(true); else router.push("/"); }
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== " " && e.key !== "Enter") || e.repeat) return;
      if ((e.target as Element).closest?.("input, textarea, select, button, a, summary, [contenteditable]")) return;
      const main = document.querySelector<HTMLButtonElement>("[data-primary]:not(:disabled)");
      if (main && !dialogOpen()) { e.preventDefault(); main.click(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-read the clock when the step changes
  const minutes = useMemo(() => (state ? weekMinutes(today()).at(-1)!.minutes : 0), [state?.index]);

  if (!deck || !state) return <main className={s.app}><p role="status">…</p></main>;
  const step = state.steps[state.index];
  const next = state.steps[state.index + 1];
  const onDone: Done = (correct) => setState(advance(state, correct));
  const onGrade = (right: boolean) => setState({ ...state, graded: right });
  const ctx: Ctx = { t, lang, srs: deck.srs, onDone, onGrade };
  const label = (st: Step) => `${t.kinds[st.kind]}: ${byId.get(st.id)?.front ?? gById.get(st.id)?.pattern ?? ""}`;

  const exit = graded
    ? <button type="button" ref={exitRef} className={s.exit} onClick={() => setAsking(true)}>{t.exit}</button>
    : <Link href="/" className={s.exit}>{t.exit}</Link>;

  return (
    <main className={s.app}>
      <header className={s.top} inert={asking}>
        {exit}
        <h1 className={s.title}>{t.title}</h1>
        <span className={s.clock}>{t.minutes(minutes, goalMinutes)}</span>
      </header>
      {asking && (
        <div className={`panel ${s.confirm}`} role="alertdialog" aria-modal="true" aria-labelledby="exit-ask">
          <p id="exit-ask">{t.exitAsk}</p>
          <div className={s.row}>
            <Link href="/" className="btn">{t.exitYes}</Link>
            <button type="button" className="btn btnGhost" autoFocus onClick={stay}>{t.exitNo}</button>
          </div>
        </div>
      )}
      {step && (
        <div className={s.progress} inert={asking}>
          <p>{t.step(state.index + 1, state.steps.length)} · {t.kinds[step.kind]}</p>
          <ol className={s.segments} aria-hidden="true">
            {state.steps.map((st, i) => <li key={i} data-kind={st.kind} data-state={i < state.index ? "done" : i === state.index ? "now" : undefined} />)}
          </ol>
          <p className={s.sub}>{next ? `${t.after}: ${label(next)}` : t.last}</p>
        </div>
      )}
      <section className={s.stage} inert={asking} aria-label={step ? t.kinds[step.kind] : t.title}>
        {!step ? <End state={state} t={t} srs={deck.srs} goalMinutes={goalMinutes} name={(id) => byId.get(id)?.front ?? gById.get(id)?.pattern ?? id} onMore={() => { setState(build("more", deck.srs)); router.replace("/session?mode=more"); }} />
          : step.kind === "review" ? <ReviewStep key={state.index} item={byId.get(step.id)!} {...ctx} />
          : step.kind === "learn" ? <LearnStep key={state.index} item={byId.get(step.id)!} {...ctx} />
          : step.kind === "quiz" ? <QuizStep key={state.index} item={byId.get(step.id)!} items={items} {...ctx} />
          : step.kind === "grammar" ? <GrammarStep key={state.index} g={gById.get(step.id)!} {...ctx} />
          : step.kind === "order" ? <OrderStep key={state.index} g={gById.get(step.id)!} grammar={grammar} {...ctx} />
          : <PracticeStep key={state.index} g={gById.get(step.id)!} grammar={grammar} {...ctx} />}
      </section>
      {!deck.ok && <p className={s.err} role="alert">{t.warning}</p>}
      <p className={s.keys}>{t.keysHint}</p>
    </main>
  );
}

// AC-10: what the session did, the week so far, what tomorrow holds and the XP change. No popup, no confetti.
function End({ state, t, srs, goalMinutes, name, onMore }: {
  state: SessionState; t: SessionText; srs: Srs; goalMinutes: number; name: (id: string) => string; onMore: () => void;
}) {
  const grades = Object.values(state.first);
  const pct = grades.length ? Math.round((100 * grades.filter(Boolean).length) / grades.length) : 0;
  const ids = (kinds: StepKind[]) => new Set(state.steps.filter((st) => kinds.includes(st.kind)).map((st) => st.id)).size;
  const misses = Object.keys(state.first).filter((id) => !state.first[id]);
  const day = today();
  const week = weekMinutes(day);
  const top = Math.max(goalMinutes, ...week.map((d) => d.minutes));
  // The bar stays outside the card: the card's rise animation would make it the bar's containing block.
  return (
    <>
    <div className={s.card} role="status">
      <h2 className={s.lead}>{state.steps.length ? t.done : t.empty}</h2>
      {state.steps.length > 0 && (
        <>
          <p>{t.minutes(week.at(-1)!.minutes, goalMinutes)} · {t.doneCounts(ids(["review"]), ids(["learn"]), ids(["grammar", "order", "practice"]))}</p>
          {grades.length > 0 && <p>{t.doneStats(grades.length, pct)}</p>}
          {state.xp0 !== undefined && <p className={s.xp}>{t.xp(xpOf(srs) - state.xp0)}</p>}
          <p className={s.label} id="end-week">{t.week}</p>
          <ol className={s.week} aria-labelledby="end-week">
            {week.map((d) => (
              <li key={d.day} aria-label={t.dayMinutes(d.day, d.minutes)} data-goal={d.minutes >= goalMinutes ? "" : undefined}>
                <span style={{ blockSize: `${(100 * d.minutes) / top}%` }} />
              </li>
            ))}
          </ol>
          {misses.length > 0 && (
            <>
              <p className={s.label} id="end-misses">{t.misses}</p>
              <ul className={s.words} aria-labelledby="end-misses">{misses.map((id) => <li key={id} lang="ja">{name(id)}</li>)}</ul>
            </>
          )}
          <p>{t.tomorrow(dueCount(srs, addDays(day, 1)))}</p>
        </>
      )}
    </div>
      <Bar>
        <button type="button" className="btn btnGhost" onClick={onMore}>{t.more}</button>
        <Link href="/" className={`btn ${s.primary}`} data-primary="">{t.home}</Link>
      </Bar>
    </>
  );
}
