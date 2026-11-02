// Kanji and lesson shapes as kotoba-be serves them, and the text of /kanji and /vocab. Client-safe.
import type { Vocab } from "./flashcards";

type Translation = { vi: string; en: string };
export type Lesson = { id: string; lesson: number; title: Translation };
export type Kanji = {
  id: string; // "kanji:日"
  char: string;
  hv: string[]; // Hán Việt, KANJIDIC2 r_type="vietnam"
  on: string[];
  kun: string[];
  en: string[];
  strokes: number;
  vi?: string;
  lesson: number;
};
export type KanjiDetail = Kanji & { words: Vocab[] };

export const FILTERS = ["all", "learned", "new"] as const;
export type Filter = (typeof FILTERS)[number];

const en = {
  kanji: {
    title: "N5 kanji",
    lede: (n: number) => `${n} kanji, ordered by lesson. Tap one for its readings, Hán Việt and the words that use it.`,
    filter: "Show",
    filters: { all: "All", learned: "Learned", new: "Not started" } satisfies Record<Filter, string>,
    lesson: (n: number, title: string) => `Lesson ${n} · ${title}`,
    none: "No kanji here yet.",
    back: "Kanji",
    hv: "Hán Việt", on: "On reading", kun: "Kun reading", meaning: "Meaning", strokes: "Strokes", lessonLabel: "Lesson",
    noVi: "No Vietnamese meaning yet",
    words: "Words with",
    study: (n: number) => `Study lesson ${n}`,
    speak: "Play",
  },
  vocab: {
    title: "N5 vocabulary",
    lede: "Each lesson is a deck. Study one, or review every word that is due.",
    decks: "Decks",
    lesson: (n: number) => `Lesson ${n}`,
    count: (n: number) => `${n} words`,
    stats: (learned: number, due: number) => `${learned} learned · ${due} due`,
    fresh: "Not started",
    review: (n: number) => `Review ${n} due ${n === 1 ? "word" : "words"}`,
    next: "Study the next deck",
  },
};

const vi: typeof en = {
  kanji: {
    title: "Kanji N5",
    lede: (n) => `${n} chữ, xếp theo bài học. Chạm một chữ để xem âm đọc, Hán Việt và từ chứa nó.`,
    filter: "Lọc",
    filters: { all: "Tất cả", learned: "Đã học", new: "Chưa học" },
    lesson: (n, title) => `Bài ${n} · ${title}`,
    none: "Chưa có chữ nào ở đây.",
    back: "Kanji",
    hv: "Hán Việt", on: "Âm On", kun: "Âm Kun", meaning: "Nghĩa", strokes: "Số nét", lessonLabel: "Bài",
    noVi: "Chưa có nghĩa tiếng Việt",
    words: "Từ chứa",
    study: (n) => `Học bài ${n}`,
    speak: "Đọc",
  },
  vocab: {
    title: "Từ vựng N5",
    lede: "Mỗi bài học là một bộ thẻ. Học một bộ hoặc ôn tất cả từ đến hạn.",
    decks: "Các bộ từ",
    lesson: (n) => `Bài ${n}`,
    count: (n) => `${n} từ`,
    stats: (learned, due) => `${learned} đã học · ${due} đến hạn`,
    fresh: "Chưa học",
    review: (n) => `Ôn ${n} từ đến hạn`,
    next: "Học bài tiếp",
  },
};

export const libraryText = { en, vi };
