import type { Metadata } from "next";
import Link from "next/link";
import { getGrammar } from "@/lib/content";
import { libraryText } from "@/lib/library";
import { getLang } from "../LangSwitch";
import { Arrow, SiteBar, SiteFooter } from "../SiteBar";
import s from "./grammar.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, grammar] = await Promise.all([getLang(), getGrammar()]);
  const t = libraryText[lang].grammar;
  return { title: `${t.title} · Kotoba`, description: t.lede(grammar.length) };
}

export default async function GrammarPage() {
  const [lang, grammar] = await Promise.all([getLang(), getGrammar()]);
  const t = libraryText[lang].grammar;
  return (
    <>
      <SiteBar current="grammar" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title}</h1>
          <p>{t.lede(grammar.length)}</p>
        </header>
        <ul className={s.list}>
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
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
