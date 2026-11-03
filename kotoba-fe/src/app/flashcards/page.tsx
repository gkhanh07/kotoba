import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteBar, SiteFooter } from "../SiteBar";
import { getLang } from "../LangSwitch";
import { flashcardText, type Vocab } from "@/lib/flashcards";
import { getLessons, getVocab } from "@/lib/content";
import { levelLabel, levelOf, libraryText } from "@/lib/library";
import { LevelTabs } from "../LevelTabs";
import { FlashcardApp } from "./FlashcardApp";

export async function generateMetadata(): Promise<Metadata> {
  const t = flashcardText[await getLang()];
  return { title: t.title + " · Kotoba", description: t.lede };
}

// ?deck=n studies lesson n's words (a lesson has one level, so ?level is ignored then); no deck studies all words of ?level.
export default async function FlashcardPage(props: PageProps<"/flashcards">) {
  const q = await props.searchParams;
  const lang = await getLang();
  const t = flashcardText[lang];
  let level = levelOf(q.level);
  let cards: Vocab[] = [];
  let name = t.deck(levelLabel(level));
  if (q.deck !== undefined) {
    const lesson = (await getLessons()).find((l) => String(l.lesson) === q.deck);
    if (!lesson) notFound();
    cards = await getVocab(`?lesson=${lesson.lesson}`);
    if (!cards.length) notFound();
    level = lesson.level;
    name = t.lesson(lesson.lesson, lesson.title[lang]);
  } else cards = await getVocab(`?level=${level}`);
  const tabs = <LevelTabs path="/flashcards" level={level} lang={lang} />;
  return (
    <>
      <SiteBar current="vocab" />
      <FlashcardApp key={`${level}:${name}`} cards={cards} lang={lang} deck={name} tabs={tabs} empty={libraryText[lang].levels.empty(levelLabel(level))} />
      <SiteFooter />
    </>
  );
}
