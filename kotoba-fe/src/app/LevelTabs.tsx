import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { LEVELS, levelLabel, libraryText, listHref, type Level } from "@/lib/library";
import s from "./levels.module.css";

// Level switcher for the list pages. `keep` are the other query params to carry over; the page number is not one of them.
export function LevelTabs({ path, level, lang, keep = {} }: { path: string; level: Level; lang: Lang; keep?: Record<string, string | undefined> }) {
  return (
    <nav className={s.tabs} aria-label={libraryText[lang].levels.nav}>
      {LEVELS.map((l) => (
        <Link key={l} href={listHref(path, { ...keep, level: l })} aria-current={l === level ? "page" : undefined}>
          {levelLabel(l)}
        </Link>
      ))}
    </nav>
  );
}
