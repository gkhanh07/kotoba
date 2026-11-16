import type { Lang } from "@/lib/i18n";

// Plain module, not "use client": the server page reads the title for its metadata.
export const KINDS = ["kana", "kanji", "vocab", "grammar"] as const;
export type LibraryKind = (typeof KINDS)[number];

const vi = {
  title: "Thư viện",
  lede: "Kana, kanji, từ và ngữ pháp ở một chỗ. Lọc theo cấp, theo mục đã học hoặc đã lưu.",
  kindNav: "Loại",
  kinds: { kana: "Kana", kanji: "Kanji", vocab: "Từ vựng", grammar: "Ngữ pháp" } as Record<LibraryKind, string>,
  kanaNote: "Kana dùng chung cho mọi cấp.",
  count: (n: number) => `${n} mục`,
  none: "Không có mục nào khớp bộ lọc.",
};

const en: typeof vi = {
  title: "Library",
  lede: "Kana, kanji, words and grammar in one place. Filter by level, by what you have learnt or saved.",
  kindNav: "Kind",
  kinds: { kana: "Kana", kanji: "Kanji", vocab: "Vocabulary", grammar: "Grammar" },
  kanaNote: "Kana is the same at every level.",
  count: (n) => `${n} ${n === 1 ? "item" : "items"}`,
  none: "Nothing matches this filter.",
};

export const libraryPageText: Record<Lang, typeof vi> = { vi, en };
