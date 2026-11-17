// Search folding and match marking for /search. Client-safe.

// Same folding as kotoba-be/src/content.ts normalize, one character at a time,
// so a match in the folded text maps back to the characters on screen.
const fold = (c: string) =>
  c
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (k) => String.fromCharCode(k.charCodeAt(0) - 0x60))
    .replace(/[.-]/g, "");

export const normalize = (s: string) => [...s].map(fold).join("").trim();

// [before, match, after] around the first match of q in text, or [text] when there is none.
export function mark(text: string, q: string): string[] {
  const nq = normalize(q);
  const chars = [...text];
  let folded = "";
  const at: number[] = []; // at[i]: the index in chars that folded[i] came from
  chars.forEach((c, i) => {
    const f = fold(c);
    folded += f;
    for (let k = 0; k < f.length; k++) at.push(i);
  });
  const j = nq ? folded.indexOf(nq) : -1;
  if (j < 0) return [text];
  const a = at[j], b = at[j + nq.length - 1] + 1;
  return [chars.slice(0, a).join(""), chars.slice(a, b).join(""), chars.slice(b).join("")];
}
