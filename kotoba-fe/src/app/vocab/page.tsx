import type { Metadata } from "next";
import { getLessons, getVocab } from "@/lib/content";
import { libraryText } from "@/lib/library";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { Decks } from "./Decks";
import s from "./vocab.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = libraryText[await getLang()].vocab;
  return { title: `${t.title} · Kotoba`, description: t.lede };
}

export default async function VocabPage() {
  const [lang, vocab, lessons] = await Promise.all([getLang(), getVocab(), getLessons()]);
  const t = libraryText[lang].vocab;
  const decks = lessons
    .map((l) => ({ lesson: l.lesson, title: l.title[lang], ids: vocab.filter((v) => v.lesson === l.lesson).map((v) => v.id) }))
    .filter((d) => d.ids.length);
  return (
    <>
      <SiteBar current="vocab" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title}</h1>
          <p>{t.lede}</p>
        </header>
        <Decks decks={decks} lang={lang} />
      </main>
      <SiteFooter />
    </>
  );
}
