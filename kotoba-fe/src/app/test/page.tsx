import type { Metadata } from "next";
import Link from "next/link";
import { getTests } from "@/lib/content";
import { levelLabel, levelOf, libraryText } from "@/lib/library";
import { testText } from "@/lib/testText";
import { LevelTabs } from "../LevelTabs";
import { getLang } from "../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../SiteBar";
import { Last } from "./Last";
import s from "./test.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = testText[await getLang()];
  return { title: `${t.title} · Kotoba`, description: t.metaDesc };
}

export default async function TestListPage(props: PageProps<"/test">) {
  const level = levelOf((await props.searchParams).level);
  const [lang, tests] = await Promise.all([getLang(), getTests(level)]);
  const t = testText[lang];
  return (
    <>
      <SiteBar current="test" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title}</h1>
          <p>{t.lede}</p>
        </header>
        <LevelTabs path="/test" level={level} lang={lang} />
        {tests.length === 0 ? <p className={s.note}>{libraryText[lang].levels.empty(levelLabel(level))}</p> : (
          <ul className={s.papers}>
            {tests.map((p) => (
              <li key={p.id}>
                <Link href={`/test/${p.id}`} className={s.paper}>
                  <span className={s.paperTitle}>{p.title[lang]}</span>
                  <span className={s.meta}>{t.minutes(p.minutes)} · {t.count(p.questions)}</span>
                  <span className={s.meta}>{t.noListening}</span>
                  <Last id={p.id} total={p.questions} lang={lang} />
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
