import Link from "next/link";
import { Arrow, SiteBar, SiteFooter } from "./SiteBar";
import { Street } from "./Street";
import { getLang } from "./LangSwitch";
import { dict } from "@/lib/i18n";
import { currentUser } from "@/lib/auth";
import type { CSSProperties } from "react";
import { getGrammar, getKana, getKanji, getLessons, getTests, getVocab } from "@/lib/content";
import { goalScope, LEVELS, levelLabel, stopsOf } from "@/lib/library";
import { INTERVALS, KNOWN_AT } from "@/lib/srs";
import { itemLinks } from "@/lib/weak";
import { Dashboard } from "./Dashboard";
import s from "./page.module.css";

// Three depth planes, far to near. Rim is the lit top edge, win scales the windows
// down with distance so the far row stays haze and the near row stays silhouette.
const PLANES = [
  { fill: s.tFar, rim: 0.35, win: 0.55 },
  { fill: s.tMid, rim: 0.52, win: 0.82 },
  { fill: s.tNear, rim: 0.72, win: 1 },
];

// Kiểu mặt tiền, suy từ chỉ số tòa nhà nên không tiêu một rnd() nào: hai phần tư
// là lưới cửa sổ, một phần tư là dải kính ngang (w = 0 → kéo hết bề ngang),
// một phần tư là cột hẹp. Một tòa lặp lại năm chục lần là cái làm nó ra pixel.
const FACES = [
  { w: 4, h: 6, dx: 10, dy: 14, gate: 0.82 },
  { w: 4, h: 6, dx: 10, dy: 14, gate: 0.82 },
  { w: 0, h: 3, dx: 0, dy: 13, gate: 0.5 },
  { w: 2, h: 9, dx: 7, dy: 16, gate: 0.7 },
];

// Deterministic skyline: towers with a lit-window pixel grid, and an elevated train line.
function Skyline() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const towers: { x: number; w: number; h: number }[] = [];
  for (let x = 0; x < 1440; ) {
    const w = 40 + Math.floor(rnd() * 90);
    towers.push({ x, w, h: 120 + Math.floor(rnd() * 300) });
    x += w + Math.floor(rnd() * 14);
  }
  return (
    <svg className={s.skyline} viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {towers.map((t, i) => {
        const top = 520 - t.h;
        // Taller reads as nearer.
        const p = PLANES[t.h > 320 ? 2 : t.h > 220 ? 1 : 0];
        // One warmth threshold per tower, so lit floors cluster: offices run cool, flats run warm.
        const warmth = i % 3 ? 0.62 : 0.25;
        const f = FACES[i % 4];
        const cols = f.w ? Math.floor((t.w - 12) / f.dx) : 1;
        return (
          <g key={i}>
            <rect x={t.x} y={top} width={t.w} height={t.h} className={p.fill} />
            <rect x={t.x} y={top} width={t.w} height="1" className={s.tRim} opacity={p.rim} />
            {p === PLANES[2] && (
              <rect x={t.x + 3} y="378" width={t.w - 6} height="14" className={s.winWarm} opacity="0.2" />
            )}
            {t.h > 360 && (
              <>
                <rect x={t.x + t.w / 2 - 1} y={top - 12} width="2" height="12" className={s.tRim} opacity="0.45" />
                <rect x={t.x + t.w / 2 - 2} y={top - 16} width="4" height="4" className={s.winWarm} opacity="0.9" />
              </>
            )}
            {Array.from({ length: Math.floor((t.h - 30) / f.dy) }, (_, r) =>
              Array.from({ length: cols }, (_, c) =>
                rnd() > f.gate ? (
                  <rect
                    key={`${r}-${c}`}
                    x={t.x + 8 + c * f.dx}
                    y={top + 14 + r * f.dy}
                    width={f.w || t.w - 16}
                    height={f.h}
                    // Tầng càng thấp càng ấm: đèn natri dưới phố, LED văn phòng trên cao.
                    className={rnd() > warmth - r * 0.03 ? s.winWarm : s.winCool}
                    opacity={(0.45 + rnd() * 0.5) * p.win}
                  />
                ) : null,
              ),
            )}
          </g>
        );
      })}
      <rect x="0" y="392" width="1440" height="7" className={s.gStrip} />
      <rect x="0" y="399" width="1440" height="1" className={s.tRim} opacity="0.6" />
      <g className={s.train}>
        <rect x="860" y="376" width="260" height="15" rx="3" className={s.tNear} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={868 + i * 21} y="380" width="13" height="5" className={s.winWarm} opacity="0.85" />
        ))}
      </g>
    </svg>
  );
}

