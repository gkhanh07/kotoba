// Shaped like the future kotoba-be response: GET /kana/:script -> KanaSet.
// ponytail: bundled mock, swap the body of getKanaSet for a fetch when the API exists.

export type Script = "hiragana" | "katakana";

export type Kana = {
  id: string; // "hiragana:ka"
  char: string;
  romaji: string;
  hint: string; // Vietnamese approximation of the sound
  row: number; // gojūon row, 0 = vowels
  col: number; // 0..4 = a i u e o
};

export type KanaSet = { script: Script; name: string; items: Kana[] };

// [romaji, hiragana, katakana, hint, row, col]
const TABLE: [string, string, string, string, number, number][] = [
  ["a", "あ", "ア", "a", 0, 0], ["i", "い", "イ", "i", 0, 1], ["u", "う", "ウ", "ư (môi không tròn)", 0, 2], ["e", "え", "エ", "ê", 0, 3], ["o", "お", "オ", "ô", 0, 4],
  ["ka", "か", "カ", "ca", 1, 0], ["ki", "き", "キ", "ki", 1, 1], ["ku", "く", "ク", "cư", 1, 2], ["ke", "け", "ケ", "kê", 1, 3], ["ko", "こ", "コ", "cô", 1, 4],
  ["sa", "さ", "サ", "xa", 2, 0], ["shi", "し", "シ", "si (uốn lưỡi nhẹ)", 2, 1], ["su", "す", "ス", "xư", 2, 2], ["se", "せ", "セ", "xê", 2, 3], ["so", "そ", "ソ", "xô", 2, 4],
  ["ta", "た", "タ", "ta", 3, 0], ["chi", "ち", "チ", "chi", 3, 1], ["tsu", "つ", "ツ", "chư (bật hơi ts)", 3, 2], ["te", "て", "テ", "tê", 3, 3], ["to", "と", "ト", "tô", 3, 4],
  ["na", "な", "ナ", "na", 4, 0], ["ni", "に", "ニ", "ni", 4, 1], ["nu", "ぬ", "ヌ", "nư", 4, 2], ["ne", "ね", "ネ", "nê", 4, 3], ["no", "の", "ノ", "nô", 4, 4],
  ["ha", "は", "ハ", "ha", 5, 0], ["hi", "ひ", "ヒ", "hi", 5, 1], ["fu", "ふ", "フ", "phư (thổi nhẹ qua môi)", 5, 2], ["he", "へ", "ヘ", "hê", 5, 3], ["ho", "ほ", "ホ", "hô", 5, 4],
  ["ma", "ま", "マ", "ma", 6, 0], ["mi", "み", "ミ", "mi", 6, 1], ["mu", "む", "ム", "mư", 6, 2], ["me", "め", "メ", "mê", 6, 3], ["mo", "も", "モ", "mô", 6, 4],
  ["ya", "や", "ヤ", "ia (đọc liền)", 7, 0], ["yu", "ゆ", "ユ", "iu", 7, 2], ["yo", "よ", "ヨ", "iô", 7, 4],
  ["ra", "ら", "ラ", "ra, lưỡi chạm nhẹ như “la”", 8, 0], ["ri", "り", "リ", "ri", 8, 1], ["ru", "る", "ル", "rư", 8, 2], ["re", "れ", "レ", "rê", 8, 3], ["ro", "ろ", "ロ", "rô", 8, 4],
  ["wa", "わ", "ワ", "oa", 9, 0], ["wo", "を", "ヲ", "ô (dùng làm trợ từ)", 9, 4],
  ["n", "ん", "ン", "n / m ngân trong mũi", 10, 0],
];

export const ROWS = ["", "k", "s", "t", "n", "h", "m", "y", "r", "w", "n"];

export async function getKanaSet(script: Script): Promise<KanaSet> {
  const k = script === "katakana" ? 2 : 1;
  return {
    script,
    name: script === "katakana" ? "Katakana" : "Hiragana",
    items: TABLE.map((t) => ({ id: `${script}:${t[0]}`, char: t[k] as string, romaji: t[0], hint: t[3], row: t[4], col: t[5] })),
  };
}

export function isScript(v: unknown): v is Script {
  return v === "hiragana" || v === "katakana";
}
