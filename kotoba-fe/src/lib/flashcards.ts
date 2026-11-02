// Vocabulary as kotoba-be serves it (content/vocab.json), and the flashcard page's text. Client-safe.
type Translation = { vi: string; en: string };
export type Vocab = {
  id: string; // "vocab:水"
  word: string;
  kanji?: string; // set when the word is usually written in kana but has a non-N5 kanji form
  reading: string;
  romaji: string;
  vi: string;
  en: string;
  example: { ja: string } & Translation;
  notes?: Translation;
  lesson: number;
};

export function shuffleCards<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const en = {
  title: "Flashcards", lede: "A word at a time. Recall the meaning, flip to check, then say honestly whether you knew it.",
  deck: "All N5 words", speak: "Play", flip: "Flip card", front: "Show vocabulary",
  hint: "Click or press Enter / Space to flip", reading: "Reading", meaning: "Meaning",
  example: "Example", notes: "Notes", grade: "Did you know it?", gradeHint: "Flip the card first, then grade yourself.",
  missed: "Not yet", knew: "I knew it", previous: "Previous",
  next: "Next", shuffle: "Shuffle", restart: "Restart session", progress: "Card progress",
  stateNone: "New", stateDue: "Due for review", stateKnown: "Known",
  stateLater: (days: number) => (days === 1 ? "Review tomorrow" : `Review in ${days} days`),
  gradedMiss: (word: string) => `${word} will come back today.`,
  gradedEarly: (word: string) => `${word} was not due yet, so its schedule stays.`,
  gradedKnown: (word: string) => `You know ${word} now.`,
  gradedHit: (word: string, days: number) => `${word}: next review ${days === 1 ? "tomorrow" : `in ${days} days`}.`,
  saved: "Your review schedule is saved in this browser. Restart only changes the order.",
  warning: "Progress could not be read or saved in this browser. You can still study for this session.",
  lesson: (n: number, title: string) => `Lesson ${n} · ${title}`,
  end: "Last card. Restart or shuffle to practice again.", empty: "No vocabulary in this deck yet.",
  shuffled: "Cards shuffled. Back to the first card.", restarted: "Session restarted.",
};

const vi: typeof en = {
  title: "Thẻ từ vựng", lede: "Mỗi lần một từ. Nhớ lại nghĩa, lật thẻ để kiểm tra, rồi tự chấm thật lòng.",
  deck: "Tất cả từ N5", speak: "Đọc", flip: "Lật thẻ", front: "Xem từ vựng",
  hint: "Nhấn vào thẻ hoặc nhấn Enter / Space để lật", reading: "Cách đọc", meaning: "Nghĩa",
  example: "Ví dụ", notes: "Ghi chú", grade: "Bạn nhớ từ này chưa?", gradeHint: "Lật thẻ trước, rồi tự chấm.",
  missed: "Chưa nhớ", knew: "Nhớ rồi", previous: "Thẻ trước",
  next: "Thẻ sau", shuffle: "Trộn thẻ", restart: "Học lại từ đầu", progress: "Tiến độ thẻ",
  stateNone: "Chưa học", stateDue: "Đến hạn ôn", stateKnown: "Đã thuộc",
  stateLater: (days) => (days === 1 ? "Ôn lại ngày mai" : `Ôn lại sau ${days} ngày`),
  gradedMiss: (word) => `${word} sẽ quay lại trong hôm nay.`,
  gradedEarly: (word) => `${word} chưa đến hạn nên lịch ôn giữ nguyên.`,
  gradedKnown: (word) => `Bạn đã thuộc ${word}.`,
  gradedHit: (word, days) => `${word}: ôn lại ${days === 1 ? "ngày mai" : `sau ${days} ngày`}.`,
  saved: "Lịch ôn được lưu trên trình duyệt này. Học lại từ đầu chỉ đổi thứ tự thẻ.",
  warning: "Không thể đọc hoặc lưu tiến độ trên trình duyệt này. Bạn vẫn có thể học trong phiên này.",
  lesson: (n, title) => `Bài ${n} · ${title}`,
  end: "Đã đến thẻ cuối. Học lại hoặc trộn thẻ để luyện thêm.", empty: "Bộ thẻ này chưa có từ vựng.",
  shuffled: "Đã trộn thẻ. Bắt đầu từ thẻ đầu tiên.", restarted: "Đã bắt đầu lại phiên học.",
};

export const flashcardText = { en, vi };
