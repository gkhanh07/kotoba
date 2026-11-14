// UI strings for both interface languages. Plain module, no next/headers:
// server components and client components both import it directly, like kana.ts.
// Cookie reading lives in app/LangSwitch.tsx (server) and clientLang() below.

import type { Group } from "./kana";

export type Lang = "vi" | "en";

export function isLang(v: unknown): v is Lang {
  return v === "vi" || v === "en";
}

export const LANG_COOKIE = "kotoba.lang";

// Sign words on the landing street; the union keeps meanings complete in both languages.
export type SignWord = "ラーメン" | "くすり" | "カラオケ" | "すし" | "ホテル";

// Sentences broken by inline JSX (kbd, span lang="ja", strong) come back in pieces
// instead of one string, so the markup stays where it belongs.
type Split3 = { a: string; b: string; c: string };
type Split4 = { a: string; b: string; c: string; d: string };

type Dict = {
  nav: { home: string; main: string; chart: string; quiz: string; lang: string; login: string; logout: string; menu: string; library: string; kana: string; kanji: string; vocab: string; grammar: string; lessons: string; review: string; reviewDue: string; test: string; search: string; settings: string; sync: { saved: string; saving: string; pending: (n: number) => string; failed: string; retry: string } };
  footer: { kanji: string; dict: string; legal: string };
  notFound: { title: string; body: string; home: string };
  down: { title: string; body: string; retry: string };
  meta: { rootTitle: string; rootDesc: string; kanaTitle: string; kanaDesc: string };
  home: {
    h1a: string;
    h1b: string;
    lede: string;
    ctaQuiz: string;
    ctaChart: string;
    routeH: string;
    routeP: string;
    hiraganaText: Split3;
    katakanaText: Split3;
    kanjiText: string;
    kanaCount: (total: number, basic: number) => string;
    kanjiCount: (total: number, levels: string) => string;
    lineH: string;
    lineP: string;
    lineStation: (lessons: number) => string;
    lineWords: string;
    lineGrammar: string;
    ladderLabel: string;
    ladderHit: (n: number) => string;
    ladderWait: (days: number) => string;
    ladderMiss: string;
    stateFresh: string;
    stateLearned: string;
    stateKnown: string;
    previewH: string;
    previewP: (lesson: number, title: string) => string;
    previewCard: string;
    previewOpen: (lesson: number) => string;
    closingH: string;
    closingP: string;
    honestH: string;
    honestP1: (known: number, intervals: string) => string;
    honestP2: Split4;
    honestCta: string;
    lampMastered: string;
    lampLearning: string;
    lampUnseen: string;
    lampAria: (lit: number, max: number) => string;
    lampCaption: (known: number) => string;
    footerA: string;
    footerB: string;
  };
  street: {
    signsAria: string;
    signMeaning: (meaning: string) => string;
    meanings: Record<SignWord, string>;
    longMark: string;
    reads: (romaji: string) => string;
    scriptNote: Record<"Hiragana" | "Katakana", string>;
    tapMore: string;
  };
  kana: {
    titleChart: (name: string) => string;
    titleQuiz: (name: string) => string;
    ledeChart: Record<Group, string>;
    ledeQuiz: string;
    scriptNav: string;
    groupNav: string;
    groups: Record<Group, string>;
    modeNav: string;
    progressAria: string;
    masteredA: string;
    masteredB: (total: number, name: string) => string;
    storageWarn: string;
    loadingProgress: string;
    reset: (name: string) => string;
    resetArmed: (name: string) => string;
    chartAria: (name: string) => string;
    cellReads: string;
    hintLabel: string;
    noteLabel: string;
    levelLabel: string;
    levelDone: string;
    levelDue: string;
    levelLearning: (days: number) => string;
    levelNone: string;
    practiceThis: string;
    lampsAria: (lit: number, max: number) => string;
    extraNote: string;
    practiceOther: (name: string) => string;
    backToChart: string;
    ask: string;
    rightMastered: (char: string) => string;
    right: (romaji: string, days: number) => string;
    rightExtra: (romaji: string) => string;
    wrong: (char: string, romaji: string, hint?: string) => string;
    nextChar: string;
    session: (right: number, total: number) => string;
  };
  status: { loading: string; errorBody: string; retry: string; home: string };
};

