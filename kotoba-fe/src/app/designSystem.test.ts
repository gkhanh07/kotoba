import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// ADR 010: the design system is CSS, so its contract is checked on the source text.
const css = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const globals = css("./globals.css");
const flashcards = css("./flashcards/flashcards.module.css");

/** The palette primitives: the only hex values the app may contain, each declared once. */
const PRIMITIVES: Record<string, string> = {
  night: "#050608", asphalt: "#0b0f16", wet: "#141a25",
  "sky-1": "#0d1b4a", "sky-2": "#0a1437", "sky-3": "#070b1c",
  "rule-dim": "#1a2133", rule: "#26304a", "rule-strong": "#3a4768",
  chalk: "#eef3f8", silver: "#c9d4e0", "silver-dim": "#93a0b4", "silver-mute": "#5f6b80",
  amber: "#ffb13b", "amber-core": "#fff1d6",
  neon: "#ff3d6e", "neon-soft": "#ff8aa8", "neon-core": "#ffe3ea",
  cool: "#5cb8ff", "cool-core": "#eaf7ff",
};

const ADR_010_TOKENS = [
  "surface-0", "surface-1", "surface-2", "surface-3", "edge-hi", "shadow-float",
  "state-fresh", "state-started", "state-learned", "state-known", "ok", "warn", "err",
  "fs-page", "fs-section", "fs-card", "fs-body", "fs-caption", "fs-meta", "fs-specimen", "fs-specimen-lg",
  "radius", "radius-sm", "space-panel", "dur-fast", "dur",
];

/** Every rule whose selector list contains `selector`, joined. */
const rulesFor = (source: string, selector: string) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(",").some((s) => s.trim() === selector))
    .map(([, , body]) => body)
    .join(";");

const reducedMotion = (source: string) => {
  const start = source.indexOf("@media (prefers-reduced-motion: reduce)");
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unclosed reduced-motion block");
};

describe("design system tokens (AC-1.1)", () => {
  it("declares every primitive hex exactly once and no other hex", () => {
    const hexes = [...globals.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(([hex]) => hex.toLowerCase());
    expect(hexes.sort()).toEqual(Object.values(PRIMITIVES).sort());
    for (const [name, hex] of Object.entries(PRIMITIVES)) {
      expect(globals).toContain(`--${name}: ${hex};`);
    }
  });

  it("keeps hex out of every CSS module except the hero's pre-existing values", () => {
    // The hero predates ADR 010 and stays as is: `#fff` is the silver sign's white-hot core, and
    // `#000` in the masks is an alpha stencil, not a colour. Nothing else may add one.
    const HERO_EXCEPTIONS = ["#000", "#000", "#000", "#000", "#fff"];
    const srcDir = dirname(dirname(fileURLToPath(import.meta.url)));
    const modules = readdirSync(srcDir, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".module.css"));
    expect(modules.length).toBeGreaterThan(0);
    for (const file of modules) {
      const text = readFileSync(join(srcDir, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      const hexes = [...text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(([hex]) => hex.toLowerCase()).sort();
      expect(hexes, file).toEqual(file.replaceAll("\\", "/") === "app/page.module.css" ? HERO_EXCEPTIONS : []);
    }
  });

  it.each(ADR_010_TOKENS)("defines --%s from existing tokens, not a new colour", (token) => {
    const match = globals.match(new RegExp(`--${token}:([^;]+);`));
    expect(match, `--${token} is missing`).not.toBeNull();
    expect(match?.[1]).not.toMatch(/#|rgba?\(/);
  });

  it("maps the learning states to the ADR 007 words in rising brightness", () => {
    expect(globals).toContain("--state-fresh: var(--silver-dim);");
    expect(globals).toContain("--state-started: var(--cool);");
    expect(globals).toContain("--state-learned: var(--amber);");
    expect(globals).toContain("--state-known: var(--amber-core);");
  });

  it("keeps the readable floor: the smallest type token is 13px", () => {
    expect(globals).toContain("--fs-meta: 0.8125rem;");
  });

  it("uses --shadow-float only on the floating layer class", () => {
    const uses = [...globals.matchAll(/([^{}]+)\{[^{}]*var\(--shadow-float\)[^{}]*\}/g)].map(([, sel]) => sel.trim());
    expect(uses).toEqual([".float"]);
  });
});

describe("shared classes (AC-1.2)", () => {
  it.each([".panel", ".tile", ".tag", ".meter", ".field", ".seg", ".empty", ".notice", ".skeleton", ".float"])(
    "defines %s",
    (selector) => expect(rulesFor(globals, selector)).not.toBe(""),
  );

  it.each([
    ['.tile[aria-pressed="true"]'], [".tile[aria-current]"], ['.tile[aria-selected="true"]'], [".tile[data-selected]"],
    ['.seg > [aria-pressed="true"]'], [".seg > [aria-current]"], ['.seg > [aria-selected="true"]'],
  ])("gives the selected state %s a border change, not colour alone", (selector) => {
    expect(rulesFor(globals, selector)).toMatch(/border|box-shadow/);
  });

  it.each(["fresh", "started", "learned", "known", "ok", "warn", "err"])("styles tag state %s", (state) => {
    expect(rulesFor(globals, `.tag[data-state="${state}"]`)).toMatch(/color:/);
  });

  it("has hover, active and disabled states on every interactive shared class", () => {
    for (const selector of ["a.tile:hover", "button.tile:active:not(:disabled)", ".tile:disabled",
      ".field:hover:not(:disabled)", ".field:focus-visible", ".field:disabled", '.field[aria-invalid="true"]',
      ".seg > a:hover", ".seg > button:disabled", ".btn:active:not(:disabled)", ".btn:disabled"]) {
      expect(rulesFor(globals, selector), selector).not.toBe("");
    }
  });

  it("rounds the shared shapes with the radius tokens, not the old 2px hairline", () => {
    expect(rulesFor(globals, ".btn")).toContain("border-radius: var(--radius-sm)");
    expect(rulesFor(globals, ".panel")).toContain("border-radius: var(--radius)");
  });
});

describe("reduced motion (AC-1.3)", () => {
  it("stops animations and transitions site-wide and the press nudge and skeleton pulse", () => {
    const block = reducedMotion(globals);
    expect(block).toContain("animation-iteration-count: 1 !important");
    expect(block).toContain("transition-duration: 0.001ms !important");
    expect(block).toMatch(/\.btn:active[^{]*\{\s*transform: none;/);
    expect(block).toMatch(/\.skeleton \{ animation: none; \}/);
  });

  it("swaps the flashcard faces in place instead of rotating", () => {
    const block = reducedMotion(flashcards);
    expect(block).toMatch(/\.card\[data-flipped="true"\] \.inner, \.back \{ transform: none; \}/);
    expect(block).toMatch(/\.back, \.card\[data-flipped="true"\] \.face \{ visibility: hidden; \}/);
    expect(block).toMatch(/\.card\[data-flipped="true"\] \.back \{ visibility: visible; \}/);
  });
});
