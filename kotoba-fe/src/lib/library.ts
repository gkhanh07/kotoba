// Kanji, grammar and lesson shapes as kotoba-be serves them, and the text of the library and lesson pages. Client-safe.
import type { Goal } from "./account";
import type { Vocab } from "./flashcards";
import type { Lang } from "./i18n";
import type { Kana } from "./kana";
import { isLearned, type Srs } from "./srs";

type Translation = { vi: string; en: string };

// JLPT levels, easiest first. Content items carry one (phase 22); pages show one at a time.
export const LEVELS = [5, 4, 3, 2] as const;
export type Level = (typeof LEVELS)[number];
const first = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : q);
// Anything that is not a known level (missing, "x", "6", "05") is N5, never an error.
export const levelOf = (q: string | string[] | undefined): Level => LEVELS.find((l) => String(l) === first(q)) ?? 5;
export const levelLabel = (l: Level): string => `N${l}`;
// ?page= as a positive integer; anything else is page 1.
export const pageOf = (q: string | string[] | undefined): number => {
  const v = first(q);
  // Any well-formed page number counts, however large, so every page past the end is the same 404.
  return v !== undefined && /^[1-9]\d*$/.test(v) ? Math.min(Number(v), Number.MAX_SAFE_INTEGER) : 1;
};
// A list URL with the given query params; undefined and empty values are left out.
export const listHref = (path: string, params: Record<string, string | number | undefined>): string => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const text = qs.toString();
  return text ? `${path}?${text}` : path;
};
// kotoba-be's answer to ?page=.
export type Paged<T> = { items: T[]; page: number; pages: number; total: number };
export type Lesson = { id: string; lesson: number; level: Level; title: Translation };
export type Kanji = {
  id: string; // "kanji:日"
  char: string;
  hv: string[]; // Hán Việt, most common first; empty for a Japanese-made kanji (ADR 009)
  on: string[];
  kun: string[];
  en: string[];
  strokes: number;
  vi?: string;
  lesson: number;
  similar?: string[]; // look-alike kanji (phase 19)
  level: Level;
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
  level: Level;
};
// One /search result; the BE tags each item with its kind.
export type Hit = { level: Level } & (({ kind: "vocab" } & Vocab) | ({ kind: "kanji" } & Kanji) | ({ kind: "grammar" } & Grammar) | ({ kind: "kana" } & Kana) | ({ kind: "lesson" } & Lesson));

// One card in the shared review queue. The server fills in labels in the page language.
export const KINDS = ["kana", "kanji", "vocab"] as const;
export type Kind = (typeof KINDS)[number];
export type ReviewRow = { label: string; text: string; ja?: boolean; strong?: boolean; sub?: string };
export type ReviewItem = { id: string; kind: Kind; lesson: number; tag: string; front: string; back: ReviewRow[]; meaning?: string; reading?: string };
export const hvRows = (hv: string[], label: string): ReviewRow[] => (hv.length ? [{ label, text: hv.join(" · "), strong: true }] : []);
export const kanjiTitle = (k: Pick<Kanji, "char" | "hv">): string => [k.char, ...(k.hv.length ? [k.hv.join(", ")] : []), "Kotoba"].join(" · ");

// Direction a card is asked in (phase 17). The SRS schedule stays one per item.
export type Dir = "word-meaning" | "meaning-word" | "word-reading";
export type PromptSource = { kind: Kind; word: string; reading?: string; meaning: string };
export type Prompt = { dir: Dir; front: string; frontIsJa: boolean };

export function prompt(src: PromptSource, rand: () => number): Prompt {
  const dirs: Dir[] = src.kind === "kana" ? ["word-meaning"] : ["word-meaning", "meaning-word"];
  if (src.kind === "vocab" && src.reading !== undefined && src.reading !== src.word) dirs.push("word-reading");
  const dir = dirs[Math.min(Math.floor(rand() * dirs.length), dirs.length - 1)];
  return dir === "meaning-word" ? { dir, front: src.meaning, frontIsJa: false } : { dir, front: src.word, frontIsJa: true };
}

// Word detail page (phase 19). The id suffix is the word itself (`vocab:<word>`).
export const vocabHref = (word: string) => `/vocab/${encodeURIComponent(word)}`;
// Distinct kanji of the written word that the course teaches, in order. Kana and other kanji are skipped.
export const kanjiIn = (word: string, taught: ReadonlySet<string>): string[] => [...new Set([...word].filter((c) => taught.has(c)))];

