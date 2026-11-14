import type { Metadata } from "next";
import { getKana, getKanji, getLessons, getVocab } from "@/lib/content";
import { levelLabel, libraryText, type Level } from "@/lib/library";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { Path } from "./Path";
import s from "./lessons.module.css";

// Lesson numbers run on from N5 upwards, so the last lesson names the furthest level the path reaches.
const lastLevel = (lessons: { level: Level }[]) => levelLabel(lessons.at(-1)?.level ?? 5);

export async function generateMetadata(): Promise<Metadata> {
  const [lang, lessons] = await Promise.all([getLang(), getLessons()]);
  const t = libraryText[lang].lessons;
  return { title: `${t.title} · Kotoba`, description: t.lede(lessons.length, lastLevel(lessons)) };
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
          <p>{t.lede(lessons.length, lastLevel(lessons))}</p>
        </header>
        <Path stops={stops} lang={lang} />
      </main>
      <SiteFooter />
    </>
  );
}