const DICT: Record<Lang, Dict> = {
  vi: {
    nav: {
      home: ", trang chủ",
      main: "Điều hướng chính",
      chart: "Bảng chữ",
      quiz: "Luyện tập",
      lang: "Ngôn ngữ",
      login: "Đăng nhập",
      logout: "Đăng xuất",
      menu: "Danh mục",
      library: "Thư viện",
      kana: "Bảng chữ cái",
      kanji: "Kanji",
      vocab: "Từ vựng",
      grammar: "Ngữ pháp",
      lessons: "Bài học",
      review: "Ôn tập",
      reviewDue: "mục đến hạn",
      test: "Thi thử",
      search: "Tra cứu",
      settings: "Cài đặt tài khoản",
      sync: { saved: "Đã lưu", saving: "Đang lưu…", pending: (n) => `Chờ lưu ${n} thay đổi`, failed: "Lỗi đồng bộ", retry: "Thử lại" },
    },
    footer: { kanji: "Dữ liệu kanji", dict: "Từ điển", legal: "Điều khoản và quyền riêng tư" },
    notFound: {
      title: "Không tìm thấy trang · Kotoba",
      body: "Trang bạn tìm không tồn tại.",
      home: "Về trang chủ",
    },
    down: {
      title: "Không thể kết nối máy chủ",
      body: "Không kết nối được với máy chủ. Tiến độ của bạn vẫn được lưu trên thiết bị này.",
      retry: "Thử lại",
    },
    meta: {
      rootTitle: "Kotoba · Học tiếng Nhật cho người Việt",
      rootDesc:
        "Đọc được biển hiệu Tokyo, từng chữ một. Bảng hiragana, katakana và bài luyện nhận mặt chữ bằng tiếng Việt, không cần đăng ký.",
      kanaTitle: "Bảng chữ và luyện kana · Kotoba",
      kanaDesc:
        "Bảng hiragana, katakana kèm cách đọc gần giống tiếng Việt và bài luyện nhận mặt chữ, không cần đăng ký.",
    },
    home: {
      h1a: "Đọc biển hiệu Tokyo,",
      h1b: "từng chữ một.",
      lede: "Học tiếng Nhật bằng tiếng Việt, bắt đầu từ những chữ kana trên biển hiệu. Luyện tập ngay tại đây, không cần đăng ký.",
      ctaQuiz: "Luyện đọc ngay",
      ctaChart: "Xem bảng chữ",
      routeH: "Ba loại chữ trong tiếng Nhật.",
      routeP: "Tiếng Nhật sử dụng ba loại chữ. Nếu mới bắt đầu, bạn nên học hai bảng kana: cùng một hệ thống âm nhưng khác cách viết. Mỗi bảng gồm chữ cơ bản, âm đục, âm ghép, âm ngắt và trường âm.",
      hiraganaText: { a: "Nét mềm, dùng cho từ thuần Nhật và đuôi ngữ pháp, như ", b: " hay ", c: "." },
      katakanaText: { a: "Nét thẳng, góc cạnh, dùng cho từ mượn và tên nước ngoài, như ", b: " hay ", c: "." },
      kanjiText: "Chữ Hán trong tiếng Nhật, giúp thể hiện nghĩa của từ. Mỗi chữ có âm Hán Việt, số nét và các từ có chứa chữ đó.",
      kanaCount: (total, basic) => `${total} chữ · ${basic} chữ cơ bản`,
      kanjiCount: (total, levels) => `${total} chữ · ${levels}`,
      lineH: "Lộ trình học, bắt đầu từ N5.",
      lineP: "Từ vựng, kanji và ngữ pháp được sắp xếp theo bài học và cấp độ JLPT. Phiên học hằng ngày bám theo bài bạn đang học.",
      lineStation: (lessons) => `${lessons} bài`,
      lineWords: "Từ vựng",
      lineGrammar: "Ngữ pháp",
      ladderLabel: "Các lần ôn đúng liên tiếp của một chữ",
      ladderHit: (n) => `Lần ${n}`,
      ladderWait: (days) => `ôn lại sau ${days} ngày`,
      ladderMiss: "Trả lời sai một lần, bạn sẽ ôn lại chữ đó từ đầu, ngay trong ngày.",
      stateFresh: "Chưa học",
      stateLearned: "Đã học",
      stateKnown: "Đã thuộc",
      previewH: "Xem trước một bài học.",
      previewP: (lesson, title) => `Bài ${lesson}: ${title}. Xem từ vựng, kanji, mẫu ngữ pháp và một thẻ ôn tập trong bài.`,
      previewCard: "Mặt sau thẻ ôn tập",
      previewOpen: (lesson) => `Mở bài ${lesson}`,
      closingH: "Bắt đầu từ chữ đầu tiên.",
      closingP: "Không cần tài khoản. Chọn đáp án bằng bàn phím hoặc màn hình cảm ứng. Tiến độ được lưu ngay trên thiết bị này.",
      honestH: "Chỉ tính là thuộc khi bạn nhớ thật.",
      honestP1: (known, intervals) => `Một chữ được tính là đã thuộc sau ${known} lần ôn đúng liên tiếp, với các khoảng cách ôn là ${intervals} ngày. Nếu trả lời sai, số lần đúng liên tiếp được tính lại từ đầu. Không có điểm thưởng hay huy hiệu, tiến độ phản ánh những chữ bạn đọc được.`,
      honestP2: { a: "Bạn có thể luyện hoàn toàn bằng bàn phím: dùng phím ", b: "–", c: " để chọn đáp án, ", d: " để sang chữ tiếp theo. Tiến độ được lưu ngay và đồng bộ khi bạn đăng nhập." },
      honestCta: "Bắt đầu với hiragana",
      lampMastered: "Đã thuộc",
      lampLearning: "Đang học",
      lampUnseen: "Chưa gặp",
      lampAria: (lit, max) => `${lit} trên ${max} lần ôn đúng liên tiếp`,
      lampCaption: (known) => `Khi đủ ${known} đèn sáng, chữ đó được tính là đã thuộc.`,
      footerA: "Kotoba: học tiếng Nhật bằng tiếng Việt.",
      footerB: "Không cần tài khoản để luyện tập. Đăng nhập để đồng bộ tiến độ giữa các thiết bị.",
    },
    street: {
      signsAria: "Chọn biển hiệu để xem cách đọc",
      signMeaning: (meaning) => `, ${meaning}`,
      meanings: {
        "ラーメン": "Mì ramen",
        "くすり": "Thuốc, hiệu thuốc",
        "カラオケ": "Karaoke",
        "すし": "Sushi",
        "ホテル": "Khách sạn",
      },
      longMark: "kéo dài",
      reads: (romaji) => `đọc là “${romaji}”`,
      scriptNote: {
        Katakana: "Katakana: dùng cho từ mượn tiếng nước ngoài.",
        Hiragana: "Hiragana: dùng cho từ thuần Nhật.",
      },
      tapMore: "Chọn biển hiệu khác để đọc tiếp.",
    },
    kana: {
      titleChart: (name) => `Bảng ${name}`,
      titleQuiz: (name) => `Luyện ${name}`,
      ledeChart: {
        basic: "Các chữ cơ bản, xếp theo hàng âm. Chọn một chữ để xem cách đọc gần giống tiếng Việt.",
        dakuten: "Khi thêm dấu ゛ hoặc ゜ vào chữ cơ bản, âm đọc thay đổi: k thành g, s thành z, t thành d, h thành b hoặc p.",
        yoon: "Chữ ở cột i ghép với ya, yu, yo viết nhỏ và được đọc liền trong một nhịp.",
        special: "Chữ っ viết nhỏ tạo một nhịp ngắt trước phụ âm tiếp theo; nguyên âm dài được giữ trong hai nhịp. Luyện đọc qua các từ ví dụ.",
      },
      ledeQuiz: "Nhìn chữ, chọn cách đọc. Phím 1–4 để chọn, Enter để sang chữ tiếp theo.",
      scriptNav: "Bảng chữ",
      groupNav: "Nhóm chữ",
      groups: { basic: "Cơ bản", dakuten: "Âm đục", yoon: "Âm ghép", special: "Âm ngắt, trường âm" },
      modeNav: "Chế độ",
      progressAria: "Tiến độ",
      masteredA: "Đã học ",
      masteredB: (total, name) => ` / ${total} chữ ${name}`,
      storageWarn: "Trình duyệt không cho phép lưu dữ liệu. Bạn vẫn có thể luyện tập, nhưng tiến độ sẽ mất khi tải lại trang.",
      loadingProgress: "Đang tải tiến độ của bạn…",
      reset: (name) => `Xóa tiến độ ${name}`,
      resetArmed: (name) => `Chọn lần nữa để xóa tiến độ ${name}`,
      chartAria: (name) => `Bảng ${name}`,
      cellReads: ", đọc là ",
      hintLabel: "Đọc gần giống",
      noteLabel: "Nghĩa và cách đọc",
      levelLabel: "Mức độ ghi nhớ",
      levelDone: "Đã thuộc",
      levelDue: "Đến hạn ôn",
      levelLearning: (days) => `Đang học, ôn lại ${days === 1 ? "ngày mai" : `sau ${days} ngày`}`,
      levelNone: "Chưa luyện",
      practiceThis: "Luyện bảng này",
      lampsAria: (lit, max) => `${lit} trên ${max} lần ôn đúng liên tiếp`,
      extraNote: "Bạn đã học tất cả các chữ trong nhóm và chưa có chữ nào đến hạn ôn. Khi luyện thêm, trả lời đúng sẽ giữ nguyên lịch ôn; trả lời sai sẽ đưa chữ đó vào lịch ôn hôm nay.",
      practiceOther: (name) => `Luyện ${name}`,
      backToChart: "Xem lại bảng chữ",
      ask: "Chữ này đọc là gì?",
      rightMastered: (char) => `Đúng rồi. Bạn đã thuộc chữ ${char}.`,
      right: (romaji, days) => `Đúng rồi, “${romaji}”. Ôn lại ${days === 1 ? "ngày mai" : `sau ${days} ngày`}.`,
      rightExtra: (romaji) => `Đúng rồi, “${romaji}”. Chữ này chưa đến hạn nên lịch ôn giữ nguyên.`,
      wrong: (char, romaji, hint) => `Chưa đúng. ${char} đọc là “${romaji}”${hint ? `, gần giống “${hint}”` : ""}. Chữ này sẽ quay lại trong hôm nay.`,
      nextChar: "Chữ tiếp theo",
      session: (right, total) => `Phiên này: ${right}/${total} đúng`,
    },
    status: {
      loading: "Đang tải bảng chữ…",
      errorBody: "Không tải được bảng chữ. Kiểm tra kết nối mạng rồi thử lại.",
      retry: "Thử lại",
      home: "Về trang chủ",
    },
  },

  en: {
    nav: {
      home: ", home",
      main: "Main",
      chart: "Chart",
      quiz: "Practice",
      lang: "Language",
      login: "Log in",
      logout: "Log out",
      menu: "Menu",
      library: "Library",
      kana: "Kana chart",
      kanji: "Kanji",
      vocab: "Vocabulary",
      grammar: "Grammar",
      lessons: "Lessons",
      review: "Review",
      reviewDue: "due",
      test: "Mock test",
      search: "Search",
      settings: "Account settings",
      sync: { saved: "Saved", saving: "Saving…", pending: (n) => `${n} ${n === 1 ? "change" : "changes"} waiting to save`, failed: "Sync failed", retry: "Retry" },
    },
    footer: { kanji: "Kanji data", dict: "Dictionary", legal: "Terms and privacy" },
    notFound: {
      title: "Page not found · Kotoba",
      body: "This sign isn't lit yet. The page you're looking for isn't here.",
      home: "Back home",
    },
    down: {
      title: "The power's out for a moment",
      body: "Can't reach the server. Your progress is still saved on this device.",
      retry: "Try again",
    },
    meta: {
      rootTitle: "Kotoba · Learn to read Japanese",
      rootDesc:
        "Read the signs of Tokyo, one letter at a time. Hiragana and katakana charts plus a recognition drill, no sign-up.",
      kanaTitle: "Kana chart and practice · Kotoba",
      kanaDesc:
        "Hiragana and katakana charts with romaji, plus a letter-recognition drill that needs no account.",
    },
    home: {
      h1a: "Read Tokyo,",
      h1b: "one letter at a time.",
      lede: "Kotoba starts you on the kana behind every shop sign in Japan. Practise right here on the page, no sign-up.",
      ctaQuiz: "Start practising",
      ctaChart: "See the chart",
      routeH: "Three scripts on every shop sign.",
      routeP: "Japanese is written in three scripts. Beginners start with the two kana sets: one set of sounds, two different shapes. Each goes from the basic letters to voiced, combined, small-tsu and long-vowel sounds.",
      hiraganaText: { a: "Soft strokes, used for native Japanese words and grammar endings, as in ", b: " or ", c: "." },
      katakanaText: { a: "Straight, angular strokes, used for loanwords and foreign names, as in ", b: " or ", c: "." },
      kanjiText: "Chinese characters, where most of a word's meaning lives. Each one comes with its Sino-Vietnamese reading, stroke count and the words that use it.",
      kanaCount: (total, basic) => `${total} letters · ${basic} basic`,
      kanjiCount: (total, levels) => `${total} characters · ${levels}`,
      lineH: "One line, up from N5.",
      lineP: "Vocabulary, kanji and grammar, arranged lesson by lesson, with each JLPT level a station. Each day's session follows the lesson you are on.",
      lineStation: (lessons) => `${lessons} lessons`,
      lineWords: "Words",
      lineGrammar: "Grammar",
      ladderLabel: "Correct reviews in a row for one item",
      ladderHit: (n) => `Review ${n}`,
      ladderWait: (days) => `next in ${days} ${days === 1 ? "day" : "days"}`,
      ladderMiss: "One miss and the item drops back to the start, due again the same day.",
      stateFresh: "New",
      stateLearned: "Learnt",
      stateKnown: "Known",
      previewH: "A real lesson, exactly as in the app.",
      previewP: (lesson, title) => `Lesson ${lesson}: ${title}. Its words, a kanji and a grammar pattern, with one review card.`,
      previewCard: "Review card, back",
      previewOpen: (lesson) => `Open lesson ${lesson}`,
      closingH: "Start with the first letter.",
      closingP: "No account needed. Answer by keyboard or by tap; your progress saves on this device at once.",
      honestH: "It only counts as known when you really remember it.",
      honestP1: (known, intervals) => `An item counts as known after ${known} correct reviews in a row, spaced ${intervals} days apart. One miss and the streak starts over. No points, no badges: just the letters you can actually read.`,
      honestP2: { a: "Fully keyboard-driven: press ", b: "–", c: " to answer, ", d: " for the next letter. Your progress saves at once and syncs when you sign in." },
      honestCta: "Start with hiragana",
      lampMastered: "Known",
      lampLearning: "Learning",
      lampUnseen: "Not seen yet",
      lampAria: (lit, max) => `${lit} of ${max} reviews correct in a row`,
      lampCaption: (known) => `${known} lamps lit means the letter is known.`,
      footerA: "Kotoba: learn to read Japanese, one sign at a time.",
      footerB: "You don't need an account to practise. With one, your progress syncs across devices.",
    },
    street: {
      signsAria: "Shop signs, tap one to read it",
      signMeaning: (meaning) => `, ${meaning}`,
      meanings: {
        "ラーメン": "Ramen noodles",
        "くすり": "Medicine, pharmacy",
        "カラオケ": "Karaoke",
        "すし": "Sushi",
        "ホテル": "Hotel",
      },
      longMark: "long vowel",
      reads: (romaji) => `read as “${romaji}”`,
      scriptNote: {
        Katakana: "Katakana: used for words borrowed from other languages.",
        Hiragana: "Hiragana: used for native Japanese words.",
      },
      tapMore: "Tap another sign to keep reading.",
    },
    kana: {
      titleChart: (name) => `${name} chart`,
      titleQuiz: (name) => `${name} practice`,
      ledeChart: {
        basic: "The basic letters, laid out by sound row. Pick one to see its romaji.",
        dakuten: "Add ゛ or ゜ to a basic letter and the sound shifts: k to g, s to z, t to d, h to b or p.",
        yoon: "An i-column letter joined with a small ya, yu or yo, read as one beat.",
        special: "A small っ holds a beat before the next consonant, and a long vowel lasts two beats. Learnt through real words.",
      },
      ledeQuiz: "Look at the letter, pick its reading. Keys 1–4 to answer, Enter for the next one.",
      scriptNav: "Script",
      groupNav: "Letter group",
      groups: { basic: "Basic", dakuten: "Voiced", yoon: "Combined", special: "Small tsu, long vowels" },
      modeNav: "Mode",
      progressAria: "Progress",
      masteredA: "You have learnt ",
      masteredB: (total, name) => ` of ${total} ${name} letters`,
      storageWarn: "This browser is blocking site storage, so progress will be lost when you reload. You can still practise normally.",
      loadingProgress: "Opening your progress…",
      reset: (name) => `Clear ${name} progress`,
      resetArmed: (name) => `Press again to clear ${name} progress`,
      chartAria: (name) => `${name} chart`,
      cellReads: ", read as ",
      hintLabel: "Sounds like",
      noteLabel: "Meaning and reading",
      levelLabel: "Recall",
      levelDone: "Known",
      levelDue: "Due for review",
      levelLearning: (days) => `Learning, review ${days === 1 ? "tomorrow" : `in ${days} days`}`,
      levelNone: "Not practised",
      practiceThis: "Practise this set",
      lampsAria: (lit, max) => `${lit} of ${max} reviews correct in a row`,
      extraNote: "Nothing in this set is due or new. This is extra practice: right answers leave the schedule alone, a miss brings the letter back today.",
      practiceOther: (name) => `Practise ${name}`,
      backToChart: "Back to the chart",
      ask: "How is this letter read?",
      rightMastered: (char) => `Correct. You know ${char} now.`,
      right: (romaji, days) => `Correct, “${romaji}”. Next review ${days === 1 ? "tomorrow" : `in ${days} days`}.`,
      rightExtra: (romaji) => `Correct, “${romaji}”. It was not due yet, so the schedule stays.`,
      // ponytail: kana hints in content/kana.json are Vietnamese by construction,
      // so the English sentence drops the hint clause instead of showing them.
      wrong: (char, romaji) => `Not quite. ${char} is read “${romaji}”. It will come back today.`,
      nextChar: "Next letter",
      session: (right, total) => `This session: ${right}/${total} correct`,
    },
    status: {
      loading: "Turning on the chart lights…",
      errorBody: "Could not load the chart. Check your connection and try again.",
      retry: "Try again",
      home: "Back home",
    },
  },
};

export const dict = (lang: Lang) => DICT[lang];

// ponytail: reads the cookie from document because error.tsx must be a client component.
// Upgrade when needed: wrap error.tsx in a server component that passes lang down.
export function clientLang(): Lang {
  if (typeof document === "undefined") return "vi";
  const m = /(?:^|;\s*)kotoba\.lang=(vi|en)/.exec(document.cookie);
  return m ? (m[1] as Lang) : "vi";
}
