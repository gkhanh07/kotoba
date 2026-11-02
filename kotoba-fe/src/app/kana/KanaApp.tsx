"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { GROUPS, LAYOUT, type Group, type Kana, type KanaSet } from "@/lib/kana";
import { dict, type Lang } from "@/lib/i18n";
import { MASTERED_AT, applyAnswer, choicesFor, isMastered, load, pickNext, resetScript, save, streakOf, type Progress } from "@/lib/progress";
import { logActivity } from "@/lib/activity";
import s from "./kana.module.css";

type Mode = "chart" | "quiz";
type T = ReturnType<typeof dict>["kana"];

// Letter count, so CSS can shrink whole words (がっこう) to fit the same box as one kana.
const fit = (char: string) => ({ "--len": [...char].length }) as CSSProperties;

function Lamps({ streak, size, t }: { streak: number; size?: "lg"; t: T }) {
  return (
    <span className={s.lamps} data-size={size} role="img" aria-label={t.lampsAria(Math.min(streak, MASTERED_AT), MASTERED_AT)}>
      {Array.from({ length: MASTERED_AT }, (_, i) => <i key={i} data-on={i < streak} />)}
    </span>
  );
}

// Stored progress, read once per page load; kept in sync by update() so remounts on script/mode switch see fresh data.
let stored: { p: Progress; ok: boolean } | undefined;
const readStored = () => (stored ??= ((p) => ({ p: p ?? {}, ok: p !== null }))(load()));
const noSubscribe = () => () => {};

export function KanaApp({ set, mode, lang }: { set: KanaSet; mode: Mode; lang: Lang }) {
  const t = dict(lang).kana;
  const nav = dict(lang).nav;
  const initial = useSyncExternalStore(noSubscribe, readStored, () => null);
  const [local, setLocal] = useState<{ p: Progress; ok: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const current = local ?? initial;
  const progress = current?.p ?? null;
  const storageOk = current?.ok ?? true;

  const update = useCallback((next: Progress) => {
    stored = { p: next, ok: save(next) && (stored?.ok ?? true) };
    setLocal(stored);
  }, []);

  const mastered = progress ? set.items.filter((k) => isMastered(progress, k.id)).length : null;
  const other = set.script === "hiragana" ? "katakana" : "hiragana";
  const href = (script: string, m: Mode, group: Group = set.group) =>
    `/kana?script=${script}${group === "basic" ? "" : `&group=${group}`}${m === "quiz" ? "&mode=quiz" : ""}`;

  return (
    <main className={s.app}>
      <div className={s.head}>
        <div>
          <h1>{mode === "quiz" ? t.titleQuiz(set.name) : t.titleChart(set.name)}</h1>
          <p className={s.lede}>{mode === "quiz" ? t.ledeQuiz : t.ledeChart[set.group]}</p>
        </div>

        <div className={s.switches}>
          <nav className={s.segment} aria-label={t.scriptNav}>
            <Link href={href("hiragana", mode)} aria-current={set.script === "hiragana" ? "page" : undefined}>
              <span lang="ja">ひらがな</span> Hiragana
            </Link>
            <Link href={href("katakana", mode)} aria-current={set.script === "katakana" ? "page" : undefined}>
              <span lang="ja">カタカナ</span> Katakana
            </Link>
          </nav>
          <nav className={s.segment} aria-label={t.groupNav}>
            {GROUPS.map((g) => (
              <Link key={g} href={href(set.script, mode, g)} aria-current={set.group === g ? "page" : undefined}>{t.groups[g]}</Link>
            ))}
          </nav>
          <nav className={s.segment} aria-label={t.modeNav}>
            <Link href={href(set.script, "chart")} aria-current={mode === "chart" ? "page" : undefined}>{nav.chart}</Link>
            <Link href={href(set.script, "quiz")} aria-current={mode === "quiz" ? "page" : undefined}>{nav.quiz}</Link>
          </nav>
        </div>
      </div>

      <section className={s.meter} aria-label={t.progressAria}>
        <p>
          {/* key remounts the number so its strike animation replays on each change */}
          {t.masteredA}<strong key={mastered ?? "…"}>{mastered ?? "…"}</strong>{t.masteredB(set.items.length, set.name)}
        </p>
        <div className={s.ticks} aria-hidden="true">
          {set.items.map((k) => {
            const st = progress ? streakOf(progress, k.id) : 0;
            return <i key={k.id} data-state={st >= MASTERED_AT ? "done" : st > 0 ? "some" : "none"} />;
          })}
        </div>
      </section>

      {!storageOk && (
        <p className={s.warn} role="alert">
          {t.storageWarn}
        </p>
      )}

      {mode === "chart" ? (
        <Chart set={set} progress={progress} quizHref={href(set.script, "quiz")} lang={lang} t={t} />
      ) : progress === null ? (
        <div className={s.status} role="status"><p>{t.loadingProgress}</p></div>
      ) : (
        <Quiz set={set} progress={progress} onProgress={update} otherHref={href(other, "quiz")} chartHref={href(set.script, "chart")} t={t} />
      )}

      <div className={s.reset}>
        <button
          type="button"
          className={s.resetBtn}
          data-armed={confirmReset}
          disabled={!progress || !Object.keys(progress).some((id) => id.startsWith(set.script + ":"))}
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            update(resetScript(progress ?? {}, set.script));
            setConfirmReset(false);
          }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? t.resetArmed(set.name) : t.reset(set.name)}
        </button>
      </div>
    </main>
  );
}

