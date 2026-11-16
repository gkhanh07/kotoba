"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { examDate, examDay, type Profile } from "@/lib/account";
import { ACTIVITY_KEY, heat, parseActivity, summarize, type Activity } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import { DEFAULT_MINUTES } from "@/config/session";
import { NEW_PER_DAY, WEAK_LIST_SIZE } from "@/config/srs";
import { STUDY_TIME_ZONE } from "@/config/time";
import { perDayFor } from "@/lib/daily";
import { currentLesson, stopsOf, type Grammar, type Kind } from "@/lib/library";
import { buildSession, minutesFor, parseSession, partsOf, resumable, runsIn, SESSION_KEY, todayOf, type Part } from "@/lib/session";
import { INTERVALS, addDays, daysUntil, dueCount, isLearned } from "@/lib/srs";
import { weakItems, type ItemLink } from "@/lib/weak";
import { learnedToday, today, useDeck } from "@/lib/store";
import { headline, remaining, type TestScore } from "@/lib/test";
import { findSession } from "@/lib/testStore";
import { testText } from "@/lib/testText";
import s from "./dashboard.module.css";
import { Heatmap } from "./Heatmap";
import { WeakList } from "./WeakList";

// Copied from SiteBar: that file pulls server-only code, so a client component can't import it.
function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

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

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};
// undefined = server render / hydration; "!unavailable" = storage blocked.
function useStored(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => { try { return localStorage.getItem(key); } catch { return "!unavailable"; } },
    () => undefined,
  );
}


