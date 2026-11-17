import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getGrammar, getKana, getKanji, getVocab } from "@/lib/content";
import { DEFAULT_MINUTES } from "@/config/session";
import { goalScope } from "@/lib/library";
import { MODES, type Mode } from "@/lib/session";
import { getLang, getRomaji } from "../LangSwitch";
import { SessionApp } from "./SessionApp";
import { sessionText, type SessionItem } from "./text";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${sessionText[await getLang()].title} · Kotoba` };
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const WORDS_PER_KANJI = 4;

// Phase 41 (ADR 013): one study session in focus mode, no site bar. ?mode=review (reviews only) or ?mode=more (5 more new items).
export default async function SessionPage(props: PageProps<"/session">) {
  const q = await props.searchParams;
  const mode: Mode = MODES.find((m) => m === q.mode) ?? "full";
  const [lang, romaji, user, kana, kanji, vocab, grammar] = await Promise.all([
    getLang(), getRomaji(), currentUser(), getKana(), getKanji(), getVocab(), getGrammar(),
  ]);
  const goal = user?.profile.goal;
  const inKana = goalScope(kana.map((k) => ({ ...k, level: 5 })), goal);
  const inKanji = goalScope(kanji, goal);
  const inVocab = goalScope(vocab, goal);
  const meaningOf = (k: (typeof kanji)[number]) => cap(lang === "vi" ? (k.vi ?? k.en.join(", ")) : k.en.join(", "));

  // ponytail: the whole goal scope ships to the client so a session needs no fetch; send only the next lessons if it grows.
  const items: SessionItem[] = [
    ...inKana.map((k) => ({ id: k.id, kind: "kana" as const, lesson: k.lesson, front: k.char, answer: k.romaji, typed: { kana: k.char, romaji: k.romaji } })),
    ...inVocab.map((w) => ({
      id: w.id, kind: "vocab" as const, lesson: w.lesson, front: w.word, answer: cap(w[lang]), reading: w.reading, ...(romaji && { romaji: w.romaji }),
      typed: { kana: w.reading, romaji: w.romaji }, example: { ja: w.example.ja, tr: w.example[lang] },
    })),
    ...inKanji.map((k) => ({
      id: k.id, kind: "kanji" as const, lesson: k.lesson, front: k.char,
      // The quick check asks the Hán Việt in Vietnamese; a Japanese-made kanji (no Hán Việt) and English ask the meaning.
      answer: lang === "vi" && k.hv.length ? k.hv[0].toUpperCase() : meaningOf(k),
      meaning: meaningOf(k), hv: k.hv, on: k.on, kun: k.kun, strokes: k.strokes,
      words: inVocab.filter((w) => w.word.includes(k.char)).slice(0, WORDS_PER_KANJI).map((w) => ({ id: w.id, word: w.word, reading: w.reading, meaning: cap(w[lang]) })),
    })),
  ];

  return <SessionApp items={items} grammar={goalScope(grammar, goal)} lang={lang} mode={mode} goalMinutes={user?.profile.minutes ?? DEFAULT_MINUTES} />;
}
