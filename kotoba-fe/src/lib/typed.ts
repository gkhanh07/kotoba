// Typed answers (phase 40d): romaji → hiragana, and the check that accepts kana or romaji. Pure, client-safe.

const VOWELS = "aiueo";
// Five kana per consonant, in a i u e o order; "_" = no such kana.
const ROWS: Record<string, string> = {
  "": "あいうえお", k: "かきくけこ", g: "がぎぐげご", s: "さしすせそ", z: "ざじずぜぞ", t: "たちつてと", d: "だぢづでど",
  n: "なにぬねの", h: "はひふへほ", b: "ばびぶべぼ", p: "ぱぴぷぺぽ", m: "まみむめも", y: "や_ゆ_よ", r: "らりるれろ", w: "わ___を",
};
const TABLE: Record<string, string> = {
  shi: "し", chi: "ち", tsu: "つ", fu: "ふ", ji: "じ", si: "し", ti: "ち", tu: "つ", hu: "ふ", zi: "じ", di: "ぢ", du: "づ",
  fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ", thi: "てぃ", dhi: "でぃ", she: "しぇ", che: "ちぇ", je: "じぇ", "-": "ー",
};
for (const [c, kana] of Object.entries(ROWS)) [...kana].forEach((k, i) => { if (k !== "_") TABLE[c + VOWELS[i]] ??= k; });
// Yōon: the i-kana plus small ゃゅょ (kya, sha, cha, ja, jya...).
const SMALL: Record<string, string> = { a: "ゃ", u: "ゅ", o: "ょ" };
for (const c of "kgnhbpmr") for (const v of "auo") TABLE[`${c}y${v}`] = TABLE[c + "i"] + SMALL[v];
for (const [c, i] of [["sh", "し"], ["ch", "ち"], ["j", "じ"], ["zy", "じ"], ["sy", "し"], ["ty", "ち"], ["jy", "じ"]]) for (const v of "auo") TABLE[c + v] = i + SMALL[v];

const toHira = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// Greedy, longest chunk first. A doubled consonant is っ; n before a consonant or at the end is ん.
// Anything unreadable is kept as is, so it can never match an answer.
export function toHiragana(input: string): string {
  const s = toHira(input.toLowerCase());
  let out = "";
  for (let i = 0; i < s.length; ) {
    const c = s[i], n = s[i + 1];
    if (c === "n" && n === "'") { out += "ん"; i += 2; continue; }
    // Hepburn "konnichiha": nn before a vowel is ん + な-row; otherwise (IME "nn") one ん.
    if (c === "n" && n === "n") { out += "ん"; i += /[aiueoy]/.test(s[i + 2] ?? "") ? 1 : 2; continue; }
    if (c === "n" && (n === undefined || !/[aiueoy]/.test(n))) { out += "ん"; i++; continue; }
    if (c === "t" && n === "c" && s[i + 2] === "h") { out += "っ"; i++; continue; } // Hepburn "tch" (kotchi)
    if (/[bcdfghjkmprstwz]/.test(c) && n === c) { out += "っ"; i++; continue; }
    const len = [3, 2, 1].find((l) => TABLE[s.slice(i, i + l)]);
    if (len) { out += TABLE[s.slice(i, i + len)]; i += len; } else { out += c; i++; }
  }
  return out;
}

// ー repeats the vowel before it, so コーヒー, こーひー and koohii all read こおひい.
const VOWEL_OF: Record<string, string> = { ゃ: "あ", ゅ: "う", ょ: "お", ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お" };
for (const kana of Object.values(ROWS)) [...kana].forEach((k, i) => { if (k !== "_") VOWEL_OF[k] = "あいうえお"[i]; });
const fold = (s: string) => [...s].reduce((acc, ch) => acc + (ch === "ー" ? VOWEL_OF[acc.at(-1) ?? ""] ?? ch : ch), "");

// AC-9: kana or romaji, surrounding space ignored. Romaji also matches the listed spelling (gakkō, or ji for ぢ).
export function typedMatch(input: string, kana: string, romaji: string): boolean {
  const typed = input.trim().toLowerCase().normalize("NFC");
  if (!typed) return false;
  return typed === romaji.toLowerCase().normalize("NFC") || fold(toHiragana(typed.replace(/\s+/g, ""))) === fold(toHira(kana));
}
