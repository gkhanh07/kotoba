import type { Metadata } from "next";
import Link from "next/link";
import { getKanji, getLessons } from "@/lib/content";
import { FILTERS, libraryText, type Filter } from "@/lib/library";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { KanjiGrid } from "./KanjiGrid";
import s from "./kanji.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, kanji] = await Promise.all([getLang(), getKanji()]);
  const t = libraryText[lang].kanji;
  return { title: `${t.title} · Kotoba`, description: t.lede(kanji.length) };
}

export default async function KanjiPage(props: PageProps<"/kanji">) {
  const q = await props.searchParams;
  const filter: Filter = FILTERS.find((f) => f === q.filter) ?? "all";
  const [lang, kanji, lessons] = await Promise.all([getLang(), getKanji(), getLessons()]);
  const t = libraryText[lang].kanji;
  const groups = lessons
    .map((l) => ({
      title: t.lesson(l.lesson, l.title[lang]),
      items: kanji.filter((k) => k.lesson === l.lesson).map((k) => ({ id: k.id, char: k.char, hv: k.hv[0] ?? "" })),
    }))
    .filter((g) => g.items.length);
  return (
    <>
      <SiteBar current="kanji" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title}</h1>
          <p>{t.lede(kanji.length)}</p>
        </header>
        <nav className={s.filters} aria-label={t.filter}>
          <span>{t.filter}:</span>
          {FILTERS.map((f) => (
            <Link key={f} href={f === "all" ? "/kanji" : `/kanji?filter=${f}`} aria-current={f === filter ? "page" : undefined}>
              {t.filters[f]}
            </Link>
          ))}
        </nav>
        <KanjiGrid groups={groups} filter={filter} none={t.none} learnedLabel={t.filters.learned} />
      </main>
      <SiteFooter />
    </>
  );
}