export function Dashboard({ lang, name, profile, scope, tests, scores = [], fronts, items, grammar }: {
  fronts: Record<string, ItemLink>;
  /** What /session builds from (phase 41d): the goal's items with their lesson, and its grammar. */
  items: { id: string; kind: Kind; lesson: number }[]; grammar: Grammar[];
  lang: Lang; name: string; profile: Profile | null; scope: { kana: string[]; kanji: string[]; vocab: string[] };
  tests: { id: string; title: string; minutes: number }[];
  /** The account's mock test scores, newest first (phase 40g); papers no longer listed are left out. */
  scores?: TestScore[];
}) {
  const t = text[lang];
  const titles = new Map(tests.map((p) => [p.id, p.title]));
  const taken = scores.filter((r) => titles.has(r.testId));
  const deck = useDeck();
  const activityRaw = useStored(ACTIVITY_KEY);
  const sessionRaw = useStored(SESSION_KEY);

  const data = useMemo(() => {
    if (!deck || activityRaw === undefined) return null;
    let activity: Activity | null = parseActivity(activityRaw);
    const bad = !deck.ok || !activity;
    activity ??= { days: {} };
    const now = new Date();
    const day = today();
    const { srs } = deck;
    const learned = (id: string) => isLearned(srs, id);
    // Only cards of items in scope: one whose item left the content (or the goal) is never offered for review.
    const kanaDue = dueCount(srs, day, scope.kana), kanjiDue = dueCount(srs, day, scope.kanji), vocabDue = dueCount(srs, day, scope.vocab);
    const dueTotal = kanaDue + kanjiDue + vocabDue;
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
      kanaLearned: scope.kana.filter(learned).length,
      kanaDue,
      kanjiLearned: scope.kanji.filter(learned).length,
      kanjiDue,
      vocabLearned: scope.vocab.filter(learned).length,
      vocabDue,
      dueTotal,
      // Everything in the goal's scope not yet learned: what the daily plan has to cover by exam day.
      left: [...scope.kana, ...scope.kanji, ...scope.vocab].filter((id) => !learned(id)).length,
      weak: weakItems(srs, fronts, WEAK_LIST_SIZE),
      summary,
      heat: heat(activity, day),
      session,
      parts: partsOf(session.steps, session.state === "done" ? session.steps.length : session.index, (id) => kinds.get(id)),
      minutesLeft: minutesFor(session.steps.slice(session.index)),
      week: [6, 5, 4, 3, 2, 1, 0].map((n) => addDays(day, -n)).map((d) => ({ day: d, minutes: log[d]?.minutes.length ?? 0 })),
      lesson: lesson === undefined || !stop ? null : { lesson, pct: Math.round((100 * stop.ids.filter(learned).length) / stop.ids.length) },
      tomorrow: dueCount(srs, addDays(day, 1), [...scope.kana, ...scope.kanji, ...scope.vocab]),
      at: now.getTime(),
      attempt: findSession(), // read here, after hydration: sessionStorage does not exist on the server
    };
  }, [deck, activityRaw, sessionRaw, fronts, items, grammar, scope]);
  const paper = data?.attempt && tests.find((p) => p.id === data.attempt?.id);
  // Past the deadline the attempt is submitted on open, so "continue" would be a false promise.
  const resume = paper && data.attempt && remaining(data.attempt.session.startedAt, paper.minutes, data.at) > 0 ? paper : undefined;

  const goal = profile?.goal;
  const exam = profile?.exam ? examDate(profile.exam) : null;
  const examKey = profile?.exam ? examDay(profile.exam) : null;
  const days = examKey && data ? daysUntil(examKey, data.day) : null;
  const perDay = data ? perDayFor(data.left, days) : null;

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

      {data && (
        <>

          <div className={s.layout}>
            <div className={s.column}>
              <section className={`panel ${s.section}`} aria-labelledby="dash-progress">
                <h2 id="dash-progress">{t.progress}</h2>
                <table className={s.table}>
                  <caption className="sr-only">{t.progress}</caption>
                  <thead><tr><th scope="col">{t.area}</th><th scope="col">{t.today}</th><th scope="col">{t.memorized}</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Kana</th><td>{data.summary.today.kana}</td><td>{data.kanaLearned} / {scope.kana.length}</td></tr>
                    <tr><th scope="row">{t.vocab}</th><td>{data.summary.today.vocab}</td><td>{data.vocabLearned} / {scope.vocab.length}</td></tr>
                    <tr><th scope="row">Kanji</th><td>{data.summary.today.kanji}</td><td>{data.kanjiLearned} / {scope.kanji.length}</td></tr>
                    <tr><th scope="row">{t.grammar}</th><td colSpan={2}><Link href="/grammar">{t.grammarLink}</Link></td></tr>
                  </tbody>
                </table>
              </section>

              <section className={`panel ${s.section}`} aria-labelledby="dash-review">
                <h2 id="dash-review">{t.review}</h2>
                {data.dueTotal === 0 ? <p>{t.reviewNone}</p> : (
                  <ul className={s.list}>
                    {data.kanaDue > 0 && <li><span>{t.reviewKana(data.kanaDue)}</span><Link href="/review?kind=kana">{t.practise}</Link></li>}
                    {data.kanjiDue > 0 && <li><span>{t.reviewKanji(data.kanjiDue)}</span><Link href="/review?kind=kanji">{t.practise}</Link></li>}
                    {data.vocabDue > 0 && <li><span>{t.reviewVocab(data.vocabDue)}</span><Link href="/review?kind=vocab">{t.practise}</Link></li>}
                  </ul>
                )}
                <p className={s.note}>{t.reviewNote(INTERVALS)}</p>
                <p className={s.note}><Link href="/learned">{t.learned}</Link></p>
              </section>

              <WeakList items={data.weak} lang={lang} />
            </div>

            <div className={s.column}>
              <section className={`panel ${s.section}`} aria-labelledby="dash-upcoming">
                <h2 id="dash-upcoming">{t.upcoming}</h2>
                {exam && days !== null && days >= 0 ? (
                  <p>{t.exam(goal)} · {dateOf(exam, lang)}</p>
                ) : (
                  <p className={s.list}><span>{exam ? t.examPast : t.examNone}</span> <Link href="/onboarding">{t.pick}</Link></p>
                )}
                {perDay !== null && <p>{t.plan(data.left, perDay)}</p>}
              </section>

              <Heatmap heat={data.heat} lang={lang} />

              <section className={`panel ${s.section}`} aria-labelledby="dash-history">
                <h2 id="dash-history">{t.history}</h2>
                {data.summary.recent.length === 0 ? <p>{t.empty}</p> : (
                  <ol className={s.list}>
                    {data.summary.recent.map((r) => {
                      const ago = daysUntil(data.day, r.day);
                      const label = ago === 0 ? t.todayLabel : ago === 1 ? t.yesterday : `${r.day.slice(8)}/${r.day.slice(5, 7)}`;
                      return <li key={r.day}><span>{label}</span><span>{t.dayLine(r.minutes, r.kana, r.kanji, r.vocab)}</span></li>;
                    })}
                  </ol>
                )}
              </section>
              {taken.length > 0 && (
                <section className={`panel ${s.section}`} aria-labelledby="dash-tests">
                  <h2 id="dash-tests">{t.tests}</h2>
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
          </div>

          {data.bad && <p role="alert" className={`notice ${s.warning}`} data-tone="warn">{t.warning}</p>}
        </>
      )}
    </main>
  );
}

