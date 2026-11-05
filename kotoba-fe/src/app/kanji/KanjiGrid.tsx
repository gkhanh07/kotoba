"use client";
import Link from "next/link";
import type { Filter } from "@/lib/library";
import { isLearned } from "@/lib/srs";
import { useDeck } from "@/lib/store";
import s from "./kanji.module.css";

type Group = { title: string; items: { id: string; char: string; hv: string }[] };

// Learned state lives in this browser, so a filtered view waits for it instead of guessing.
export function KanjiGrid({ groups, filter, none, learnedLabel }: { groups: Group[]; filter: Filter; none: string; learnedLabel: string }) {
  const deck = useDeck();
  if (filter !== "all" && !deck) return <p className={s.wait}>—</p>;
  const learned = (id: string) => !!deck && isLearned(deck.srs, id);
  const shown = groups
    .map((g) => ({ ...g, items: filter === "all" ? g.items : g.items.filter((k) => learned(k.id) === (filter === "learned")) }))
    .filter((g) => g.items.length);
  if (!shown.length) return <p className={s.none}>{none}</p>;
  return shown.map((g) => (
    <section key={g.title} className={s.group} aria-label={g.title}>
      <h2>{g.title}</h2>
      <ul className={s.grid}>
        {g.items.map((k) => (
          <li key={k.id}>
            <Link href={`/kanji/${encodeURIComponent(k.char)}`} className={s.tile} data-learned={learned(k.id) || undefined}>
              <span lang="ja" className={s.char}>{k.char}</span>
              <span className={s.hv}>{k.hv}</span>
              {learned(k.id) && <span className="sr-only">, {learnedLabel}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  ));
}
