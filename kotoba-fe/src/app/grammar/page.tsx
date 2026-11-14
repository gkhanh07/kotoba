import type { Metadata } from "next";
import Link from "next/link";
import { getGrammar, getLessons } from "@/lib/content";
import { levelLabel, levelOf, libraryText } from "@/lib/library";
import { LevelTabs } from "../LevelTabs";
import lv from "../levels.module.css";
import { getLang } from "../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../SiteBar";
import s from "./grammar.module.css";

export async function generateMetadata(props: PageProps<"/grammar">): Promise<Metadata> {
  const level = levelOf((await props.searchParams).level);
  const [lang, grammar] = await Promise.all([getLang(), getGrammar(level)]);
  const t = libraryText[lang].grammar;
  return { title: `${t.title(levelLabel(level))} · Kotoba`, description: t.lede(grammar.length) };
}

export default async function GrammarPage(props: PageProps<"/grammar">) {
  const level = levelOf((await props.searchParams).level);
  const [lang, grammar, lessons] = await Promise.all([getLang(), getGrammar(level), getLessons(level)]);
  const t = libraryText[lang].grammar;
  // Points arrive in lesson order; a lesson without a title in the lesson list still gets its number.
  const titles = new Map(lessons.map((l) => [l.lesson, l.title[lang]]));
  const groups = [...new Set(grammar.map((g) => g.lesson))].map((lesson) => ({ lesson, points: grammar.filter((g) => g.lesson === lesson) }));
  return (
    <>
      <SiteBar current="grammar" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title(levelLabel(level))}</h1>
          <p>{t.lede(grammar.length)}</p>
        </header>
        <LevelTabs path="/grammar" level={level} lang={lang} />
        {grammar.length === 0 ? <p className={lv.note}>{libraryText[lang].levels.empty(levelLabel(level))}</p> : groups.map(({ lesson, points }) => (
          <section key={lesson} className={s.group} aria-labelledby={`g-lesson-${lesson}`}>
            <h2 id={`g-lesson-${lesson}`}>{t.lesson(lesson)}{titles.has(lesson) && <span className={s.groupTitle}> · {titles.get(lesson)}</span>}</h2>
            <ul className={s.grid}>
              {points.map((g) => (
                <li key={g.id}>
                  <Link href={`/grammar/${g.slug}`} className={`tile ${s.card}`}>
                    <span lang="ja" className={s.pattern}>{g.pattern}</span>
                    <span className={s.meaning}>{g.title[lang]}</span>
                    <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
