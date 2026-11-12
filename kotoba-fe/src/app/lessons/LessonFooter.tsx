"use client";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { libraryText } from "@/lib/library";
import { isLearned } from "@/lib/srs";
import { useDeck } from "@/lib/store";
import { Arrow } from "../Arrow";
import s from "./lessons.module.css";

type Step = { href: string; ids: string[] };

// Study goes to the first step that still has unlearned items. Once every item is learned
// the lesson's own action turns ghost and the amber moves on to the next lesson.
// It sits beside the lesson from 1100px (sticky) and after it on a phone (ADR 010).
export function LessonFooter({ steps, next, lang }: { steps: Step[]; next?: { href: string; label: string }; lang: Lang }) {
  const t = libraryText[lang].lessons;
  const srs = useDeck()?.srs;
  const total = steps.reduce((n, st) => n + st.ids.length, 0);
  const learned = srs ? steps.reduce((n, st) => n + st.ids.filter((id) => isLearned(srs, id)).length, 0) : 0;
  const open = srs && steps.find((st) => st.ids.some((id) => !isLearned(srs, id)));
  const done = !!srs && !open;
  return (
    <aside className={`panel ${s.side}`} data-raised="">
      <p className={s.scheduled}>{srs ? t.scheduled(learned, total) : "—"}</p>
      <progress className="meter" aria-label={t.progress} value={learned} max={total} />
      <div className={s.actions}>
        {srs && (open ? (
          <Link href={open.href} className="btn">{t.study} <Arrow /></Link>
        ) : (
          <Link href={steps[0].href} className="btn btnGhost">{t.again}</Link>
        ))}
        {next && <Link href={next.href} className={done ? "btn" : s.nextLink}>{next.label} <Arrow /></Link>}
      </div>
    </aside>
  );
}
