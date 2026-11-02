import type { Metadata } from "next";
import { SiteBar } from "../SiteBar";
import { getLang } from "../LangSwitch";
import { flashcardText } from "@/lib/flashcards";
import { getVocab } from "@/lib/content";
import { FlashcardApp } from "./FlashcardApp";

export async function generateMetadata(): Promise<Metadata> {
  const t = flashcardText[await getLang()];
  return { title: t.title + " · Kotoba", description: t.lede };
}

export default async function FlashcardPage() {
  const [lang, cards] = await Promise.all([getLang(), getVocab()]);
  return <><SiteBar current="flashcards" /><FlashcardApp cards={cards} lang={lang} /></>;
}