const LAMPS = [
  { char: "あ", romaji: "a", lit: KNOWN_AT },
  { char: "ぬ", romaji: "nu", lit: 2 },
  { char: "ヲ", romaji: "wo", lit: 0 },
];

const KANA_SCRIPTS = [
  { script: "hiragana", name: "Hiragana", specimen: "ひらがな", examples: ["すし", "くすり"], textKey: "hiraganaText" },
  { script: "katakana", name: "Katakana", specimen: "カタカナ", examples: ["ラーメン", "ホテル"], textKey: "katakanaText" },
] as const;
/** Rows of the guest preview: enough to read as a lesson without turning the home into a word list. */
const PREVIEW_WORDS = 4;

export default async function Home() {
  const lang = await getLang();
  const user = await currentUser();
  if (user) {
    const [kana, kanji, vocab, tests] = await Promise.all([getKana(), getKanji(), getVocab(), getTests()]);
    // Fronts and detail links for the "Hay sai" block; the weak ids are only known in the browser.
    const fronts = itemLinks(kana, kanji, vocab);
    const goal = user.profile?.goal;
    const idsOf = (items: { id: string }[]) => items.map((item) => item.id);
    return (
      <>
        <SiteBar />
        <Dashboard
          fronts={fronts}
          stops={stopsOf([...kana, ...kanji, ...vocab])}
          lang={lang}
          name={user.profile?.name ?? user.email.split("@")[0]}
          profile={user.profile}
          scope={{ kana: idsOf(kana), kanji: idsOf(goalScope(kanji, goal)), vocab: idsOf(goalScope(vocab, goal)) }}
          tests={tests.map((p) => ({ id: p.id, title: p.title[lang], minutes: p.minutes }))}
        />
        <SiteFooter />
      </>
    );
  }
  const t = dict(lang).home;
  const lampLabels = [t.lampMastered, t.lampLearning, t.lampUnseen];
  const [kana, kanji, vocab, grammar, lessons] = await Promise.all([getKana(), getKanji(), getVocab(), getGrammar(), getLessons()]);
  const kanaScripts = KANA_SCRIPTS.map((k) => {
    const items = kana.filter((x) => x.script === k.script);
    return { ...k, text: t[k.textKey], total: items.length, basic: items.filter((x) => x.group === "basic").length };
  });
  // Only levels that have lessons become stations, so the line never shows an empty N2.
  const journey = LEVELS.map((level) => ({
    level,
    lessons: lessons.filter((l) => l.level === level).length,
    words: vocab.filter((v) => v.level === level).length,
    kanji: kanji.filter((k) => k.level === level).length,
    grammar: grammar.filter((g) => g.level === level).length,
  })).filter((stop) => stop.lessons > 0);
  const kanjiLevels = journey.filter((stop) => stop.kanji > 0).map((stop) => levelLabel(stop.level));
  const levelSpan = kanjiLevels.length > 1 ? `${kanjiLevels[0]}–${kanjiLevels.at(-1)}` : (kanjiLevels[0] ?? "");
  // The first lesson that has words, a kanji and a grammar point: the preview is a real lesson, not a mock.
  const preview = lessons
    .map((lesson) => ({
      lesson,
      words: vocab.filter((v) => v.lesson === lesson.lesson),
      kanji: kanji.find((k) => k.lesson === lesson.lesson),
      grammar: grammar.find((g) => g.lesson === lesson.lesson),
    }))
    .flatMap(({ lesson, words, kanji: k, grammar: g }) =>
      words.length > 0 && k && g ? [{ lesson, words: words.slice(0, PREVIEW_WORDS), card: words[0], kanji: k, grammar: g }] : [])[0];

  return (
    <>
      <section className={s.hero}>
        <div className={s.rain} aria-hidden="true" />
        <div className={s.spill} aria-hidden="true" />
        <SiteBar />
        <Street
          lang={lang}
          skyline={<Skyline />}
          copy={
            <>
              <h1>
              <span className={s.lineCool}>{t.h1a}</span>
              <span className={s.lineAmber}>{t.h1b}</span>
            </h1>
            <p className={s.lede}>
              {t.lede}
            </p>
            <div className={s.actions}>
              <Link href="/kana?mode=quiz" className="btn">{t.ctaQuiz} <Arrow /></Link>
              <Link href="/kana" className="btn btnGhost">{t.ctaChart}</Link>
            </div>
            </>
          }
        />
      </section>

      <main className={s.body}>
        <section className={s.scripts} aria-labelledby="route-h">
          <div className={s.sectionHead}>
            <h2 id="route-h">{t.routeH}</h2>
            <p>{t.routeP}</p>
          </div>
          <ul className={s.scriptGrid}>
            {kanaScripts.map((k) => (
              <li key={k.script}>
                <Link href={`/kana?script=${k.script}`} className={`tile ${s.script}`}>
                  <span lang="ja" className={s.scriptSpecimen}>{k.specimen}</span>
                  <span className={s.scriptName}>{k.name} <Arrow /></span>
                  <span className={s.scriptText}>{k.text.a}<span lang="ja">{k.examples[0]}</span>{k.text.b}<span lang="ja">{k.examples[1]}</span>{k.text.c}</span>
                  <span className={s.scriptMeta}>{t.kanaCount(k.total, k.basic)}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/kanji" className={`tile ${s.script}`}>
                <span lang="ja" className={s.scriptSpecimen}>漢字</span>
                <span className={s.scriptName}>Kanji <Arrow /></span>
                <span className={s.scriptText}>{t.kanjiText}</span>
                <span className={s.scriptMeta}>{t.kanjiCount(kanji.length, levelSpan)}</span>
              </Link>
            </li>
          </ul>
        </section>

        <section className={s.route} aria-labelledby="line-h">
          <div className={s.sectionHead}>
            <h2 id="line-h">{t.lineH}</h2>
            <p>{t.lineP}</p>
          </div>
          <ol className={s.line} style={{ "--stops": journey.length } as CSSProperties}>
            {journey.map((stop) => (
              <li key={stop.level}>
                <Link href="/lessons" className={s.station}>
                  <span className={s.stationKana}>{levelLabel(stop.level)}</span>
                  <span className={s.stationName}>{t.lineStation(stop.lessons)} <Arrow /></span>
                  <dl className={s.stationStats}>
                    <div><dt>{t.lineWords}</dt><dd>{stop.words}</dd></div>
                    <div><dt>Kanji</dt><dd>{stop.kanji}</dd></div>
                    <div><dt>{t.lineGrammar}</dt><dd>{stop.grammar}</dd></div>
                  </dl>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className={s.honest} aria-labelledby="honest-h">
          <div className={s.sectionHead}>
            <h2 id="honest-h">{t.honestH}</h2>
            <p>
              {t.honestP1(KNOWN_AT, INTERVALS.join(", "))}
            </p>
            <p>
              {t.honestP2.a}<kbd>1</kbd>{t.honestP2.b}<kbd>4</kbd>{t.honestP2.c}<kbd>Enter</kbd>{t.honestP2.d}
            </p>
            <ol className={s.ladder} aria-label={t.ladderLabel}>
              <li><span className="tag" data-state="fresh">{t.stateFresh}</span></li>
              {Array.from({ length: KNOWN_AT }, (_, n) => (
                <li key={n}>
                  <span className={s.ladderHit}>{t.ladderHit(n + 1)}</span>
                  {n === 0 && <span className="tag" data-state="learned">{t.stateLearned}</span>}
                  {n + 1 === KNOWN_AT
                    ? <span className="tag" data-state="known">{t.stateKnown}</span>
                    : <span className={s.ladderWait}>{t.ladderWait(INTERVALS[n])}</span>}
                </li>
              ))}
            </ol>
            <p className={s.ladderMiss}>{t.ladderMiss}</p>
          </div>
          <figure className={s.lamps}>
            <ul>
              {LAMPS.map((l, i) => (
                <li key={l.char} data-known={l.lit === KNOWN_AT}>
                  <span lang="ja" className={s.lampChar}>{l.char}</span>
                  <span className={s.lampRomaji}>{l.romaji}</span>
                  <span className={s.lampRow} role="img" aria-label={t.lampAria(l.lit, KNOWN_AT)}>
                    {Array.from({ length: KNOWN_AT }, (_, n) => <i key={n} data-on={n < l.lit} />)}
                  </span>
                  <span className={s.lampLabel}>{lampLabels[i]}</span>
                </li>
              ))}
            </ul>
            <figcaption>{t.lampCaption(KNOWN_AT)}</figcaption>
          </figure>
        </section>

        {preview && (
          <section className={s.preview} aria-labelledby="preview-h">
            <div className={s.sectionHead}>
              <h2 id="preview-h">{t.previewH}</h2>
              <p>{t.previewP(preview.lesson.lesson, preview.lesson.title[lang])}</p>
            </div>
            <div className={s.previewGrid}>
              <div className={`panel ${s.previewWords}`}>
                <h3>{t.lineWords}</h3>
                <ul>
                  {preview.words.map((v) => (
                    <li key={v.id}>
                      <span lang="ja" className={s.previewWord}>{v.word}</span>
                      <span lang="ja" className={s.previewReading}>{v.reading}</span>
                      <span className={s.previewMeaning}>{v[lang]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={s.previewSide}>
                <figure className={`panel ${s.previewCard}`} data-raised="">
                  <figcaption>{t.previewCard}</figcaption>
                  <span lang="ja" className={s.previewFront}>{preview.card.word}</span>
                  <span lang="ja" className={s.previewReading}>{preview.card.reading}</span>
                  <span className={s.previewMeaning}>{preview.card[lang]}</span>
                </figure>
                <div className={`panel ${s.previewKanji}`}>
                  <h3>Kanji</h3>
                  <span lang="ja" className={s.previewKanjiChar}>{preview.kanji.char}</span>
                  <span className={s.previewHv}>{preview.kanji.hv.join(", ")}</span>
                  <span className={s.previewMeaning}>{lang === "vi" && preview.kanji.vi ? preview.kanji.vi : preview.kanji.en.join(", ")}</span>
                </div>
                <div className={`panel ${s.previewGrammar}`}>
                  <h3>{t.lineGrammar}</h3>
                  <span lang="ja" className={s.previewPattern}>{preview.grammar.pattern}</span>
                  <span className={s.previewMeaning}>{preview.grammar.title[lang]}</span>
                </div>
              </div>
            </div>
            <Link href={`/lessons/${preview.lesson.lesson}`} className={`btn btnGhost ${s.previewLink}`}>
              {t.previewOpen(preview.lesson.lesson)} <Arrow />
            </Link>
          </section>
        )}

        <section className={s.closing} aria-labelledby="closing-h">
          <h2 id="closing-h">{t.closingH}</h2>
          <p>{t.closingP}</p>
          <Link href="/kana?mode=quiz" className="btn">{t.honestCta} <Arrow /></Link>
        </section>
      </main>

      <footer className={s.footer}>
        <p>
          <span lang="ja" className="brandMark">言葉</span> {t.footerA}
        </p>
        <p>{t.footerB}</p>
      </footer>
    </>
  );
}
