import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKanjiPage, getLessons } from "@/lib/content";
import { FILTERS, levelLabel, levelOf, libraryText, listHref, pageOf, type Filter } from "@/lib/library";
import { LevelTabs } from "../LevelTabs";
import { Pager } from "../Pager";
import lv from "../levels.module.css";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { KanjiGrid } from "./KanjiGrid";
import s from "./kanji.module.css";

export async function generateMetadata(props: PageProps<"/kanji">): Promise<Metadata> {
  const level = levelOf((await props.searchParams).level);
  const [lang, data] = await Promise.all([getLang(), getKanjiPage(level, 1)]);
  const t = libraryText[lang].kanji;
  return { title: `${t.title(levelLabel(level))} · Kotoba`, description: t.lede(data.total) };
}

export default async function KanjiPage(props: PageProps<"/kanji">) {
  const q = await props.searchParams;
  const filter: Filter = FILTERS.find((f) => f === q.filter) ?? "all";
  const level = levelOf(q.level);
  const page = pageOf(q.page);
  const [lang, data, lessons] = await Promise.all([getLang(), getKanjiPage(level, page), getLessons(level)]);
  if (page > data.pages) notFound();
  const kanji = data.items;
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
          <h1>{t.title(levelLabel(level))}</h1>
          <p>{t.lede(data.total)}</p>
        </header>
        <LevelTabs path="/kanji" level={level} lang={lang} keep={{ filter: filter === "all" ? undefined : filter }} />
        {data.total === 0 ? <p className={lv.note}>{libraryText[lang].levels.empty(levelLabel(level))}</p> : (
          <>
        <nav className={s.filters} aria-label={t.filter}>
          <span>{t.filter}:</span>
          {FILTERS.map((f) => (
            <Link key={f} href={listHref("/kanji", { level, filter: f === "all" ? undefined : f })} aria-current={f === filter ? "page" : undefined}>
              {t.filters[f]}
            </Link>
          ))}
        </nav>
        <KanjiGrid groups={groups} filter={filter} none={t.none} learnedLabel={t.filters.learned} />
        <Pager path="/kanji" params={{ level, filter: filter === "all" ? undefined : filter }} page={page} pages={data.pages} lang={lang} />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