// A study day key as d/m/yyyy, the way the dashboard writes dates. Pure string work: no time zone involved.
export const formatDay = (day: string): string => {
  const [y, m, d] = day.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
};

// A lesson's scheduled items (kana, kanji, words), in lesson order. Grammar is read, not scheduled.
export type Stop = { lesson: number; ids: string[] };

// What a goal covers: its level and every easier one, since JLPT is cumulative (ADR 007). No goal: everything.
export function goalScope<T extends { level: number }>(items: readonly T[], goal?: Goal): T[] {
  const hardest = goal ? Number(goal.slice(1)) : 0;
  return items.filter((item) => item.level >= hardest);
}

export function stopsOf(items: { id: string; lesson: number }[]): Stop[] {
  const byLesson = new Map<number, string[]>();
  for (const i of items) byLesson.set(i.lesson, [...(byLesson.get(i.lesson) ?? []), i.id]);
  return [...byLesson].sort(([a], [b]) => a - b).map(([lesson, ids]) => ({ lesson, ids }));
}

// The lesson being studied: the first one started but not finished, else the first one not finished.
// Lesson numbers run on across levels, so finishing N5 moves on to N4 by itself.
export function currentLesson(stops: Stop[], srs: Srs): number | undefined {
  const learned = (p: Stop) => p.ids.filter((id) => isLearned(srs, id)).length;
  const open = stops.filter((p) => p.ids.length > 0 && learned(p) < p.ids.length);
  return (open.find((p) => learned(p) > 0) ?? open[0])?.lesson;
}

export const FILTERS = ["all", "learned", "new"] as const;
export type Filter = (typeof FILTERS)[number];

const en = {
  kanji: {
    title: (l: string) => `${l} kanji`,
    lede: (n: number) => `${n} kanji, ordered by lesson. Tap one for its readings, Hán Việt and the words that use it.`,
    filter: "Show",
    filters: { all: "All", learned: "Learned", new: "Not started" } satisfies Record<Filter, string>,
    lesson: (n: number, title: string) => `Lesson ${n} · ${title}`,
    none: "No kanji here yet.",
    back: "Kanji",
    hv: "Hán Việt", on: "On reading", kun: "Kun reading", meaning: "Meaning", strokes: "Strokes", lessonLabel: "Lesson",
    noVi: "No Vietnamese meaning yet",
    noHv: "Japanese-made kanji: no Hán Việt reading",
    words: "Words with",
    study: (n: number) => `Study lesson ${n}`,
    speak: "Play",
    similar: "Easily confused with",
  },
  vocab: {
    title: (l: string) => `${l} vocabulary`,
    lede: "Each lesson is a deck. Study one, or review every word that is due.",
    decks: "Decks",
    lesson: (n: number) => `Lesson ${n}`,
    count: (n: number) => `${n} words`,
    stats: (learned: number, due: number) => `${learned} learned · ${due} due`,
    fresh: "Not started",
    review: (n: number) => `Review ${n} due ${n === 1 ? "word" : "words"}`,
    next: "Study the next deck",
    back: "Vocabulary",
    reading: "Reading", romaji: "Romaji", meaning: "Meaning", kanjiForm: "Kanji spelling", lessonLabel: "Lesson",
    example: "Example", notes: "Notes", kanji: "Kanji in this word", speak: "Play",
    study: (n: number) => `Study lesson ${n}`,
    schedule: "Review schedule",
    box: (b: number, max: number) => `Box ${b}/${max}`,
    known: "known",
    dueToday: "due today",
    due: (day: string) => `due ${day}`,
    lapses: (n: number) => `wrong ${n} ${n === 1 ? "time" : "times"}`,
  },
  grammar: {
    title: (l: string) => `${l} grammar`,
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
    state: { done: "Done", started: "In progress", fresh: "Not started" },
    doneOf: (x: number, y: number) => `${x}/${y} lessons done`,
    levelProgress: (level: string) => `${level} lessons done`,
    current: "Current lesson",
    preview: "Selected",
    openKanji: "Open the kanji page",
    progress: "Lesson progress",
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
    daily: (n: number) => `Due items and new items from lesson ${n}`,
    all: "Review everything",
    kinds: { kana: "Kana", kanji: "Kanji", vocab: "Words" } satisfies Record<Kind, string>,
    left: (n: number, parts: string) => `${n} left${parts ? ` · ${parts}` : ""}`,
    progress: "Queue progress",
    flip: "Show the answer",
    front: "Show the front",
    hint: "Tap to flip",
    recall: { kana: "recall the sound", "word-meaning": "recall the meaning", "meaning-word": "recall the Japanese", "word-reading": "recall the reading" } satisfies Record<"kana" | Dir, string>,
    keys: "Space flips · 1 not yet · 2 knew it",
    grade: "Did you remember it?",
    gradeHint: "Flip the card first, then grade yourself.",
    missed: "Not yet",
    knew: "Knew it",
    gradedMiss: (x: string) => `${x}: back at the end of today’s queue.`,
    gradedHit: (x: string, d: number) => `${x}: next review in ${d} ${d === 1 ? "day" : "days"}.`,
    gradedKnown: (x: string) => `${x}: known. It still comes back every 30 days.`,
    done: "Today’s queue is clear.",
    stats: (n: number, pct: number, min: number) => `${n} ${n === 1 ? "item" : "items"} · ${pct}% right first time · ${min} min`,
    next: (d: number, n: number) => `Next review ${d === 1 ? "tomorrow" : `in ${d} days`}: ${n} ${n === 1 ? "item" : "items"}.`,
    study: (n: number) => `Study lesson ${n}`,
    path: "Open the lesson path",
    dashboard: "Back to the dashboard",
    weakEmpty: "Nothing is often wrong yet",
    empty: "Nothing to review yet. Study a lesson to start a review schedule.",
    waiting: "Nothing is due right now.",
    saved: "Your review schedule is saved in this browser and syncs when you sign in.",
    warning: "Progress could not be read or saved in this browser. You can still review for this session.",
    // Card back labels
    romaji: "Romaji", note: "Sound", reading: "Reading", example: "Example",
  },
  levels: {
    nav: "JLPT level",
    empty: (l: string) => `No ${l} content yet.`,
    prev: "Previous page",
    next: "Next page",
    pages: "Pages",
    page: (x: number, y: number) => `Page ${x} / ${y}`,
  },
  search: {
    title: "Search",
    lede: "Look up kana, kanji, words, grammar and lessons. Type Japanese, romaji, Vietnamese or English; accents are optional.",
    label: "Search the course",
    submit: "Search",
    try: "Try:",
    none: (q: string) => `Nothing matches “${q}”. Try a shorter part of the word, or its romaji.`,
    found: (n: number, q: string) => `${n} ${n === 1 ? "result" : "results"} for “${q}”`,
    lesson: (n: number) => `Lesson ${n}`,
    more: "Each kind shows its first 20 results. Type more of the word to narrow the list.",
    kinds: { vocab: "Words", kanji: "Kanji", grammar: "Grammar", kana: "Kana", lesson: "Lessons" } satisfies Record<Hit["kind"], string>,
  },
};

