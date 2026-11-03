"use client";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { libraryText } from "@/lib/library";
import { isLearned } from "@/lib/srs";
import { useDeck } from "@/lib/store";
import { Arrow } from "../Arrow";
import s from "./lessons.module.css";

type Stop = { lesson: number; title: string; ids: string[] };
type State = "done" | "started" | "fresh";

// Progress is this browser's schedule, so before it loads every station reads untouched and counts read "—".
export function Path({ stops, lang }: { stops: Stop[]; lang: Lang }) {
  const t = libraryText[lang].lessons;
  const srs = useDeck()?.srs;
  const rows = stops.map((p) => {
    const learned = srs ? p.ids.filter((id) => isLearned(srs, id)).length : 0;
    const state: State = p.ids.length && learned === p.ids.length ? "done" : learned ? "started" : "fresh";
    return { ...p, learned, state };
  });
  const open = (r: (typeof rows)[number]) => r.ids.length > 0 && r.state !== "done";
  const target = srs ? (rows.find((r) => r.state === "started") ?? rows.find(open)) : undefined;
  const anyLearned = rows.some((r) => r.learned);
  const first = rows.findIndex((r) => r.ids.length > 0); // the one row that shows the unit, as a column head would
  const last = rows.findLastIndex((r) => r.learned > 0);
  return (
    <ol className={s.path}>
      {rows.map((r, i) => (
        <li key={r.lesson}>
          <Link
            href={`/lessons/${r.lesson}`}
            className={s.row}
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
              {srs && <span className="sr-only">, {t.state[r.state]}</span>}
            </span>
            <span className={s.count}>
              {r.ids.length > 0 && (srs ? <>{r.learned}/{r.ids.length}<span className={i === first ? undefined : "sr-only"}> {t.learned}</span></> : "—")}
            </span>
            {target === r && (
              <span className={`btn ${s.go}`}>{anyLearned ? t.continue : t.start} <Arrow /></span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
