// Kanji, grammar and lesson shapes as kotoba-be serves them, and the text of the library and lesson pages. Client-safe.
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
export type Grammar = {
  id: string; // "grammar:ga-suki"
  slug: string;
  lesson: number;
  pattern: string;
  title: Translation;
  structure: string;
  explain: Translation;
  examples: ({ ja: string } & Translation)[];
  note?: Translation;
};

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
  grammar: {
    title: "N5 grammar",
    lede: (n: number) => `${n} grammar points, each with translated examples.`,
    lesson: (n: number) => `Lesson ${n}`,
    back: "Grammar",
    structure: "Structure",
    explain: "Explanation",
    examples: "Examples",
    note: "Note",
    study: (n: number) => `Study lesson ${n}`,
    prev: "Previous",
    next: "Next",
    speak: "Play",
  },
  lessons: {
    title: "Lessons",
    lede: (n: number) => `${n} lessons, from the kana chart to N5 review. Go in order or jump to the one you need.`,
    learned: "learned",
    state: { done: "done", started: "in progress", fresh: "not started" },
    continue: "Continue",
    start: "Start",
    back: "Lessons",
    of: (n: number, total: number) => `Lesson ${n} / ${total}`,
    units: { kana: (n: number) => `${n} kana`, kanji: (n: number) => `${n} kanji`, vocab: (n: number) => `${n} words`, grammar: (n: number) => `${n} grammar points` },
    kana: "Kana",
    chart: "Open the chart",
    kanji: "Kanji",
    vocab: "Words",
    grammar: "Grammar",
    scheduled: (x: number, y: number) => `${x} / ${y} items scheduled for review`,
    study: "Study this lesson",
    again: "Review again",
    next: (n: number, title: string) => `Lesson ${n}: ${title}`,
    review: "Go to review",
    reviewBody: "This lesson adds nothing new. Every kana, kanji and word you have studied waits in the review queue.",
    speak: "Play",
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
  grammar: {
    title: "Ngữ pháp N5",
    lede: (n) => `${n} điểm ngữ pháp, mỗi điểm có ví dụ kèm bản dịch.`,
    lesson: (n) => `Bài ${n}`,
    back: "Ngữ pháp",
    structure: "Cấu trúc",
    explain: "Giải thích",
    examples: "Ví dụ",
    note: "Lưu ý",
    study: (n) => `Học bài ${n}`,
    prev: "Trước",
    next: "Sau",
    speak: "Đọc",
  },
  lessons: {
    title: "Bài học",
    lede: (n) => `${n} bài, từ bảng chữ đến ôn tập N5. Học theo thứ tự hoặc nhảy tới bài bạn cần.`,
    learned: "đã học",
    state: { done: "đã xong", started: "đang học", fresh: "chưa học" },
    continue: "Học tiếp",
    start: "Bắt đầu",
    back: "Bài học",
    of: (n, total) => `Bài ${n} / ${total}`,
    units: { kana: (n) => `${n} chữ`, kanji: (n) => `${n} kanji`, vocab: (n) => `${n} từ`, grammar: (n) => `${n} điểm ngữ pháp` },
    kana: "Bảng chữ",
    chart: "Xem bảng",
    kanji: "Kanji",
    vocab: "Từ vựng",
    grammar: "Ngữ pháp",
    scheduled: (x, y) => `${x} / ${y} mục đã vào lịch ôn`,
    study: "Học bài này",
    again: "Ôn lại",
    next: (n, title) => `Bài ${n}: ${title}`,
    review: "Vào ôn tập",
    reviewBody: "Bài ôn không thêm mục mới. Mọi chữ và từ bạn đã học đều nằm trong hàng đợi ôn tập.",
    speak: "Đọc",
  },
};

export const libraryText = { en, vi };
