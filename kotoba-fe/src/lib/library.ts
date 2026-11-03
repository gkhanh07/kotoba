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

// One card in the shared review queue. The server fills in labels in the page language.
export const KINDS = ["kana", "kanji", "vocab"] as const;
export type Kind = (typeof KINDS)[number];
export type ReviewRow = { label: string; text: string; ja?: boolean; strong?: boolean; sub?: string };
export type ReviewItem = { id: string; kind: Kind; lesson: number; tag: string; front: string; back: ReviewRow[] };

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
  review: {
    title: "Review",
    lede: "Kana, kanji and words that are due today, in one queue. Recall it, flip to check, then grade yourself honestly.",
    scope: { all: "Everything due", kana: "Kana due", kanji: "Kanji due", vocab: "Words due" } satisfies Record<"all" | Kind, string>,
    scopeLesson: (n: number, title: string) => `Lesson ${n} · ${title}`,
    all: "Review everything",
    kinds: { kana: "Kana", kanji: "Kanji", vocab: "Words" } satisfies Record<Kind, string>,
    left: (n: number, parts: string) => `${n} left${parts ? ` · ${parts}` : ""}`,
    progress: "Queue progress",
    flip: "Show the answer",
    front: "Show the front",
    hint: "Tap to flip",
    recall: { kana: "recall the sound", kanji: "recall Hán Việt, readings and meaning", vocab: "recall the reading and meaning" } satisfies Record<Kind, string>,
    keys: "Space flips · 1 not yet · 2 knew it",
    grade: "Did you remember it?",
    gradeHint: "Flip the card first, then grade yourself.",
    missed: "Not yet",
    knew: "Knew it",
    gradedMiss: (x: string) => `${x}: back at the end of today’s queue.`,
    gradedHit: (x: string, d: number) => `${x}: next review in ${d} ${d === 1 ? "day" : "days"}.`,
    gradedKnown: (x: string) => `${x}: known. It still comes back every 30 days.`,
    done: "Today’s queue is clear.",
    next: (d: number, n: number) => `Next review ${d === 1 ? "tomorrow" : `in ${d} days`}: ${n} ${n === 1 ? "item" : "items"}.`,
    study: (n: number) => `Study lesson ${n}`,
    path: "Open the lesson path",
    dashboard: "Back to the dashboard",
    empty: "Nothing to review yet. Study a lesson to start a review schedule.",
    waiting: "Nothing is due right now.",
    saved: "Your review schedule is saved in this browser.",
    warning: "Progress could not be read or saved in this browser. You can still review for this session.",
    // Card back labels
    romaji: "Romaji", note: "Sound", reading: "Reading", example: "Example",
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
  review: {
    title: "Ôn tập",
    lede: "Kana, kanji và từ vựng đến hạn hôm nay, chung một hàng đợi. Nhớ lại, lật thẻ để kiểm, rồi tự chấm thật lòng.",
    scope: { all: "Mọi mục đến hạn", kana: "Kana đến hạn", kanji: "Kanji đến hạn", vocab: "Từ vựng đến hạn" },
    scopeLesson: (n, title) => `Bài ${n} · ${title}`,
    all: "Ôn tất cả",
    kinds: { kana: "Kana", kanji: "Kanji", vocab: "Từ vựng" },
    left: (n, parts) => `Còn ${n} mục${parts ? ` · ${parts}` : ""}`,
    progress: "Tiến độ hàng đợi",
    flip: "Xem đáp án",
    front: "Xem mặt trước",
    hint: "Chạm để lật",
    recall: { kana: "nhớ cách đọc", kanji: "nhớ Hán Việt, âm và nghĩa", vocab: "nhớ cách đọc và nghĩa" },
    keys: "Phím cách: lật · 1: chưa nhớ · 2: nhớ rồi",
    grade: "Bạn nhớ mục này chưa?",
    gradeHint: "Lật thẻ trước, rồi tự chấm.",
    missed: "Chưa nhớ",
    knew: "Nhớ rồi",
    gradedMiss: (x) => `${x}: quay lại cuối hàng đợi hôm nay.`,
    gradedHit: (x, d) => `${x}: ôn lại sau ${d} ngày.`,
    gradedKnown: (x) => `${x}: đã thuộc. Cứ 30 ngày sẽ quay lại một lần.`,
    done: "Xong hàng đợi hôm nay.",
    next: (d, n) => `Lần ôn tới: ${d === 1 ? "ngày mai" : `${d} ngày nữa`}, ${n} mục.`,
    study: (n) => `Học bài ${n}`,
    path: "Xem lộ trình bài học",
    dashboard: "Về bảng điều khiển",
    empty: "Chưa có gì để ôn. Học một bài để bắt đầu lịch ôn.",
    waiting: "Hiện chưa có mục nào đến hạn.",
    saved: "Lịch ôn được lưu trên trình duyệt này.",
    warning: "Không thể đọc hoặc lưu tiến độ trên trình duyệt này. Bạn vẫn có thể ôn trong phiên này.",
    romaji: "Romaji", note: "Cách phát âm", reading: "Cách đọc", example: "Ví dụ",
  },
};

export const libraryText = { en, vi };
