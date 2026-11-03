import type { Metadata } from "next";
import Link from "next/link";
import { getGrammar } from "@/lib/content";
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
  const [lang, grammar] = await Promise.all([getLang(), getGrammar(level)]);
  const t = libraryText[lang].grammar;
  return (
    <>
      <SiteBar current="grammar" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title(levelLabel(level))}</h1>
          <p>{t.lede(grammar.length)}</p>
        </header>
        <LevelTabs path="/grammar" level={level} lang={lang} />
        {grammar.length === 0 ? <p className={lv.note}>{libraryText[lang].levels.empty(levelLabel(level))}</p> : <ul className={s.list}>
          {grammar.map((g) => (
            <li key={g.id}>
              <Link href={`/grammar/${g.slug}`} className={s.row}>
                <span className={s.num}>{t.lesson(g.lesson)}</span>
                <span lang="ja" className={s.pattern}>{g.pattern}</span>
                <span>{g.title[lang]}</span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>}
      </main>
      <SiteFooter />
    </>
  );
}
