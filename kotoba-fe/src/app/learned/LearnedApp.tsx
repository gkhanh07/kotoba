"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { cardStage, type Stage } from "@/lib/srs";
import { resetDeck, resetItem, useDeck } from "@/lib/store";
import type { ItemLink } from "@/lib/weak";
import s from "./learned.module.css";
import { learnedText } from "./text";

const STAGES: Stage[] = ["new", "learning", "known"];
const DECKS = [["hiragana:", "Hiragana"], ["katakana:", "Katakana"], ["kanji:", "Kanji"], ["vocab:", "vocab"], ["grammar:", "grammar"]] as const;
export type Row = ItemLink & { sub?: string };

// Every reset asks twice: the first press arms the button, leaving it disarms (same as the kana chart).
export function LearnedApp({ links, lang }: { links: Record<string, Row>; lang: Lang }) {
  const t = learnedText[lang];
  const deck = useDeck();
  const [armed, setArmed] = useState<string | null>(null);
  const [done, setDone] = useState("");
  const status = useRef<HTMLParagraphElement>(null);
  // The pressed button leaves the list on reset, so focus goes to the line that says what happened.
  const press = (key: string, run: () => void, said: string) => {
    if (armed !== key) return setArmed(key);
    run();
    setArmed(null);
    setDone(said);
    status.current?.focus();
  };
  const name = (id: string) => (links[id].sub ? `${links[id].front} (${links[id].sub})` : links[id].front);
  const ids = deck ? Object.keys(deck.srs).filter((id) => links[id]).sort() : [];
  return (
    <main className={s.app}>
      <h1>{t.title}</h1>
      <p className={s.lede}>{t.lede}</p>
      {!deck ? <p>—</p> : !deck.ok ? <p role="alert">{t.warn}</p> : null}
      <p ref={status} role="status" tabIndex={-1} className={s.lede}>{done}</p>
      {deck && !ids.length && <p>{t.empty}</p>}
      {deck && ids.length > 0 && (
        <>
          {STAGES.map((stage) => {
            const here = ids.filter((id) => cardStage(deck.srs, id) === stage);
            return (
              <section key={stage} className={s.group} aria-labelledby={`st-${stage}`}>
                <h2 id={`st-${stage}`}>{t.stage[stage]} <span>{t.count(here.length)}</span></h2>
                {here.length > 0 && (
                  <ul className={s.list}>
                    {here.map((id) => (
                      <li key={id}>
                        <Link href={links[id].href} lang="ja" className={s.front}>{links[id].front}</Link>
                        {links[id].sub && <span className={s.sub}>{links[id].sub}</span>}
                        <button type="button" className={s.reset} data-armed={armed === id} aria-label={armed === id ? undefined : t.resetItem(name(id))}
                          onClick={() => press(id, () => resetItem(id), t.didItem(name(id)))} onBlur={() => setArmed(null)}>
                          {armed === id ? t.armed : t.reset}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
          <section className={s.group} aria-labelledby="st-decks">
            <h2 id="st-decks">{t.decks}</h2>
            <ul className={s.decks}>
              {DECKS.filter(([prefix]) => ids.some((id) => id.startsWith(prefix))).map(([prefix, name]) => {
                const label = name === "vocab" ? t.vocab : name === "grammar" ? t.grammar : name;
                return (
                  <li key={prefix}>
                    <button type="button" className={s.reset} data-armed={armed === prefix} onClick={() => press(prefix, () => resetDeck(prefix), t.didDeck(label))} onBlur={() => setArmed(null)}>
                      {armed === prefix ? t.deckArmed(label) : t.deck(label)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
