import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteBar, SiteFooter } from "../SiteBar";
import { getLang } from "../LangSwitch";
import { flashcardText } from "@/lib/flashcards";
import { getLessons, getVocab } from "@/lib/content";
import { FlashcardApp } from "./FlashcardApp";

export async function generateMetadata(): Promise<Metadata> {
  const t = flashcardText[await getLang()];
  return { title: t.title + " · Kotoba", description: t.lede };
}

// ?deck=n studies lesson n's words; no deck studies all of them.
export default async function FlashcardPage(props: PageProps<"/flashcards">) {
  const { deck } = await props.searchParams;
  const lang = await getLang();
  const t = flashcardText[lang];
  let cards = await getVocab();
  let name = t.deck;
  if (deck !== undefined) {
    const lesson = (await getLessons()).find((l) => String(l.lesson) === deck);
    cards = cards.filter((c) => c.lesson === lesson?.lesson);
    if (!lesson || !cards.length) notFound();
    name = t.lesson(lesson.lesson, lesson.title[lang]);
  }
  return <><SiteBar current="vocab" /><FlashcardApp key={name} cards={cards} lang={lang} deck={name} /><SiteFooter /></>;
}
