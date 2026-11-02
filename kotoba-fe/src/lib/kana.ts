// Kana types and chart layout. Client-safe; the data comes from kotoba-be via lib/content.ts.

export type Script = "hiragana" | "katakana";
export type Group = "basic" | "dakuten" | "yoon" | "special";
export const GROUPS: Group[] = ["basic", "dakuten", "yoon", "special"];

export type Kana = {
  id: string; // "hiragana:ka"
  script: Script;
  group: Group;
  char: string;
  romaji: string;
  hint: string; // Vietnamese: the sound for letters, meaning + note for special words
  row: number;
  col: number;
};

export type KanaSet = { script: Script; group: Group; name: string; items: Kana[] };

// Row and column heads per group; row/col on each item index into these.
// special has no grid: its words render as a plain list.
export const LAYOUT: Record<Group, { rows: string[]; cols: string[] }> = {
  basic: { rows: ["", "k", "s", "t", "n", "h", "m", "y", "r", "w", ""], cols: ["a", "i", "u", "e", "o"] },
  dakuten: { rows: ["g", "z", "d", "b", "p"], cols: ["a", "i", "u", "e", "o"] },
  yoon: { rows: ["ky", "sh", "ch", "ny", "hy", "my", "ry", "gy", "j", "by", "py"], cols: ["a", "u", "o"] },
  special: { rows: [], cols: [] },
};

export function isScript(v: unknown): v is Script {
  return v === "hiragana" || v === "katakana";
}

export function isGroup(v: unknown): v is Group {
  return GROUPS.includes(v as Group);
}
