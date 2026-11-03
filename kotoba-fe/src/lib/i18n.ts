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
  nav: { home: string; main: string; chart: string; quiz: string; lang: string; login: string; logout: string; menu: string; library: string; kana: string; kanji: string; vocab: string; grammar: string; lessons: string; review: string; reviewDue: string; search: string; settings: string };
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
    openMeta: string;
    soonMeta: string;
    honestH: string;
    honestP1: string;
    honestP2: Split4;
    honestCta: string;
    lampMastered: string;
    lampLearning: string;
    lampUnseen: string;
    lampAria: (lit: number) => string;
    lampCaption: string;
    footerA: string;
    footerB: string;
  };
  street: {
    signsAria: string;
    signAria: (word: string, meaning: string) => string;
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
    cellAria: (char: string, romaji: string) => string;
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
      main: "Chính",
      chart: "Bảng chữ",
      quiz: "Luyện tập",
      lang: "Ngôn ngữ",
      login: "Đăng nhập",
      logout: "Đăng xuất",
      menu: "Menu",
      library: "Thư viện",
      kana: "Bảng chữ cái",
      kanji: "Kanji",
      vocab: "Từ vựng",
      grammar: "Ngữ pháp",
      lessons: "Bài học",
      review: "Ôn tập",
      reviewDue: "mục đến hạn",
      search: "Tra cứu",
      settings: "Cài đặt tài khoản",
    },
    footer: { kanji: "Dữ liệu kanji", dict: "Từ điển", legal: "Điều khoản và quyền riêng tư" },
    notFound: {
      title: "Không tìm thấy trang · Kotoba",
      body: "Biển này chưa thắp đèn. Trang bạn tìm không có ở đây.",
      home: "Về trang chủ",
    },
    down: {
      title: "Mất điện một lúc",
      body: "Không kết nối được máy chủ. Tiến độ của bạn vẫn lưu trên máy này.",
      retry: "Thử lại",
    },
    meta: {
      rootTitle: "Kotoba · Học tiếng Nhật cho người Việt",
      rootDesc:
        "Đọc được biển hiệu Tokyo, từng chữ một. Bảng hiragana, katakana và bài luyện nhận mặt chữ bằng tiếng Việt, không cần đăng ký.",
      kanaTitle: "Bảng chữ và luyện kana · Kotoba",
      kanaDesc:
        "Bảng hiragana, katakana kèm cách đọc gần giống tiếng Việt, và bài luyện nhận mặt chữ không cần đăng ký.",
    },
    home: {
      h1a: "Đọc được Tokyo,",
      h1b: "từng chữ một.",
      lede: "Kotoba dạy tiếng Nhật cho người Việt, bằng tiếng Việt. Bắt đầu từ bảng kana trên mọi biển hiệu, luyện ngay trên trang, không cần đăng ký.",
      ctaQuiz: "Luyện đọc ngay",
      ctaChart: "Xem bảng chữ",
      routeH: "Hai tuyến đầu tiên đã chạy.",
      routeP: "Tiếng Nhật viết bằng ba loại chữ. Người mới bắt đầu từ hai bảng kana: cùng một bộ âm, hai dáng chữ khác nhau. Mỗi bảng có 46 chữ cơ bản, rồi đến âm đục, âm ghép, âm ngắt và trường âm.",
      hiraganaText: { a: "Nét mềm, dùng cho từ thuần Nhật và đuôi ngữ pháp, như ", b: " hay ", c: "." },
      katakanaText: { a: "Nét thẳng, góc cạnh, dùng cho từ mượn và tên nước ngoài, như ", b: " hay ", c: "." },
      kanjiText: "Chữ Hán, phần lớn nghĩa của từ nằm ở đây. Tuyến này đang được xây.",
      openMeta: "Đủ 4 nhóm · đang mở",
      soonMeta: "Sắp có",
      honestH: "Chỉ tính là nhớ khi bạn nhớ thật.",
      honestP1: "Mỗi chữ cần trả lời đúng ba lần liên tiếp. Sai một lần, chuỗi đếm lại từ đầu. Không điểm thưởng, không huy hiệu: chỉ những chữ bạn thật sự đọc được.",
      honestP2: { a: "Làm hoàn toàn bằng bàn phím: phím ", b: "–", c: " để chọn, ", d: " để sang chữ tiếp theo. Tiến độ lưu ngay trong trình duyệt này." },
      honestCta: "Bắt đầu với hiragana",
      lampMastered: "Đã nhớ",
      lampLearning: "Đang học",
      lampUnseen: "Chưa gặp",
      lampAria: (lit) => `${lit} trên 3 lần đúng liên tiếp`,
      lampCaption: "Ví dụ: ba đèn sáng là một chữ đã nhớ.",
      footerA: "Kotoba: học tiếng Nhật bằng tiếng Việt.",
      footerB: "Không cần tài khoản để luyện tập. Tiến độ nằm trong trình duyệt của bạn.",
    },
    street: {
      signsAria: "Biển hiệu, chạm để đọc",
      signAria: (word, meaning) => `${word}, ${meaning}`,
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
      tapMore: "Chạm biển khác để đọc tiếp.",
    },
    kana: {
      titleChart: (name) => `Bảng ${name}`,
      titleQuiz: (name) => `Luyện ${name}`,
      ledeChart: {
        basic: "Các chữ cơ bản, xếp theo hàng âm. Chọn một chữ để xem cách đọc gần giống tiếng Việt.",
        dakuten: "Thêm dấu ゛ hoặc ゜ vào chữ cơ bản thì âm đổi: k thành g, s thành z, t thành d, h thành b hoặc p.",
        yoon: "Chữ cột i ghép với ya, yu, yo viết nhỏ, đọc liền thành một nhịp.",
        special: "っ viết nhỏ ngắt một nhịp trước phụ âm sau nó, nguyên âm kéo dài thì giữ hai nhịp. Học qua từ thật.",
      },
      ledeQuiz: "Nhìn chữ, chọn cách đọc. Phím 1–4 để chọn, Enter để sang chữ tiếp theo.",
      scriptNav: "Bảng chữ",
      groupNav: "Nhóm chữ",
      groups: { basic: "Cơ bản", dakuten: "Âm đục", yoon: "Âm ghép", special: "Âm ngắt, trường âm" },
      modeNav: "Chế độ",
      progressAria: "Tiến độ",
      masteredA: "Đã học ",
      masteredB: (total, name) => ` / ${total} chữ ${name}`,
      storageWarn: "Trình duyệt đang chặn bộ nhớ trang, nên tiến độ sẽ mất khi bạn tải lại. Bạn vẫn luyện được bình thường.",
      loadingProgress: "Đang mở tiến độ của bạn…",
      reset: (name) => `Xoá tiến độ ${name}`,
      resetArmed: (name) => `Bấm lần nữa để xoá tiến độ ${name}`,
      chartAria: (name) => `Bảng ${name}`,
      cellAria: (char, romaji) => `${char}, đọc là ${romaji}`,
      hintLabel: "Đọc gần giống",
      noteLabel: "Nghĩa và cách đọc",
      levelLabel: "Mức nhớ",
      levelDone: "Đã thuộc",
      levelDue: "Đến hạn ôn",
      levelLearning: (days) => `Đang học, ôn lại ${days === 1 ? "ngày mai" : `sau ${days} ngày`}`,
      levelNone: "Chưa luyện",
      practiceThis: "Luyện bảng này",
      lampsAria: (lit, max) => `${lit} trên ${max} lần ôn đúng liên tiếp`,
      extraNote: "Nhóm này không còn chữ nào đến hạn hay chưa học. Bạn đang luyện thêm: trả lời đúng không đổi lịch ôn, sai thì chữ đó quay lại ngay hôm nay.",
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
      loading: "Đang bật đèn bảng chữ…",
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
      search: "Search",
      settings: "Account settings",
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
      routeH: "The first two lines are running.",
      routeP: "Japanese is written in three scripts. Beginners start with the two kana sets: one set of sounds, two different shapes. Each has 46 basic letters, then voiced, combined, small-tsu and long-vowel sounds.",
      hiraganaText: { a: "Soft strokes, used for native Japanese words and grammar endings, as in ", b: " or ", c: "." },
      katakanaText: { a: "Straight, angular strokes, used for loanwords and foreign names, as in ", b: " or ", c: "." },
      kanjiText: "Chinese characters, where most of a word's meaning lives. This line is still under construction.",
      openMeta: "All 4 groups · open",
      soonMeta: "Coming soon",
      honestH: "It only counts as learnt when you really know it.",
      honestP1: "Each letter needs three correct answers in a row. One miss and the streak starts over. No points, no badges: just the letters you can actually read.",
      honestP2: { a: "Fully keyboard-driven: press ", b: "–", c: " to answer, ", d: " for the next letter. Your progress stays in this browser." },
      honestCta: "Start with hiragana",
      lampMastered: "Learnt",
      lampLearning: "Learning",
      lampUnseen: "Not seen yet",
      lampAria: (lit) => `${lit} of 3 correct in a row`,
      lampCaption: "Three lamps lit means the letter is learnt.",
      footerA: "Kotoba: learn to read Japanese, one sign at a time.",
      footerB: "You don't need an account to practise. Your progress stays in your browser.",
    },
    street: {
      signsAria: "Shop signs, tap one to read it",
      signAria: (word, meaning) => `${word}, ${meaning}`,
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
      cellAria: (char, romaji) => `${char}, read as ${romaji}`,
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
