import type { Metadata } from "next";
import { getKana, getKanji, getLessons, getVocab } from "@/lib/content";
import { libraryText } from "@/lib/library";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { Path } from "./Path";
import s from "./lessons.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const [lang, lessons] = await Promise.all([getLang(), getLessons()]);
  const t = libraryText[lang].lessons;
  return { title: `${t.title} · Kotoba`, description: t.lede(lessons.length) };
}

export default async function LessonsPage() {
  const [lang, lessons, kana, kanji, vocab] = await Promise.all([getLang(), getLessons(), getKana(), getKanji(), getVocab()]);
  const t = libraryText[lang].lessons;
  // Grammar is read, not scheduled, so a lesson is done when its kana, kanji and words are all learned.
  const items = [...kana, ...kanji, ...vocab];
  const stops = lessons.map((l) => ({ lesson: l.lesson, level: l.level, title: l.title[lang], ids: items.filter((k) => k.lesson === l.lesson).map((k) => k.id) }));
  return (
    <>
      <SiteBar current="lessons" />
      <main className={s.app}>
        <header className={s.heading}>
          <h1>{t.title}</h1>
          <p>{t.lede(lessons.length)}</p>
        </header>
        <Path stops={stops} lang={lang} />
      </main>
      <SiteFooter />
    </>
  );
}
