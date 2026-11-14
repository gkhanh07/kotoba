"use client";
import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { libraryText, type Filter } from "@/lib/library";
import { isKnown, isLearned, type Srs } from "@/lib/srs";
import { useDeck } from "@/lib/store";
import s from "./kanji.module.css";

type Item = { id: string; char: string; hv: string; meaning: string; on: string; kun: string };
type Group = { title: string; items: Item[] };
type State = "started" | "learned" | "known";

// A card with no schedule is fresh: that is the default, so it carries no tag and the few that moved stand out (ADR 010).
export function stateOf(srs: Srs | undefined, id: string): State | undefined {
  if (!srs?.[id]) return undefined;
  return isKnown(srs, id) ? "known" : isLearned(srs, id) ? "learned" : "started";
}

// Learned state lives in this browser, so a filtered view waits for it instead of guessing.
// The quick-look pane follows the hovered or focused card; it repeats what the link already says, so it is hidden from
// assistive tech and only shown where there is room beside the grid.
export function KanjiGrid({ groups, filter, none, lang }: { groups: Group[]; filter: Filter; none: string; lang: Lang }) {
  const t = libraryText[lang].kanji;
  const deck = useDeck();
  const [peekId, setPeekId] = useState<string>();
  if (filter !== "all" && !deck) return <p className={s.wait}>—</p>;
  const learned = (id: string) => !!deck && isLearned(deck.srs, id);
  const shown = groups
    .map((g) => ({ ...g, items: filter === "all" ? g.items : g.items.filter((k) => learned(k.id) === (filter === "learned")) }))
    .filter((g) => g.items.length);
  if (!shown.length) return <p className={s.none}>{none}</p>;
  const all = shown.flatMap((g) => g.items);
  const peek = all.find((k) => k.id === peekId) ?? all[0];
  const peekState = stateOf(deck?.srs, peek.id);
  return (
    <div className={s.browse}>
      <div>
        {shown.map((g) => (
          <section key={g.title} className={s.group} aria-label={g.title}>
            <h2>{g.title}</h2>
            <ul className={s.grid}>
              {g.items.map((k) => {
                const state = stateOf(deck?.srs, k.id);
                return (
                  <li key={k.id}>
                    <Link
                      href={`/kanji/${encodeURIComponent(k.char)}`}
                      className={`tile ${s.card}`}
                      data-state={state}
                      onMouseEnter={() => setPeekId(k.id)}
                      onFocus={() => setPeekId(k.id)}
                    >
                      <span lang="ja" className={s.char}>{k.char}</span>
                      <span className={s.hv}>{k.hv}</span>
                      {state && <span className="tag" data-state={state}><span className="sr-only">, </span>{t.state[state]}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <aside className={`panel ${s.peek}`} data-raised="" aria-hidden="true">
        <p className={s.peekLabel}>{t.peek}</p>
        <p lang="ja" className={s.peekChar}>{peek.char}</p>
        <p className={s.peekHv}>{peek.hv || "—"}</p>
        <dl className={s.peekFacts}>
          <div><dt>{t.meaning}</dt><dd>{peek.meaning || "—"}</dd></div>
          <div><dt>{t.on}</dt><dd lang="ja">{peek.on || "—"}</dd></div>
          <div><dt>{t.kun}</dt><dd lang="ja">{peek.kun || "—"}</dd></div>
        </dl>
        {peekState && <span className="tag" data-state={peekState}>{t.state[peekState]}</span>}
      </aside>
    </div>
  );
}