function Chart({ set, progress, quizHref, lang, t }: { set: KanaSet; progress: Progress | null; quizHref: string; lang: Lang; t: T }) {
  const [selected, setSelected] = useState(set.items[0]);
  const { rows, cols } = LAYOUT[set.group];
  const at = (row: number, col: number) => set.items.find((k) => k.row === row && k.col === col);
  const streak = progress ? streakOf(progress, selected.id) : 0;

  const cell = (k: Kana) => {
    const st = progress ? streakOf(progress, k.id) : 0;
    return (
      <button
        key={k.id}
        type="button"
        className={s.cell}
        data-done={st >= MASTERED_AT}
        aria-pressed={selected.id === k.id}
        aria-label={t.cellAria(k.char, k.romaji)}
        onClick={() => setSelected(k)}
      >
        <span lang="ja" className={s.cellChar} style={fit(k.char)}>{k.char}</span>
        <span className={s.cellRomaji}>{k.romaji}</span>
        <span className={s.cellLamps}>{Array.from({ length: MASTERED_AT }, (_, i) => <i key={i} data-on={i < st} />)}</span>
      </button>
    );
  };

  return (
    <div className={s.chartWrap}>
      {rows.length ? (
        <div className={s.chart} style={{ "--cols": cols.length } as CSSProperties} role="group" aria-label={t.chartAria(set.name)}>
          <span />
          {cols.map((v) => <span key={v} className={s.colHead}>{v}</span>)}
          {rows.map((r, row) => (
            <div key={row} className={s.row}>
              <span className={s.rowHead}>{r}</span>
              {cols.map((_, col) => {
                const k = at(row, col);
                return k ? cell(k) : <span key={col} className={s.gap} />;
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className={s.words} role="group" aria-label={t.chartAria(set.name)}>
          {set.items.map(cell)}
        </div>
      )}

      <aside className={s.detail} aria-live="polite">
        <div className={s.detailSign}>
          <span key={selected.char} lang="ja" style={fit(selected.char)}>
            {selected.char}
          </span>
        </div>
        <p className={s.detailRomaji}>{selected.romaji}</p>
        <dl className={s.detailList}>
          {/* hints are Vietnamese by construction, so they only ship in vi */}
          {lang === "vi" && (
            <div>
              <dt>{set.group === "special" ? t.noteLabel : t.hintLabel}</dt>
              <dd>{selected.hint}</dd>
            </div>
          )}
          <div>
            <dt>{t.levelLabel}</dt>
            <dd>
              <Lamps streak={streak} t={t} />{" "}
              {progress === null ? "…" : streak >= MASTERED_AT ? t.levelDone : streak > 0 ? t.levelLearning : t.levelNone}
            </dd>
          </div>
        </dl>
        <Link href={quizHref} className="btn">{t.practiceThis}</Link>
      </aside>
    </div>
  );
}

type Answer = { id: string; correct: boolean } | null;

function Quiz({ set, progress, onProgress, otherHref, chartHref, t }: { set: KanaSet; progress: Progress; onProgress: (p: Progress) => void; otherHref: string; chartHref: string; t: T }) {
  const [q, setQ] = useState<Kana | null>(() => pickNext(set.items, progress, null));
  const [choices, setChoices] = useState<Kana[]>(() => (q ? choicesFor(q, set.items) : []));
  const [answer, setAnswer] = useState<Answer>(null);
  const [session, setSession] = useState({ right: 0, total: 0 });
  const nextRef = useRef<HTMLButtonElement>(null);

  const choose = useCallback(
    (k: Kana | undefined) => {
      if (!q || !k || answer) return;
      const correct = k.id === q.id;
      setAnswer({ id: k.id, correct });
      setSession((v) => ({ right: v.right + Number(correct), total: v.total + 1 }));
      onProgress(applyAnswer(progress, q.id, correct));
      logActivity("kana", q.id);
      requestAnimationFrame(() => nextRef.current?.focus({ preventScroll: true }));
    },
    [q, answer, progress, onProgress],
  );

  const next = useCallback(() => {
    const n = pickNext(set.items, progress, q?.id ?? null);
    setQ(n);
    setChoices(n ? choicesFor(n, set.items) : []);
    setAnswer(null);
  }, [set.items, progress, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-4]$/.test(e.key)) choose(choices[Number(e.key) - 1]);
      else if (e.key === "Enter" && answer) {
        e.preventDefault(); // keep the focused button from answering the next card
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, answer, choose, next]);

  if (!q) {
    return (
      <div className={s.empty}>
        <div className={s.emptySign} lang="ja">{set.script === "hiragana" ? "ぜんぶ" : "ゼンブ"}</div>
        <h2>{t.emptyH(set.items.length, set.name)}</h2>
        <p>{t.emptyP(MASTERED_AT)}</p>
        <div className={s.statusActions}>
          <Link href={otherHref} className="btn">{t.practiceOther(set.script === "hiragana" ? "Katakana" : "Hiragana")}</Link>
          <Link href={chartHref} className="btn btnGhost">{t.backToChart}</Link>
        </div>
      </div>
    );
  }

  const streak = streakOf(progress, q.id);
  const state = answer ? (answer.correct ? "right" : "wrong") : "idle";

  return (
    <div className={s.quiz}>
      <div className={s.card} data-state={state} key={q.id}>
        <span lang="ja" className={s.cardChar} style={fit(q.char)}>{q.char}</span>
        <span className={s.cardReveal} aria-hidden={!answer}>{answer ? q.romaji : " "}</span>
        <Lamps streak={streak} size="lg" t={t} />
      </div>

      <div className={s.panel}>
        <h2 className={s.ask} id="ask">{t.ask}</h2>
        <div className={s.choices} role="group" aria-labelledby="ask">
          {choices.map((k, i) => {
            const mark = !answer ? undefined : k.id === q.id ? "answer" : k.id === answer.id ? "miss" : "rest";
            return (
              <button key={k.id} type="button" className={s.choice} data-mark={mark} disabled={!!answer && mark === "rest"} aria-disabled={!!answer} onClick={() => choose(k)}>
                <kbd>{i + 1}</kbd>
                <span>{k.romaji}</span>
              </button>
            );
          })}
        </div>

        <p className={s.feedback} aria-live="polite" data-state={state}>
          {!answer
            ? " "
            : answer.correct
              ? streak >= MASTERED_AT
                ? t.rightMastered(q.char)
                : t.right(q.romaji, streak, MASTERED_AT)
              : t.wrong(q.char, q.romaji, set.group === "special" ? undefined : q.hint)}
        </p>

        <div className={s.quizFoot}>
          <button ref={nextRef} type="button" className="btn" onClick={next} disabled={!answer}>
            {t.nextChar} <kbd className={s.kbdOnBtn}>Enter</kbd>
          </button>
          <p className={s.session}>{t.session(session.right, session.total)}</p>
        </div>
      </div>
    </div>
  );
}
