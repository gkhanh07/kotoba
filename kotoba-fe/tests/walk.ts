// Test helper: visits every leaf of a text dictionary (vi / en) so both languages are compared key by key.
export type Tree = { [k: string]: unknown };

export function shape(t: unknown): unknown {
  if (typeof t === "function") return "fn";
  if (Array.isArray(t)) return t.map(shape);
  if (t && typeof t === "object") return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, shape(v)]));
  return typeof t;
}

// Calls every function in the tree with each of the argument sets and returns what they produced.
export function callAll(t: unknown, argSets: unknown[][], path = ""): { path: string; out: unknown }[] {
  if (typeof t === "function") return argSets.map((a) => ({ path, out: (t as (...x: unknown[]) => unknown)(...a) }));
  if (Array.isArray(t)) return t.flatMap((v, i) => callAll(v, argSets, `${path}[${i}]`));
  if (t && typeof t === "object") return Object.entries(t).flatMap(([k, v]) => callAll(v, argSets, `${path}.${k}`));
  return [];
}

export const isTextual = (o: unknown): boolean =>
  typeof o === "string" || (!!o && typeof o === "object" && Object.values(o).every(isTextual));
