import type { Metadata } from "next";
import { SiteBar } from "../SiteBar";
import { getLang } from "../LangSwitch";
import { flashcards, flashcardText } from "@/lib/flashcards";
import { FlashcardApp } from "./FlashcardApp";

export async function generateMetadata(): Promise<Metadata> {
  const t = flashcardText[await getLang()];
  return { title: t.title + " · Kotoba", description: t.lede };
}

export default async function FlashcardPage() {
  const lang = await getLang();
  return <><SiteBar current="flashcards" /><FlashcardApp cards={flashcards} lang={lang} /></>;
}

