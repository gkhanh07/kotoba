export const FLASHCARDS_KEY = "kotoba.flashcards.v1";
export type LearningStatus = "new" | "learning" | "learned";
type Translation = { vi: string; en: string };
export type Flashcard = {
  id: string; word: string; reading: string; pronunciation: string;
  meaning: Translation; example: string; translation: Translation; notes?: Translation;
};

export const flashcards: Flashcard[] = [
  { id: "water", word: "水", reading: "みず", pronunciation: "mizu", meaning: { vi: "Nước", en: "Water" }, example: "水を飲みます。", translation: { vi: "Tôi uống nước.", en: "I drink water." } },
  { id: "book", word: "本", reading: "ほん", pronunciation: "hon", meaning: { vi: "Sách", en: "Book" }, example: "本を読みます。", translation: { vi: "Tôi đọc sách.", en: "I read a book." } },
  { id: "cat", word: "猫", reading: "ねこ", pronunciation: "neko", meaning: { vi: "Mèo", en: "Cat" }, example: "猫がいます。", translation: { vi: "Có một con mèo.", en: "There is a cat." } },
  { id: "station", word: "駅", reading: "えき", pronunciation: "eki", meaning: { vi: "Nhà ga", en: "Station" }, example: "駅はどこですか。", translation: { vi: "Nhà ga ở đâu?", en: "Where is the station?" } },
  { id: "rain", word: "雨", reading: "あめ", pronunciation: "ame", meaning: { vi: "Mưa", en: "Rain" }, example: "雨が降っています。", translation: { vi: "Trời đang mưa.", en: "It is raining." } },
  { id: "friend", word: "友達", reading: "ともだち", pronunciation: "tomodachi", meaning: { vi: "Bạn bè", en: "Friend" }, example: "友達と話します。", translation: { vi: "Tôi nói chuyện với bạn.", en: "I talk with a friend." } },
  { id: "school", word: "学校", reading: "がっこう", pronunciation: "gakkō", meaning: { vi: "Trường học", en: "School" }, example: "学校に行きます。", translation: { vi: "Tôi đi đến trường.", en: "I go to school." }, notes: { vi: "Chữ っ nhỏ tạo một nhịp ngắt trước âm k.", en: "The small っ adds a brief pause before the k sound." } },
  { id: "eat", word: "食べる", reading: "たべる", pronunciation: "taberu", meaning: { vi: "Ăn", en: "To eat" }, example: "パンを食べます。", translation: { vi: "Tôi ăn bánh mì.", en: "I eat bread." }, notes: { vi: "食べます là dạng lịch sự của 食べる.", en: "食べます is the polite form of 食べる." } },
  { id: "today", word: "今日", reading: "きょう", pronunciation: "kyō", meaning: { vi: "Hôm nay", en: "Today" }, example: "今日は暑いです。", translation: { vi: "Hôm nay trời nóng.", en: "It is hot today." } },
  { id: "beautiful", word: "きれい", reading: "きれい", pronunciation: "kirei", meaning: { vi: "Đẹp; sạch sẽ", en: "Beautiful; clean" }, example: "きれいな花ですね。", translation: { vi: "Bông hoa đẹp nhỉ.", en: "What a beautiful flower." }, notes: { vi: "Đây là tính từ đuôi な, dù kết thúc bằng い.", en: "This is a な-adjective, even though it ends in い." } },
  { id: "coffee", word: "コーヒー", reading: "コーヒー", pronunciation: "kōhī", meaning: { vi: "Cà phê", en: "Coffee" }, example: "コーヒーをください。", translation: { vi: "Cho tôi cà phê.", en: "Coffee, please." } },
  { id: "thank-you", word: "ありがとう", reading: "ありがとう", pronunciation: "arigatō", meaning: { vi: "Cảm ơn", en: "Thank you" }, example: "ありがとうございます。", translation: { vi: "Xin cảm ơn bạn.", en: "Thank you very much." }, notes: { vi: "Thêm ございます để nói lịch sự hơn.", en: "Add ございます for a more polite expression." } },
];

export function shuffleCards<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function parseStatuses(raw: string | null): Record<string, LearningStatus> {
  if (!raw) return {};
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid progress");
  return Object.fromEntries(Object.entries(data).filter(([id, status]) =>
    flashcards.some(card => card.id === id) && ["new", "learning", "learned"].includes(status)
  ));
}

export const flashcardText = {
  en: {
    title: "Flashcards", lede: "A word at a time. Recall the meaning, then flip to check.",
    deck: "Everyday Japanese · Starter deck", flip: "Flip card", front: "Show vocabulary",
    hint: "Click or press Enter / Space to flip", reading: "Reading", meaning: "Meaning",
    example: "Example", notes: "Notes", status: "Learning status",
    new: "New", learning: "Learning", learned: "Learned", previous: "Previous",
    next: "Next", shuffle: "Shuffle", restart: "Restart session", progress: "Card progress",
    saved: "Learning status is saved in this browser. Restart keeps your learning status.",
    warning: "Progress could not be read or saved in this browser. You can still study for this session.",
    end: "Last card. Restart or shuffle to practice again.", empty: "No vocabulary in this deck yet.",
    shuffled: "Cards shuffled. Back to the first card.", restarted: "Session restarted.",
  },
  vi: {
    title: "Thẻ từ vựng", lede: "Mỗi lần một từ. Nhớ lại nghĩa, rồi lật thẻ để kiểm tra.",
    deck: "Tiếng Nhật hằng ngày · Bộ từ cơ bản", flip: "Lật thẻ", front: "Xem từ vựng",
    hint: "Nhấn vào thẻ hoặc nhấn Enter / Space để lật", reading: "Cách đọc", meaning: "Nghĩa",
    example: "Ví dụ", notes: "Ghi chú", status: "Trạng thái học",
    new: "Chưa học", learning: "Đang học", learned: "Đã nhớ", previous: "Thẻ trước",
    next: "Thẻ sau", shuffle: "Trộn thẻ", restart: "Học lại từ đầu", progress: "Tiến độ thẻ",
    saved: "Trạng thái học được lưu trên trình duyệt này và giữ lại khi học từ đầu.",
    warning: "Không thể đọc hoặc lưu tiến độ trên trình duyệt này. Bạn vẫn có thể học trong phiên này.",
    end: "Đã đến thẻ cuối. Học lại hoặc trộn thẻ để luyện thêm.", empty: "Bộ thẻ này chưa có từ vựng.",
    shuffled: "Đã trộn thẻ. Bắt đầu từ thẻ đầu tiên.", restarted: "Đã bắt đầu lại phiên học.",
  },
};

