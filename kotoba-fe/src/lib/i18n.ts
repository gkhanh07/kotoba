// UI strings for both interface languages. Plain module, no next/headers:
// server components and client components both import it directly, like kana.ts.
// Cookie reading lives in app/LangSwitch.tsx (server) and clientLang() below.

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
  nav: { home: string; main: string; chart: string; quiz: string; lang: string; login: string; logout: string };
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
    ledeChart: string;
    ledeQuiz: string;
    scriptNav: string;
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
    levelLabel: string;
    levelDone: string;
    levelLearning: string;
    levelNone: string;
    practiceThis: string;
    lampsAria: (lit: number, max: number) => string;
    emptyH: (total: number, name: string) => string;
    emptyP: (max: number) => string;
    practiceOther: (name: string) => string;
    backToChart: string;
    ask: string;
    rightMastered: (char: string) => string;
    right: (romaji: string, streak: number, max: number) => string;
    wrong: (char: string, romaji: string, hint: string) => string;
    nextChar: string;
    session: (right: number, total: number) => string;
  };
  status: { loading: string; errorBody: string; retry: string; home: string };
};

const DICT: Record<Lang, Dict> = {
  vi: {
    nav: {
      home: "Kotoba, trang chủ",
      main: "Chính",
      chart: "Bảng chữ",
      quiz: "Luyện tập",
      lang: "Ngôn ngữ",
      login: "Đăng nhập",
      logout: "Đăng xuất",
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
      lede: "Kotoba dạy tiếng Nhật cho người Việt, bằng tiếng Việt. Bắt đầu từ 92 chữ kana trên mọi biển hiệu, luyện ngay trên trang, không cần đăng ký.",
      ctaQuiz: "Luyện đọc ngay",
      ctaChart: "Xem bảng chữ",
      routeH: "Hai tuyến đầu tiên đã chạy.",
      routeP: "Tiếng Nhật viết bằng ba loại chữ. Người mới bắt đầu từ hai bảng kana: mỗi bảng 46 chữ, cùng một bộ âm, hai dáng chữ khác nhau.",
      hiraganaText: { a: "Nét mềm, dùng cho từ thuần Nhật và đuôi ngữ pháp, như ", b: " hay ", c: "." },
      katakanaText: { a: "Nét thẳng, góc cạnh, dùng cho từ mượn và tên nước ngoài, như ", b: " hay ", c: "." },
      kanjiText: "Chữ Hán, phần lớn nghĩa của từ nằm ở đây. Tuyến này đang được xây.",
      openMeta: "46 chữ · đang mở",
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
      ledeChart: "46 chữ cơ bản, xếp theo hàng âm. Chọn một chữ để xem cách đọc gần giống tiếng Việt.",
      ledeQuiz: "Nhìn chữ, chọn cách đọc. Phím 1–4 để chọn, Enter để sang chữ tiếp theo.",
      scriptNav: "Bảng chữ",
      modeNav: "Chế độ",
      progressAria: "Tiến độ",
      masteredA: "Đã nhớ ",
      masteredB: (total, name) => ` / ${total} chữ ${name}`,
      storageWarn: "Trình duyệt đang chặn bộ nhớ trang, nên tiến độ sẽ mất khi bạn tải lại. Bạn vẫn luyện được bình thường.",
      loadingProgress: "Đang mở tiến độ của bạn…",
      reset: (name) => `Xoá tiến độ ${name}`,
      resetArmed: (name) => `Bấm lần nữa để xoá tiến độ ${name}`,
      chartAria: (name) => `Bảng ${name}`,
      cellAria: (char, romaji) => `${char}, đọc là ${romaji}`,
      hintLabel: "Đọc gần giống",
      levelLabel: "Mức nhớ",
      levelDone: "Đã nhớ",
      levelLearning: "Đang học",
      levelNone: "Chưa luyện",
      practiceThis: "Luyện bảng này",
      lampsAria: (lit, max) => `${lit} trên ${max} lần đúng liên tiếp`,
      emptyH: (total, name) => `Bạn đã nhớ cả ${total} chữ ${name}.`,
      emptyP: (max) => `Mỗi chữ đều đã đúng ${max} lần liên tiếp. Chuyển sang bảng còn lại, hoặc xoá tiến độ bên dưới để ôn lại từ đầu.`,
      practiceOther: (name) => `Luyện ${name}`,
      backToChart: "Xem lại bảng chữ",
      ask: "Chữ này đọc là gì?",
      rightMastered: (char) => `Đúng rồi. Bạn đã nhớ chữ ${char}.`,
      right: (romaji, streak, max) => `Đúng rồi, “${romaji}”. Đúng ${streak}/${max} lần liên tiếp.`,
      wrong: (char, romaji, hint) => `Chưa đúng. ${char} đọc là “${romaji}”, gần giống “${hint}”. Chuỗi đếm lại từ đầu.`,
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
      home: "Kotoba, home",
      main: "Main",
      chart: "Chart",
      quiz: "Practice",
      lang: "Language",
      login: "Log in",
      logout: "Log out",
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
      lede: "Kotoba starts you on the 92 kana behind every shop sign in Japan. Practise right here on the page, no sign-up.",
      ctaQuiz: "Start practising",
      ctaChart: "See the chart",
      routeH: "The first two lines are running.",
      routeP: "Japanese is written in three scripts. Beginners start with the two kana sets: 46 letters each, one set of sounds, two different shapes.",
      hiraganaText: { a: "Soft strokes, used for native Japanese words and grammar endings, as in ", b: " or ", c: "." },
      katakanaText: { a: "Straight, angular strokes, used for loanwords and foreign names, as in ", b: " or ", c: "." },
      kanjiText: "Chinese characters, where most of a word's meaning lives. This line is still under construction.",
      openMeta: "46 letters · open",
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
      ledeChart: "46 basic letters, laid out by sound row. Pick one to see its romaji.",
      ledeQuiz: "Look at the letter, pick its reading. Keys 1–4 to answer, Enter for the next one.",
      scriptNav: "Script",
      modeNav: "Mode",
      progressAria: "Progress",
      masteredA: "You know ",
      masteredB: (total, name) => ` of ${total} ${name} letters`,
      storageWarn: "This browser is blocking site storage, so progress will be lost when you reload. You can still practise normally.",
      loadingProgress: "Opening your progress…",
      reset: (name) => `Clear ${name} progress`,
      resetArmed: (name) => `Press again to clear ${name} progress`,
      chartAria: (name) => `${name} chart`,
      cellAria: (char, romaji) => `${char}, read as ${romaji}`,
      hintLabel: "Sounds like",
      levelLabel: "Recall",
      levelDone: "Learnt",
      levelLearning: "Learning",
      levelNone: "Not practised",
      practiceThis: "Practise this set",
      lampsAria: (lit, max) => `${lit} of ${max} correct in a row`,
      emptyH: (total, name) => `You know all ${total} ${name} letters.`,
      emptyP: (max) => `Every letter has been right ${max} times in a row. Switch to the other set, or clear your progress below to start again.`,
      practiceOther: (name) => `Practise ${name}`,
      backToChart: "Back to the chart",
      ask: "How is this letter read?",
      rightMastered: (char) => `Correct. You have learnt ${char}.`,
      right: (romaji, streak, max) => `Correct, “${romaji}”. That is ${streak}/${max} in a row.`,
      // ponytail: the 46 hints in kana.ts are Vietnamese phonetics by construction,
      // so the English sentence drops the hint clause instead of showing them.
      wrong: (char, romaji) => `Not quite. ${char} is read “${romaji}”. The streak starts over.`,
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
