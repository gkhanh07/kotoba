import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getKana, getKanji, getLessons, getVocab } from "@/lib/content";
import { hvRows, KINDS, libraryText, type Kind, type ReviewItem } from "@/lib/library";
import { getLang } from "../LangSwitch";
import { SiteBar, SiteFooter } from "../SiteBar";
import { ReviewApp } from "./ReviewApp";
import { ReviewHub } from "./ReviewHub";

export async function generateMetadata(): Promise<Metadata> {
  const t = libraryText[await getLang()].review;
  return { title: `${t.title} · Kotoba`, description: t.lede };
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

// Bare /review is the hub. ?start=1, ?kind=, ?lesson= and ?weak=1 open a session;
// ?kind= narrows the queue to one kind (unknown values are ignored), ?lesson=n to one lesson.
export default async function ReviewPage(props: PageProps<"/review">) {
  const q = await props.searchParams;
  const lang = await getLang();
  const t = libraryText[lang];
  const isSession = ["start", "kind", "lesson", "weak"].some((key) => q[key] !== undefined);
  const [kana, kanji, vocab, lessons] = await Promise.all([getKana(), getKanji(), getVocab(), getLessons()]);

  if (!isSession) {
    const cards = [
      ...kana.map((k) => ({ id: k.id, kind: "kana" as const })),
      ...kanji.map((k) => ({ id: k.id, kind: "kanji" as const })),
      ...vocab.map((w) => ({ id: w.id, kind: "vocab" as const })),
    ];
    return (
      <>
        <SiteBar current="review" />
        <ReviewHub cards={cards} lang={lang} />
        <SiteFooter />
      </>
    );
  }

  // ponytail: every item (~800) ships to the client so the queue and "next lesson" need no fetch; page it if content grows past N5.
  const items: ReviewItem[] = [
    ...kana.map((k) => ({
      id: k.id, kind: "kana" as const, lesson: k.lesson, tag: k.script === "katakana" ? "Katakana" : "Hiragana", front: k.char,
      back: [{ label: t.review.romaji, text: k.romaji, strong: true }, ...(lang === "vi" && k.hint && k.hint !== k.romaji ?[{ label: t.review.note, text: k.hint }] : [])],
    })),
    ...kanji.map((k) => ({
      id: k.id, kind: "kanji" as const, lesson: k.lesson, tag: "Kanji", front: k.char,
      meaning: cap(lang === "vi" ? (k.vi ?? k.en.join(", ")) : k.en.join(", ")),
      back: [
        ...hvRows(k.hv, t.kanji.hv),
        ...(k.on.length ? [{ label: t.kanji.on, text: k.on.join("、"), ja: true }] : []),
        ...(k.kun.length ? [{ label: t.kanji.kun, text: k.kun.join("、"), ja: true }] : []),
        { label: t.kanji.meaning, text: cap(lang === "vi" ? (k.vi ?? k.en.join(", ")) : k.en.join(", ")) },
      ],
    })),
    ...vocab.map((w) => ({
      id: w.id, kind: "vocab" as const, lesson: w.lesson, tag: t.review.kinds.vocab, front: w.word,
      meaning: cap(w[lang]), reading: w.reading,
      back: [
        { label: t.review.reading, text: w.reading, ja: true, sub: w.romaji },
        { label: t.kanji.meaning, text: cap(w[lang]), strong: true },
        { label: t.review.example, text: w.example.ja, ja: true, sub: w.example[lang] },
      ],
    })),
  ];

  const kind = KINDS.find((k) => k === q.kind) as Kind | undefined;
  let lesson: { n: number; title: string } | undefined;
  if (q.lesson !== undefined) {
    const l = lessons.find((x) => String(x.lesson) === q.lesson);
    if (!l || !items.some((i) => i.lesson === l.lesson)) notFound();
    lesson = { n: l.lesson, title: l.title[lang] };
  }

  return (
    <>
      <SiteBar current="review" />
      <ReviewApp items={items} lang={lang} kind={kind} lesson={lesson} weak={q.weak === "1"} />
      <SiteFooter />
    </>
  );
}
