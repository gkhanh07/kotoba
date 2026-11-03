import Link from "next/link";
import { Arrow, SiteBar, SiteFooter } from "./SiteBar";
import { Street } from "./Street";
import { getLang } from "./LangSwitch";
import { dict } from "@/lib/i18n";
import { currentUser } from "@/lib/auth";
import { getKana, getKanji, getTests, getVocab } from "@/lib/content";
import { stopsOf } from "@/lib/library";
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
  { char: "あ", romaji: "a", lit: 3 },
  { char: "ぬ", romaji: "nu", lit: 1 },
  { char: "ヲ", romaji: "wo", lit: 0 },
];

export default async function Home() {
  const lang = await getLang();
  const user = await currentUser();
  if (user) {
    const [kana, kanji, vocab, tests] = await Promise.all([getKana(), getKanji(), getVocab(), getTests()]);
    // Fronts and detail links for the "Hay sai" block; the weak ids are only known in the browser.
    const fronts = itemLinks(kana, kanji, vocab);
    return (
      <>
        <SiteBar />
        <Dashboard
          fronts={fronts}
          stops={stopsOf([...kana, ...kanji, ...vocab])}
          lang={lang}
          name={user.profile?.name ?? user.email.split("@")[0]}
          profile={user.profile}
          kanaTotal={kana.length}
          kanjiTotal={kanji.length}
          vocabTotal={vocab.length}
          tests={tests.map((p) => ({ id: p.id, title: p.title[lang], minutes: p.minutes }))}
        />
        <SiteFooter />
      </>
    );
  }
  const t = dict(lang).home;
  const lampLabels = [t.lampMastered, t.lampLearning, t.lampUnseen];

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
        <section className={s.route} aria-labelledby="route-h">
          <div className={s.sectionHead}>
            <h2 id="route-h">{t.routeH}</h2>
            <p>
              {t.routeP}
            </p>
          </div>
          <ol className={s.line}>
            <li data-open="true">
              <Link href="/kana?script=hiragana" className={s.station}>
                <span lang="ja" className={s.stationKana}>ひらがな</span>
                <span className={s.stationName}>Hiragana <Arrow /></span>
                <span className={s.stationText}>{t.hiraganaText.a}<span lang="ja">すし</span>{t.hiraganaText.b}<span lang="ja">くすり</span>{t.hiraganaText.c}</span>
                <span className={s.stationMeta}>{t.openMeta}</span>
              </Link>
            </li>
            <li data-open="true">
              <Link href="/kana?script=katakana" className={s.station}>
                <span lang="ja" className={s.stationKana}>カタカナ</span>
                <span className={s.stationName}>Katakana <Arrow /></span>
                <span className={s.stationText}>{t.katakanaText.a}<span lang="ja">ラーメン</span>{t.katakanaText.b}<span lang="ja">ホテル</span>{t.katakanaText.c}</span>
                <span className={s.stationMeta}>{t.openMeta}</span>
              </Link>
            </li>
            <li data-open="false">
              <div className={s.station}>
                <span lang="ja" className={s.stationKana}>漢字</span>
                <span className={s.stationName}>Kanji</span>
                <span className={s.stationText}>{t.kanjiText}</span>
                <span className={s.stationMeta}>{t.soonMeta}</span>
              </div>
            </li>
          </ol>
        </section>

        <section className={s.honest} aria-labelledby="honest-h">
          <div className={s.sectionHead}>
            <h2 id="honest-h">{t.honestH}</h2>
            <p>
              {t.honestP1}
            </p>
            <p>
              {t.honestP2.a}<kbd>1</kbd>{t.honestP2.b}<kbd>4</kbd>{t.honestP2.c}<kbd>Enter</kbd>{t.honestP2.d}
            </p>
            <Link href="/kana?mode=quiz" className="btn">{t.honestCta} <Arrow /></Link>
          </div>
          <figure className={s.lamps}>
            <ul>
              {LAMPS.map((l, i) => (
                <li key={l.char} data-lit={l.lit}>
                  <span lang="ja" className={s.lampChar}>{l.char}</span>
                  <span className={s.lampRomaji}>{l.romaji}</span>
                  <span className={s.lampRow} role="img" aria-label={t.lampAria(l.lit)}>
                    {[0, 1, 2].map((n) => <i key={n} data-on={n < l.lit} />)}
                  </span>
                  <span className={s.lampLabel}>{lampLabels[i]}</span>
                </li>
              ))}
            </ul>
            <figcaption>{t.lampCaption}</figcaption>
          </figure>
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
