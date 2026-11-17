import type { Metadata } from "next";
import Link from "next/link";
import { getReadings } from "@/lib/content";
import { levelLabel, levelOf, libraryText } from "@/lib/library";
import { testText } from "@/lib/testText";
import { LevelTabs } from "../LevelTabs";
import { getLang } from "../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../SiteBar";
import s from "../test/test.module.css";

export async function generateMetadata(props: PageProps<"/reading">): Promise<Metadata> {
  const [lang, sp] = await Promise.all([getLang(), props.searchParams]);
  const t = testText[lang].reading;
  return { title: `${t.title} · Kotoba`, description: t.metaDesc(levelLabel(levelOf(sp.level))) };
}

// AC-12: every reading passage of the level, mock-paper passages first, then the extra practice ones.
export default async function ReadingListPage(props: PageProps<"/reading">) {
  const level = levelOf((await props.searchParams).level);
  const [lang, readings] = await Promise.all([getLang(), getReadings(level)]);
  const t = testText[lang];
  return (
    <>
      <SiteBar current="test" />
      <main className={`${s.app} ${s.wide}`}>
        <header className={s.heading}>
          <h1>{t.reading.title} {levelLabel(level)}</h1>
          <p>{t.reading.lede}</p>
        </header>
        <LevelTabs path="/reading" level={level} lang={lang} />
        {readings.length === 0 ? <p className={s.note}>{libraryText[lang].levels.empty(levelLabel(level))}</p> : (
          <ul className={s.papers}>
            {readings.map((r) => (
              <li key={r.id}>
                <Link href={`/reading/${r.id}`} className={`tile ${s.paper}`}>
                  <span className={s.paperTitle}>{r.title[lang]}</span>
                  <span className={s.paperFacts}>{t.count(r.questions)}</span>
                  <span className={s.meta}>{r.paper ? t.reading.fromPaper : t.reading.practice}</span>
                  <span className={s.go}>{t.open} <Arrow /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
