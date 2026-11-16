"use client";

import Link from "next/link";
import { useMemo } from "react";
import { examDate, examDay, type Profile } from "@/lib/account";
import { ACTIVITY_KEY, parseActivity, summarize, type Activity } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import { DEFAULT_MINUTES } from "@/config/session";
import { NEW_PER_DAY } from "@/config/srs";
import { currentLesson, stopsOf, type Grammar, type Kind } from "@/lib/library";
import { buildSession, minutesFor, parseSession, partsOf, resumable, runsIn, SESSION_KEY, todayOf, type Part } from "@/lib/session";
import { addDays, daysUntil, dueCount, isLearned } from "@/lib/srs";
import { learnedToday, today, useDeck, useStored } from "@/lib/store";
import { remaining } from "@/lib/test";
import { findSession } from "@/lib/testStore";
import { testText } from "@/lib/testText";
import { Arrow } from "./Arrow";
import s from "./dashboard.module.css";

// Today's minutes against the goal: an arc that fills, the numbers inside. One label for screen readers.
const R = 42, C = 2 * Math.PI * R;
function Ring({ minutes, goal, label }: { minutes: number; goal: number; label: (m: number, g: number) => string }) {
  return (
    <svg className={s.ring} viewBox="0 0 100 100" role="img" aria-label={label(minutes, goal)}>
      <circle cx="50" cy="50" r={R} className={s.ringTrack} />
      <circle cx="50" cy="50" r={R} className={s.ringFill} strokeDasharray={`${C * Math.min(1, minutes / goal)} ${C}`} transform="rotate(-90 50 50)" />
      <text x="50" y="50" className={s.ringNum}>{minutes}</text>
      <text x="50" y="68" className={s.ringOf}>/ {goal}</text>
    </svg>
  );
}

// Phase 41g: the totals, plan, heatmap, weak items and test scores moved to /progress.
export function Dashboard({ lang, name, profile, scope, tests, items, grammar }: {
  /** What /session builds from (phase 41d): the goal's items with their lesson, and its grammar. */
  items: { id: string; kind: Kind; lesson: number }[]; grammar: Grammar[];
  lang: Lang; name: string; profile: Profile | null; scope: { kana: string[]; kanji: string[]; vocab: string[] };
  tests: { id: string; title: string; minutes: number }[];
}) {
  const t = text[lang];
  const deck = useDeck();
  const activityRaw = useStored(ACTIVITY_KEY);
  const sessionRaw = useStored(SESSION_KEY);

  const data = useMemo(() => {
    if (!deck || activityRaw === undefined) return null;
    let activity: Activity | null = parseActivity(activityRaw === "!unavailable" ? null : activityRaw);
    const bad = !deck.ok || !activity;
    activity ??= { days: {} };
    const now = new Date();
    const day = today();
    const { srs } = deck;
    const learned = (id: string) => isLearned(srs, id);
    const summary = summarize(activity, now);
    const kinds = new Map(items.map((i) => [i.id, i.kind]));
    // The same session /session would resume or build, so the parts and minutes here are what the button opens.
    const session = todayOf(
      resumable(parseSession(sessionRaw === "!unavailable" ? null : (sessionRaw ?? null), day, "full"), runsIn(items, grammar)),
      buildSession({ items, grammar, srs, today: day, learnedToday: learnedToday(), perDay: NEW_PER_DAY, mode: "full" }),
    );
    const stops = stopsOf(items);
    const lesson = currentLesson(stops, srs);
    const stop = stops.find((p) => p.lesson === lesson);
    const log = activity.days;
    return {
      bad,
      now,
      day,
      summary,
      session,
      parts: partsOf(session.steps, session.state === "done" ? session.steps.length : session.index, (id) => kinds.get(id)),
      minutesLeft: minutesFor(session.steps.slice(session.index)),
      week: [6, 5, 4, 3, 2, 1, 0].map((n) => addDays(day, -n)).map((d) => ({ day: d, minutes: log[d]?.minutes.length ?? 0 })),
      lesson: lesson === undefined || !stop ? null : { lesson, pct: Math.round((100 * stop.ids.filter(learned).length) / stop.ids.length) },
      tomorrow: dueCount(srs, addDays(day, 1), [...scope.kana, ...scope.kanji, ...scope.vocab]),
      at: now.getTime(),
      attempt: findSession(), // read here, after hydration: sessionStorage does not exist on the server
    };
  }, [deck, activityRaw, sessionRaw, items, grammar, scope]);
  const paper = data?.attempt && tests.find((p) => p.id === data.attempt?.id);
  // Past the deadline the attempt is submitted on open, so "continue" would be a false promise.
  const resume = paper && data.attempt && remaining(data.attempt.session.startedAt, paper.minutes, data.at) > 0 ? paper : undefined;

  const goal = profile?.goal;
  const exam = profile?.exam ? examDate(profile.exam) : null;
  const examKey = profile?.exam ? examDay(profile.exam) : null;
  const days = examKey && data ? daysUntil(examKey, data.day) : null;

  return (
    <main className={s.app}>
      <section className={`panel ${s.hero}`} data-raised="" aria-labelledby="dash-title">
        <h1 id="dash-title" className={s.title}>{data && <><span lang="ja">{greet(data.now.getHours())}</span>, </>}{name}</h1>

        {!data ? <p role="status" className={s.note}>{t.loading}</p> : (
          <>
            <section className={s.session} aria-labelledby="dash-session">
              <h2 id="dash-session">{t.session}</h2>
              <ol className={s.parts}>
                {data.parts.map((p) => (
                  <li key={p.part} data-done={p.done || undefined}>
                    <span>{t.part[p.part]}</span>
                    <span>{p.count ? t.partLine(p.count, p.minutes) : "—"}</span>
                    <span className={s.tick}>{p.done && <>✓<span className="sr-only">{t.partDone}</span></>}</span>
                  </li>
                ))}
              </ol>
              <Link className="btn" href={data.session.state === "done" && data.session.steps.length === 0 ? "/learned" : "/session"}>
                {data.session.state === "resume" ? t.resume
                  : data.session.state === "done" ? t.again
                  : data.parts[0].count === 0 ? t.learnNew(data.minutesLeft)
                  : t.start(data.minutesLeft)} <Arrow />
              </Link>
              {resume && data.attempt && (
                <p className={s.resume}>
                  <Link href={`/test/${resume.id}`}>{testText[lang].resume(resume.title, data.attempt.session.current + 1, data.attempt.session.answers.length)}</Link>
                </p>
              )}
            </section>

            <aside className={s.side} aria-label={t.week}>
              <Ring minutes={data.summary.minutesToday} goal={profile?.minutes ?? DEFAULT_MINUTES} label={t.ring} />
              <ol className={s.week}>
                {data.week.map((d) => (
                  <li key={d.day} data-on={d.minutes > 0 || undefined} data-today={d.day === data.day || undefined}>
                    <span className="sr-only">{t.dot(`${d.day.slice(8)}/${d.day.slice(5, 7)}`, d.minutes)}</span>
                  </li>
                ))}
              </ol>
              <p className={s.streak}>{t.streak(data.summary.streak)}</p>
            </aside>

            <dl className={s.strip}>
              <div><dt>{t.lessonLabel}</dt><dd>{data.lesson ? t.lesson(data.lesson.lesson, data.lesson.pct) : t.allDone}</dd></div>
              <div><dt>{t.tomorrowLabel}</dt><dd>{t.tomorrow(data.tomorrow)}</dd></div>
              <div>
                <dt>{t.goalLabel}</dt>
                <dd>{!goal ? <Link href="/onboarding">{t.setGoal}</Link>
                  : exam && days !== null && days >= 0 ? `${goal} · ${dateOf(exam, lang)} · ${days > 0 ? t.daysLeft(days) : t.examToday}`
                  : goal}</dd>
              </div>
            </dl>
          </>
        )}
      </section>

      {data?.bad && <p role="alert" className={`notice ${s.warning}`} data-tone="warn">{t.warning}</p>}
    </main>
  );
}

