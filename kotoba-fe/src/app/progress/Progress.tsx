"use client";

import Link from "next/link";
import { useMemo } from "react";
import { examDate, examDay, type Profile } from "@/lib/account";
import { ACTIVITY_KEY, heat, parseActivity, summarize } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import { DEFAULT_MINUTES } from "@/config/session";
import { NEW_PER_DAY, WEAK_LIST_SIZE } from "@/config/srs";
import { STUDY_TIME_ZONE } from "@/config/time";
import { XP_PER_LEVEL } from "@/config/xp";
import { perDayFor } from "@/lib/daily";
import { levelLabel, type Level } from "@/lib/library";
import { addDays, daysUntil, isLearned } from "@/lib/srs";
import { today, useDeck, useStored } from "@/lib/store";
import { headline, type TestScore } from "@/lib/test";
import { weakItems, type ItemLink } from "@/lib/weak";
import { levelOf, xpOf } from "@/lib/xp";
import { Heatmap } from "../Heatmap";
import { WeakList } from "../WeakList";
import s from "./progress.module.css";

// Phase 41g (AC-15): the numbers that used to sit under Today, on their own page.
export function Progress({ lang, profile, tests, scores = [], fronts, words, kanji, grammar, scope, levels }: {
  lang: Lang; profile: Profile | null;
  tests: { id: string; title: string }[];
  /** The account's mock test scores, newest first; papers no longer listed are left out. */
  scores?: TestScore[];
  fronts: Record<string, ItemLink>;
  /** Every word, kanji and grammar id, for the totals. */
  words: string[]; kanji: string[]; grammar: string[];
  /** The goal's kana, kanji and words: what the exam plan has to cover. */
  scope: string[];
  /** Every item of each level (kana counts as N5), for the coverage bars. */
  levels: { level: Level; ids: string[] }[];
}) {
  const t = text[lang];
  const titles = new Map(tests.map((p) => [p.id, p.title]));
  const taken = scores.filter((r) => titles.has(r.testId));
  const deck = useDeck();
  const activityRaw = useStored(ACTIVITY_KEY);
  const goalMinutes = profile?.minutes ?? DEFAULT_MINUTES;

  const data = useMemo(() => {
    if (!deck || activityRaw === undefined) return null;
    const parsed = parseActivity(activityRaw === "!unavailable" ? null : activityRaw);
    const activity = parsed ?? { days: {} };
    const day = today();
    const learned = (id: string) => isLearned(deck.srs, id);
    const count = (ids: string[]) => ids.filter(learned).length;
    const week = [6, 5, 4, 3, 2, 1, 0].map((n) => addDays(day, -n)).map((d) => ({ day: d, minutes: activity.days[d]?.minutes.length ?? 0 }));
    return {
      bad: !deck.ok || !parsed,
      day,
      xp: xpOf(deck.srs),
      streak: summarize(activity, new Date()).streak,
      totals: [count(words), count(kanji), count(grammar)],
      week,
      top: Math.max(goalMinutes, ...week.map((d) => d.minutes)),
      levels: levels.map((l) => ({ ...l, done: count(l.ids) })),
      left: scope.length - count(scope),
      heat: heat(activity, day),
      weak: weakItems(deck.srs, fronts, WEAK_LIST_SIZE),
    };
  }, [deck, activityRaw, words, kanji, grammar, levels, scope, fronts, goalMinutes]);

  const exam = profile?.exam ? examDate(profile.exam) : null;
  const examKey = profile?.exam ? examDay(profile.exam) : null;
  const days = examKey && data ? daysUntil(examKey, data.day) : null;
  const perDay = data ? perDayFor(data.left, days) : null;
  const lv = data && levelOf(data.xp);

  return (
    <main className={s.app}>
      <h1 className={s.title}>{t.title}</h1>
      {!data || !lv ? <p role="status" className={s.note}>{t.loading}</p> : (
        <>
          <section className={`panel ${s.level}`} data-raised="" aria-labelledby="pr-level">
            <h2 id="pr-level">{t.level(lv.level)}</h2>
            <p className={s.xp}>{t.xp(data.xp, lv.need, lv.level + 1)}</p>
            <progress className="meter" value={lv.into} max={XP_PER_LEVEL} aria-label={t.inLevel(lv.level)} />
            <dl className={s.totals}>
              <div><dt>{t.streak}</dt><dd>{data.streak}</dd></div>
              {t.totals.map((label, i) => <div key={label}><dt>{label}</dt><dd>{data.totals[i]}</dd></div>)}
            </dl>
            <p className={s.note}>{t.xpNote}</p>
          </section>

          <div className={s.grid}>
            <section className={`panel ${s.section}`} aria-labelledby="pr-week">
              <h2 id="pr-week">{t.week}</h2>
              {/* The goal line is drawn in each track (::after at --goal), so it shares the bars' scale and box. */}
              <ol className={s.days} aria-label={t.weekList} style={{ "--goal": `${(100 * goalMinutes) / data.top}%` } as React.CSSProperties}>
                  {data.week.map((d) => {
                    const dm = `${d.day.slice(8)}/${d.day.slice(5, 7)}`;
                    return (
                      <li key={d.day} aria-label={t.dayLine(dm, d.minutes)} data-met={d.minutes >= goalMinutes || undefined}>
                        <span className={s.track} aria-hidden="true"><span className={s.fill} style={{ height: `${(100 * d.minutes) / data.top}%` }} /></span>
                        <span className={s.dm} aria-hidden="true">{dm}</span>
                      </li>
                    );
                  })}
              </ol>
              <p className={s.note}>{t.goal(goalMinutes)}</p>
            </section>

            <section className={`panel ${s.section}`} aria-labelledby="pr-cover">
              <h2 id="pr-cover">{t.cover}</h2>
              <ul className={s.cover}>
                {data.levels.map((l) => (
                  <li key={l.level}>
                    <span>{levelLabel(l.level)}</span>
                    <progress className="meter" value={l.done} max={l.ids.length || 1} aria-label={`${levelLabel(l.level)}: ${l.done} / ${l.ids.length}`} />
                    <span>{l.ids.length ? Math.round((100 * l.done) / l.ids.length) : 0}%</span>
                  </li>
                ))}
              </ul>
              <p className={s.note}><Link href="/learned">{t.learned}</Link></p>
            </section>

            <section className={`panel ${s.section}`} aria-labelledby="pr-plan">
              <h2 id="pr-plan">{t.upcoming}</h2>
              {exam && days !== null && days >= 0 ? (
                <p>{t.exam(profile?.goal)} · {dateOf(exam, lang)}</p>
              ) : (
                <p className={s.row}><span>{exam ? t.examPast : t.examNone}</span> <Link href="/onboarding">{t.pick}</Link></p>
              )}
              {perDay !== null && <p>{t.plan(data.left, perDay)}</p>}
            </section>

            {taken.length > 0 && (
              <section className={`panel ${s.section}`} aria-labelledby="pr-tests">
                <h2 id="pr-tests">{t.tests}</h2>
                <ol className={s.list}>
                  {taken.map((r) => (
                    <li key={`${r.testId}@${r.at}`}>
                      <Link href={`/test/${r.testId}`}>{titles.get(r.testId)}</Link>
                      <span>{dayOf(r.at)} · {headline(r.score, r.total)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <Heatmap heat={data.heat} lang={lang} />
          <WeakList items={data.weak} lang={lang} />
          {data.bad && <p role="alert" className="notice" data-tone="warn">{t.warning}</p>}
        </>
      )}
    </main>
  );
}

// dd/mm in the study time zone, so the server render and the browser agree.
const dayOf = (at: number) => new Date(at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", timeZone: STUDY_TIME_ZONE });
const dateOf = (d: Date, lang: Lang) => new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" }).format(d);

const vi = {
  title: "Tiến độ",
  loading: "Đang tải tiến độ…",
  level: (n: number) => `Cấp ${n}`,
  xp: (xp: number, need: number, next: number) => `${xp} XP · còn ${need} XP lên cấp ${next}`,
  inLevel: (n: number) => `XP trong cấp ${n}`,
  xpNote: "XP tính từ thẻ đang nhớ: mỗi thẻ 5 XP, thêm 10 XP cho mỗi lần ôn đúng liên tiếp. Quên thẻ thì XP giảm theo.",
  streak: "Chuỗi ngày",
  totals: ["Từ đã học", "Kanji đã học", "Ngữ pháp đã học"],
  week: "Tuần này",
  weekList: "Phút học 7 ngày qua",
  dayLine: (d: string, m: number) => `${d}: ${m} phút`,
  goal: (m: number) => `Mục tiêu ${m} phút/ngày`,
  cover: "Độ phủ theo cấp",
  learned: "Xem và đặt lại mục đã học",
  upcoming: "Sắp tới",
  exam: (g?: string) => (g ? `Kỳ thi JLPT ${g}` : "Kỳ thi JLPT"),
  examNone: "Chưa chọn kỳ thi",
  examPast: "Kỳ thi đã qua",
  pick: "Chọn kỳ thi",
  plan: (left: number, n: number) => (left === 0 ? "Bạn đã học hết các mục của mục tiêu."
    : `Còn ${left} mục chưa học: cần ${n} mục mới mỗi ngày để kịp ngày thi${n > NEW_PER_DAY ? ` (buổi học mỗi ngày đưa vào ${NEW_PER_DAY})` : ""}.`),
  tests: "Kết quả thi thử",
  warning: "Không đọc được tiến độ lưu trong trình duyệt. Số liệu có thể thiếu.",
};

const en: typeof vi = {
  title: "Progress",
  loading: "Loading progress…",
  level: (n) => `Level ${n}`,
  xp: (xp, need, next) => `${xp} XP · ${need} XP to level ${next}`,
  inLevel: (n) => `XP in level ${n}`,
  xpNote: "XP comes from the cards you remember: 5 XP a card, plus 10 XP for each right answer in a row. Forgetting a card takes XP away.",
  streak: "Day streak",
  totals: ["Words learnt", "Kanji learnt", "Grammar learnt"],
  week: "This week",
  weekList: "Study minutes, last 7 days",
  dayLine: (d, m) => `${d}: ${m} min`,
  goal: (m) => `Goal ${m} min a day`,
  cover: "Coverage by level",
  learned: "See and reset studied items",
  upcoming: "Upcoming",
  exam: (g) => (g ? `JLPT ${g} exam` : "JLPT exam"),
  examNone: "No exam date set",
  examPast: "This exam has passed",
  pick: "Pick an exam",
  plan: (left, n) => (left === 0 ? "You have learned every item of your goal."
    : `${left} items left: ${n} new a day to finish by the exam${n > NEW_PER_DAY ? ` (the daily session brings in ${NEW_PER_DAY})` : ""}.`),
  tests: "Mock test results",
  warning: "Couldn't read progress saved in this browser. Numbers may be incomplete.",
};

const text: Record<Lang, typeof vi> = { vi, en };
