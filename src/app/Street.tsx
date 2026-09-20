"use client";

import { useState } from "react";
import { dict, type Lang, type SignWord } from "@/lib/i18n";
import s from "./page.module.css";

type Sign = { word: SignWord; romaji: string; script: "Hiragana" | "Katakana"; tone: "neon" | "cool" | "silver"; parts: [string, string][]; drop: number };

const SIGNS: Sign[] = [
  { word: "ラーメン", romaji: "rāmen", script: "Katakana", tone: "neon", drop: 0, parts: [["ラ", "ra"], ["ー", ""], ["メ", "me"], ["ン", "n"]] },
  { word: "くすり", romaji: "kusuri", script: "Hiragana", tone: "cool", drop: 3.5, parts: [["く", "ku"], ["す", "su"], ["り", "ri"]] },
  { word: "カラオケ", romaji: "karaoke", script: "Katakana", tone: "silver", drop: 1.2, parts: [["カ", "ka"], ["ラ", "ra"], ["オ", "o"], ["ケ", "ke"]] },
  { word: "すし", romaji: "sushi", script: "Hiragana", tone: "neon", drop: 5, parts: [["す", "su"], ["し", "shi"]] },
  { word: "ホテル", romaji: "hoteru", script: "Katakana", tone: "cool", drop: 2.2, parts: [["ホ", "ho"], ["テ", "te"], ["ル", "ru"]] },
];

function Glyphs({ sign }: { sign: Sign }) {
  return sign.parts.map(([c], i) =>
    c === "ー" ? <span key={i} className={s.long} /> : <span key={i}>{c}</span>,
  );
}

export function Street({ lang, copy, skyline }: { lang: Lang; copy: React.ReactNode; skyline: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const sign = SIGNS[active];
  const t = dict(lang).street;

  return (
    <>
      <div className={s.stage}>
        {skyline}
        <div className={s.copy}>{copy}</div>
      <div className={s.signs} role="group" aria-label={t.signsAria}>
        {SIGNS.map((g, i) => (
          <button
            key={g.word}
            type="button"
            className={s.sign}
            data-tone={g.tone}
            style={{ "--drop": `${g.drop}rem`, "--i": i } as React.CSSProperties}
            aria-pressed={i === active}
            aria-label={t.signAria(g.word, t.meanings[g.word])}
            onClick={() => setActive(i)}
          >
            <span lang="ja" className={s.glyphs}><Glyphs sign={g} /></span>
          </button>
        ))}
      </div>

      </div>

      <div className={s.ground}>
      <div className={s.reflection} aria-hidden="true">
        {SIGNS.map((g, i) => (
          <span key={g.word} className={s.sign} data-tone={g.tone} data-on={i === active} style={{ "--drop": `${g.drop}rem`, "--i": i } as React.CSSProperties}>
            <span className={s.glyphs}><Glyphs sign={g} /></span>
          </span>
        ))}
      </div>

      <div className={s.ticket} data-tone={sign.tone} aria-live="polite">
        <div className={s.ticketHead}>
          <p lang="ja" className={s.ticketWord}>{sign.word}</p>
          <div>
            <p className={s.ticketMeaning}>{t.meanings[sign.word]}</p>
            <p className={s.ticketRomaji}>{t.reads(sign.romaji)}</p>
          </div>
        </div>
        <ol className={s.parts}>
          {sign.parts.map(([c, r], i) => (
            <li key={i}>
              <span lang="ja">{c}</span>
              <span>{c === "ー" ? t.longMark : r}</span>
            </li>
          ))}
        </ol>
        <p className={s.ticketNote}>{t.scriptNote[sign.script]} {t.tapMore}</p>
      </div>
      </div>
    </>
  );
}
