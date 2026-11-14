"use client";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { currentLesson, levelLabel, libraryText, type Level } from "@/lib/library";
import { isLearned } from "@/lib/srs";
import { useDeck } from "@/lib/store";
import { Arrow } from "../Arrow";
import s from "./lessons.module.css";

type Stop = { lesson: number; level: Level; title: string; ids: string[] };
type State = "done" | "started" | "fresh";
const TAG_STATE: Record<State, string> = { done: "learned", started: "started", fresh: "fresh" };

// One collapsible group per level, but stations, track and the one action run across all of them.
// Progress is this browser's schedule, so before it loads every station reads untouched and counts read "—".
// A level's "x/y bài xong" counts only lessons with items: review lessons add nothing to learn (ADR 010).
export function Path({ stops, lang }: { stops: Stop[]; lang: Lang }) {
  const t = libraryText[lang].lessons;
  const srs = useDeck()?.srs;
  const rows = stops.map((p) => {
    const learned = srs ? p.ids.filter((id) => isLearned(srs, id)).length : 0;
    const state: State = p.ids.length && learned === p.ids.length ? "done" : learned ? "started" : "fresh";
    return { ...p, learned, state };
  });
  const target = srs ? currentLesson(stops, srs) : undefined;
  const current = rows.find((r) => r.lesson === target);
  const anyLearned = rows.some((r) => r.learned);
  const first = rows.findIndex((r) => r.ids.length > 0); // the one row that shows the unit, as a column head would
  const last = rows.findLastIndex((r) => r.learned > 0);
  const levels = [...new Set(rows.map((r) => r.level))];
  const openLevel = current?.level ?? levels[0];
  return (
    <div className={s.layout}>
      {current && (
        <aside className={`panel ${s.now}`} data-raised="" aria-labelledby="lesson-now">
          <h2 id="lesson-now">{t.current}</h2>
          <p className={s.nowTitle}><span className={s.num}>{current.lesson}</span> {current.title}</p>
          <div className={s.nowMeter}>
            <progress className="meter" aria-label={t.progress} value={current.learned} max={current.ids.length} />
            <span>{current.learned}/{current.ids.length} {t.learned}</span>
          </div>
          <Link href={`/lessons/${current.lesson}`} className="btn">{anyLearned ? t.continue : t.start} <Arrow /></Link>
        </aside>
      )}
      <div className={s.levels}>
        {levels.map((level) => {
          const counted = rows.filter((r) => r.level === level && r.ids.length > 0);
          const done = counted.filter((r) => r.state === "done").length;
          return (
            <section key={level} className={s.level} aria-labelledby={`level-${level}`}>
              <details className="panel" open={level === openLevel}>
                <summary className={s.summary}>
                  <h2 id={`level-${level}`}>{levelLabel(level)}</h2>
                  <span className={s.levelCount}>{srs ? t.doneOf(done, counted.length) : "—"}</span>
                  <progress className="meter" aria-label={t.levelProgress(levelLabel(level))} value={srs ? done : 0} max={counted.length} />
                </summary>
                <ol className={s.path}>
                  {rows.map((r, i) => r.level === level && (
                    <li key={r.lesson}>
                      <Link
                        href={`/lessons/${r.lesson}`}
                        className={s.row}
                        aria-current={target === r.lesson ? "step" : undefined}
                        data-state={r.state}
                        data-in={(i > 0 && i <= last) || undefined}
                        data-out={i < last || undefined}
                      >
                        <span className={s.station}>
                          <svg className={s.mark} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                            <circle cx="7" cy="7" r="6" strokeWidth="1" />
                            <path d="M7 1a6 6 0 0 0 0 12Z" />
                          </svg>
                        </span>
                        <span className={s.num}>{r.lesson}</span>
                        <span className={s.title}>
                          {r.title}
                          {target === r.lesson && <span className={s.here}>{t.current}</span>}
                        </span>
                        <span className={s.state}>
                          {srs && r.ids.length > 0 && <span className="tag" data-state={TAG_STATE[r.state]}>{t.state[r.state]}</span>}
                        </span>
                        <span className={s.count}>
                          {r.ids.length > 0 && (srs ? <>{r.learned}/{r.ids.length}<span className={i === first ? undefined : "sr-only"}> {t.learned}</span></> : "—")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            </section>
          );
        })}
      </div>
    </div>
  );
}
