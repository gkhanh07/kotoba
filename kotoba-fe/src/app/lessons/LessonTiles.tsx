"use client";
import Link from "next/link";
import { useId, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { Kana } from "@/lib/kana";
import { libraryText, type Kanji } from "@/lib/library";
import { Arrow } from "../Arrow";
import { Speak } from "../Speak";
import s from "./lessons.module.css";

type Props = { lang: Lang } & ({ kind: "kana"; items: Kana[] } | { kind: "kanji"; items: Kanji[] });

// A lesson's characters as a pickable grid: one tile is always selected, and the panel beside it
// shows that character in full, so the lesson can be read without leaving it (ADR 010).
export function LessonTiles(props: Props) {
  const { lang } = props;
  const t = libraryText[lang];
  const [selectedId, setSelectedId] = useState(props.items[0]?.id);
  const previewId = useId();
  const tiles = props.kind === "kana"
    ? props.items.map((k) => ({ id: k.id, char: k.char, sub: k.romaji }))
    : props.items.map((k) => ({ id: k.id, char: k.char, sub: k.hv[0] ?? "" }));
  return (
    <div className={s.picker}>
      <ul className={s.tiles}>
        {tiles.map((tile) => (
          <li key={tile.id}>
            <button type="button" className={`tile ${s.tile}`} aria-pressed={tile.id === selectedId} aria-controls={previewId} onClick={() => setSelectedId(tile.id)}>
              <span lang="ja" className={s.char}>{tile.char}</span>
              <span className={s.sub}>{tile.sub}</span>
            </button>
          </li>
        ))}
      </ul>
      <div id={previewId} className={s.preview} aria-live="polite">
        <p className={s.previewLabel}>{t.lessons.preview}</p>
        {props.kind === "kana" ? <KanaPreview item={props.items.find((k) => k.id === selectedId)} lang={lang} /> : <KanjiPreview item={props.items.find((k) => k.id === selectedId)} lang={lang} />}
      </div>
    </div>
  );
}

function KanaPreview({ item, lang }: { item?: Kana; lang: Lang }) {
  if (!item) return null;
  return (
    <>
      <p lang="ja" className={s.previewChar}>{item.char}</p>
      <p className={s.previewRomaji}>{item.romaji}</p>
      {/* hints are Vietnamese by construction, so they only ship in vi (as on /kana) */}
      {lang === "vi" && item.hint && <p className={s.previewHint}>{item.hint}</p>}
      <Speak text={item.char} label={libraryText[lang].lessons.speak} />
    </>
  );
}

function KanjiPreview({ item, lang }: { item?: Kanji; lang: Lang }) {
  if (!item) return null;
  const t = libraryText[lang].kanji;
  const meaning = (lang === "en" ? item.en.join(", ") : item.vi) ?? "";
  const rows: [string, string][] = [
    [t.hv, item.hv.join(", ")],
    [t.on, item.on.join("、")],
    [t.kun, item.kun.join("、")],
    [t.meaning, meaning],
    [t.strokes, String(item.strokes)],
  ];
  return (
    <>
      <p lang="ja" className={s.previewChar}>{item.char}</p>
      <dl className={s.facts}>
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd lang={label === t.on || label === t.kun ? "ja" : undefined}>{value}</dd></div>
        ))}
      </dl>
      <Link href={`/kanji/${encodeURIComponent(item.char)}`} className={s.nextLink}>{libraryText[lang].lessons.openKanji} <Arrow /></Link>
    </>
  );
}