const dateOf = (d: Date, lang: Lang) => new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" }).format(d);

const greet = (hour: number) => (hour >= 5 && hour < 10 ? "おはよう" : hour >= 10 && hour < 18 ? "こんにちは" : "こんばんは");

const vi = {
  session: "Phiên học hôm nay",
  part: { review: "Ôn tập", new: "Từ mới", kanji: "Kanji", grammar: "Ngữ pháp", practice: "Luyện tập" } as Record<Part, string>,
  partLine: (n: number, min: number) => `${n} mục · ~${min} phút`,
  partDone: "đã xong",
  start: (min: number) => `Bắt đầu · ${min} phút`,
  learnNew: (min: number) => `Học bài mới · ${min} phút`,
  resume: "Tiếp tục phiên dở",
  again: "Ôn lại từ hôm nay",
  week: "Tuần này",
  ring: (m: number, g: number) => `${m} trên ${g} phút mục tiêu hôm nay`,
  dot: (d: string, m: number) => (m ? `${d}: ${m} phút` : `${d}: chưa học`),
  streak: (n: number) => `${n} ngày liên tục`,
  lessonLabel: "Đang học",
  lesson: (n: number, pct: number) => `Bài ${n} · ${pct}%`,
  allDone: "Đã học hết",
  tomorrowLabel: "Ôn ngày mai",
  tomorrow: (n: number) => `${n} thẻ`,
  goalLabel: "Mục tiêu",
  setGoal: "Đặt mục tiêu",
  daysLeft: (n: number) => `còn ${n} ngày`,
  examToday: "thi hôm nay",
  loading: "Đang tải tiến độ…",
  warning: "Không đọc được tiến độ lưu trong trình duyệt. Số liệu có thể thiếu.",
};

const en: typeof vi = {
  session: "Today’s session",
  part: { review: "Review", new: "New words", kanji: "Kanji", grammar: "Grammar", practice: "Practice" },
  partLine: (n, min) => `${n} ${n === 1 ? "item" : "items"} · ~${min} min`,
  partDone: "done",
  start: (min) => `Start · ${min} min`,
  learnNew: (min) => `Learn new · ${min} min`,
  resume: "Resume session",
  again: "Go over today’s items",
  week: "This week",
  ring: (m, g) => `${m} of ${g} goal minutes today`,
  dot: (d, m) => (m ? `${d}: ${m} min` : `${d}: no study`),
  streak: (n) => `${n}-day streak`,
  lessonLabel: "Studying",
  lesson: (n, pct) => `Lesson ${n} · ${pct}%`,
  allDone: "All learned",
  tomorrowLabel: "Due tomorrow",
  tomorrow: (n) => `${n} ${n === 1 ? "card" : "cards"}`,
  goalLabel: "Goal",
  setGoal: "Set a goal",
  daysLeft: (n) => `${n} days left`,
  examToday: "exam today",
  loading: "Loading progress…",
  warning: "Couldn't read progress saved in this browser. Numbers may be incomplete.",
};

const text: Record<Lang, typeof vi> = { vi, en };
