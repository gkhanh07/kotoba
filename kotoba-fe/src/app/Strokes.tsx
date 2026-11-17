"use client";
// Phase 41k (AC-20): KanjiVG strokes (viewBox 0 0 109 109) drawn in order. Under reduced motion the CSS
// stops the drawing and shows each stroke's number at its start instead. No paths: nothing, the count stays beside it.
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import s from "./strokes.module.css";

const text = {
  vi: { label: (n: number) => `Thứ tự viết ${n} nét`, replay: "Xem lại" },
  en: { label: (n: number) => `Stroke order, ${n} ${n === 1 ? "stroke" : "strokes"}`, replay: "Replay" },
};
// A path's first moveto is absolute even in lower case (掛, 慣).
const start = (d: string) => (/^m\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/i.exec(d)?.slice(1) ?? ["0", "0"]).map(Number);
const G = 10; // a number's box at 8px type, in viewBox units
const near = (placed: number[][], x: number, y: number) => placed.some(([a, b]) => Math.abs(a - x) < G && Math.abs(b - y) < G);
// Each number sits at its stroke's start. 441 of 625 kanji have strokes starting together (強: 2 and 3), so a
// number steps down until it clears the ones before it, wrapping to the top of the next column inside the 109 box.
// Over all 625 kanji this leaves no overlap and every number within x ≤ 97, 8 ≤ y ≤ 104.
// ponytail: greedy nudge, not KanjiVG's hand-placed StrokeNumbers; keep those in strokes.json if a nudge reads badly.
export const labels = (paths: string[]) =>
  paths.reduce<number[][]>((placed, d) => {
    let [x, y] = start(d);
    for (let k = 0; k < 99 && near(placed, x, y); k++) {
      y += G;
      if (y > 104) [x, y] = [x + G > 100 ? 4 : x + G, 9];
    }
    return [...placed, [x, y]];
  }, []);

export function Strokes({ paths, lang }: { paths: string[] | undefined; lang: Lang }) {
  const [run, setRun] = useState(0);
  if (!paths?.length) return null;
  const t = text[lang];
  return (
    <figure className={s.strokes}>
      {/* key: a replay mounts a fresh figure, so every stroke's animation starts again. */}
      <svg key={run} viewBox="0 0 109 109" role="img" aria-label={t.label(paths.length)}>
        {paths.map((d, i) => <path key={i} d={d} pathLength={1} style={{ "--i": i } as React.CSSProperties} />)}
        {labels(paths).map(([x, y], i) => <text key={i} x={x} y={y}>{i + 1}</text>)}
      </svg>
      <button type="button" className="btn btnGhost" onClick={() => setRun(run + 1)}>{t.replay}</button>
    </figure>
  );
}

// The session ships its whole goal scope, so paths (~0.8 KB a kanji) are fetched for the card on screen only.
export function StrokesOf({ char, lang }: { char: string; lang: Lang }) {
  const [paths, setPaths] = useState<{ char: string; paths: string[] }>();
  useEffect(() => {
    let live = true;
    fetch(`/strokes/${encodeURIComponent(char)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((p: string[]) => live && setPaths({ char, paths: p }))
      .catch(() => {}); // offline: the card keeps its stroke count
    return () => { live = false; };
  }, [char]);
  return <Strokes paths={paths?.char === char ? paths.paths : undefined} lang={lang} />;
}