// dd/mm in the study time zone, so the server render and the browser agree.
const dayOf = (at: number) => new Date(at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", timeZone: STUDY_TIME_ZONE });

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
  progress: "Tiến độ",
  area: "Phần",
  vocab: "Từ vựng",
  grammar: "Ngữ pháp",
  grammarLink: "Xem ngữ pháp",
  today: "Hôm nay",
  memorized: "Đã học",
  review: "Đến hạn ôn",
  reviewKana: (n: number) => `${n} chữ kana đến hạn ôn`,
  reviewKanji: (n: number) => `${n} chữ kanji đến hạn ôn`,
  reviewVocab: (n: number) => `${n} từ đến hạn ôn`,
  reviewNone: "Hôm nay không có gì đến hạn ôn.",
  reviewNote: (gaps: number[]) => `Sau mỗi lần trả lời đúng, thời gian đến lần ôn tiếp theo lần lượt là ${gaps.join(", ")} ngày. Trả lời sai thì mục đó sẽ được ôn lại ngay trong ngày.`,
  practise: "Ôn tập",
  upcoming: "Sắp tới",
  exam: (g?: string) => (g ? `Kỳ thi JLPT ${g}` : "Kỳ thi JLPT"),
  examNone: "Chưa chọn kỳ thi",
  examPast: "Kỳ thi đã qua",
  pick: "Chọn kỳ thi",
  plan: (left: number, n: number) => (left === 0 ? "Bạn đã học hết các mục của mục tiêu."
    : `Còn ${left} mục chưa học: cần ${n} mục mới mỗi ngày để kịp ngày thi${n > NEW_PER_DAY ? ` (buổi học mỗi ngày đưa vào ${NEW_PER_DAY})` : ""}.`),
  learned: "Xem và đặt lại mục đã học",
  history: "Gần đây",
  tests: "Kết quả thi thử",
  todayLabel: "Hôm nay",
  yesterday: "Hôm qua",
  dayLine: (min: number, kana: number, kanji: number, vocab: number) => `${min} phút · ${kana} kana · ${kanji} kanji · ${vocab} từ`,
  empty: "Chưa có buổi học nào. Bạn có thể bắt đầu từ bảng chữ cái.",
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
  progress: "Progress",
  area: "Area",
  vocab: "Vocabulary",
  grammar: "Grammar",
  grammarLink: "Open grammar",
  today: "Today",
  memorized: "Learnt",
  review: "Due for review",
  reviewKana: (n) => `${n} kana due`,
  reviewKanji: (n) => `${n} kanji due`,
  reviewVocab: (n) => `${n} ${n === 1 ? "word" : "words"} due`,
  reviewNone: "Nothing is due today.",
  reviewNote: (gaps) => `Each right answer pushes the next review out: ${gaps.join(", ")} days. A miss brings the item back the same day.`,
  practise: "Practise",
  upcoming: "Upcoming",
  exam: (g) => (g ? `JLPT ${g} exam` : "JLPT exam"),
  examNone: "No exam date set",
  examPast: "This exam has passed",
  pick: "Pick an exam",
  plan: (left, n) => (left === 0 ? "You have learned every item of your goal."
    : `${left} items left: ${n} new a day to finish by the exam${n > NEW_PER_DAY ? ` (the daily session brings in ${NEW_PER_DAY})` : ""}.`),
  learned: "See and reset studied items",
  history: "Recent",
  tests: "Mock test results",
  todayLabel: "Today",
  yesterday: "Yesterday",
  dayLine: (min, kana, kanji, vocab) => `${min} min · ${kana} kana · ${kanji} kanji · ${vocab} ${vocab === 1 ? "word" : "words"}`,
  empty: "No study sessions yet. The alphabet is the quickest start.",
  loading: "Loading progress…",
  warning: "Couldn't read progress saved in this browser. Numbers may be incomplete.",
};

const text: Record<Lang, typeof vi> = { vi, en };