const vi: typeof en = {
  kanji: {
    title: (l) => `Kanji ${l}`,
    lede: (n) => `${n} chữ, xếp theo bài học. Chạm một chữ để xem âm đọc, Hán Việt và từ chứa nó.`,
    filter: "Lọc",
    filters: { all: "Tất cả", learned: "Đã học", new: "Chưa học" },
    lesson: (n, title) => `Bài ${n} · ${title}`,
    none: "Chưa có chữ nào ở đây.",
    back: "Kanji",
    hv: "Hán Việt", on: "Âm On", kun: "Âm Kun", meaning: "Nghĩa", strokes: "Số nét", lessonLabel: "Bài",
    noVi: "Chưa có nghĩa tiếng Việt",
    noHv: "Chữ do Nhật tạo, không có âm Hán Việt",
    words: "Từ chứa",
    study: (n) => `Học bài ${n}`,
    speak: "Đọc",
    similar: "Dễ nhầm với",
  },
  vocab: {
    title: (l) => `Từ vựng ${l}`,
    lede: "Mỗi bài học là một bộ thẻ. Học một bộ hoặc ôn tất cả từ đến hạn.",
    decks: "Các bộ từ",
    lesson: (n) => `Bài ${n}`,
    count: (n) => `${n} từ`,
    stats: (learned, due) => `${learned} đã học · ${due} đến hạn`,
    fresh: "Chưa học",
    review: (n) => `Ôn ${n} từ đến hạn`,
    next: "Học bài tiếp",
    back: "Từ vựng",
    reading: "Cách đọc", romaji: "Romaji", meaning: "Nghĩa", kanjiForm: "Cách viết kanji", lessonLabel: "Bài",
    example: "Ví dụ", notes: "Ghi chú", kanji: "Kanji trong từ", speak: "Đọc",
    study: (n) => `Học bài ${n}`,
    schedule: "Lịch ôn",
    box: (b, max) => `Hộp ${b}/${max}`,
    known: "đã thuộc",
    dueToday: "đến hạn hôm nay",
    due: (day) => `đến hạn ${day}`,
    lapses: (n) => `sai ${n} lần`,
  },
  grammar: {
    title: (l) => `Ngữ pháp ${l}`,
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
    state: { done: "Đã xong", started: "Đang học", fresh: "Chưa học" },
    doneOf: (x, y) => `${x}/${y} bài xong`,
    levelProgress: (level) => `Số bài ${level} đã xong`,
    current: "Bài hiện tại",
    preview: "Đang chọn",
    openKanji: "Mở trang kanji",
    progress: "Tiến độ bài",
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
    daily: (n) => `Mục đến hạn và mục mới của bài ${n}`,
    all: "Ôn tất cả",
    kinds: { kana: "Kana", kanji: "Kanji", vocab: "Từ vựng" },
    left: (n, parts) => `Còn ${n} mục${parts ? ` · ${parts}` : ""}`,
    progress: "Tiến độ hàng đợi",
    flip: "Xem đáp án",
    front: "Xem mặt trước",
    hint: "Chạm để lật",
    recall: { kana: "nhớ cách đọc", "word-meaning": "nhớ nghĩa", "meaning-word": "nhớ từ tiếng Nhật", "word-reading": "nhớ cách đọc" },
    keys: "Phím cách: lật · 1: chưa nhớ · 2: nhớ rồi",
    grade: "Bạn nhớ mục này chưa?",
    gradeHint: "Lật thẻ trước, rồi tự chấm.",
    missed: "Chưa nhớ",
    knew: "Nhớ rồi",
    gradedMiss: (x) => `${x}: quay lại cuối hàng đợi hôm nay.`,
    gradedHit: (x, d) => `${x}: ôn lại sau ${d} ngày.`,
    gradedKnown: (x) => `${x}: đã thuộc. Cứ 30 ngày sẽ quay lại một lần.`,
    done: "Xong hàng đợi hôm nay.",
    stats: (n, pct, min) => `${n} mục · đúng ${pct}% ngay lần đầu · ${min} phút`,
    next: (d, n) => `Lần ôn tới: ${d === 1 ? "ngày mai" : `${d} ngày nữa`}, ${n} mục.`,
    study: (n) => `Học bài ${n}`,
    path: "Xem lộ trình bài học",
    dashboard: "Về bảng điều khiển",
    weakEmpty: "Chưa có mục nào hay sai",
    empty: "Chưa có gì để ôn. Học một bài để bắt đầu lịch ôn.",
    waiting: "Hiện chưa có mục nào đến hạn.",
    saved: "Lịch ôn được lưu trên trình duyệt này và đồng bộ khi bạn đăng nhập.",
    warning: "Không thể đọc hoặc lưu tiến độ trên trình duyệt này. Bạn vẫn có thể ôn trong phiên này.",
    romaji: "Romaji", note: "Cách phát âm", reading: "Cách đọc", example: "Ví dụ",
  },
  levels: {
    nav: "Cấp độ JLPT",
    empty: (l) => `Chưa có nội dung ${l}.`,
    prev: "Trước",
    next: "Sau",
    pages: "Phân trang",
    page: (x, y) => `Trang ${x} / ${y}`,
  },
  search: {
    title: "Tra cứu",
    lede: "Tra kana, kanji, từ vựng, ngữ pháp và bài học. Gõ tiếng Nhật, romaji, tiếng Việt hoặc tiếng Anh, không cần dấu.",
    label: "Tra cứu trong khoá học",
    submit: "Tra",
    try: "Thử:",
    none: (q) => `Không có kết quả cho “${q}”. Thử gõ ngắn hơn, hoặc gõ romaji.`,
    found: (n, q) => `${n} kết quả cho “${q}”`,
    lesson: (n) => `Bài ${n}`,
    more: "Mỗi loại chỉ hiện 20 kết quả đầu. Gõ thêm để thu hẹp danh sách.",
    kinds: { vocab: "Từ vựng", kanji: "Kanji", grammar: "Ngữ pháp", kana: "Kana", lesson: "Bài học" },
  },
};

export const libraryText = { en, vi };

// Dashboard block "often wrong" (phase 16).
const weakVi = { title: "Hay sai", times: (n: number) => `sai ${n} lần`, review: "Ôn các mục này" };
export const weakText: Record<Lang, typeof weakVi> = {
  vi: weakVi,
  en: { title: "Often wrong", times: (n) => `wrong ${n} ${n === 1 ? "time" : "times"}`, review: "Review these" },
};
