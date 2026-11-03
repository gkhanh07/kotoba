"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { examDate, examDay, type Profile } from "@/lib/account";
import { ACTIVITY_KEY, continueHref, parseActivity, summarize, type Activity } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import { WEAK_LIST_SIZE } from "@/config/srs";
import { INTERVALS, daysUntil, isDue, isLearned, type Srs } from "@/lib/srs";
import { weakItems, type ItemLink } from "@/lib/weak";
import { today, useDeck } from "@/lib/store";
import { remaining } from "@/lib/test";
import { findSession } from "@/lib/testStore";
import { testText } from "@/lib/testText";
import s from "./dashboard.module.css";
import { WeakList } from "./WeakList";

// Copied from SiteBar: that file pulls server-only code, so a client component can't import it.
function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
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

const isKana = (id: string) => id.startsWith("hiragana:") || id.startsWith("katakana:");
const isVocab = (id: string) => id.startsWith("vocab:");
const isKanji = (id: string) => id.startsWith("kanji:");
const count = (s: Srs, area: (id: string) => boolean, ok: (id: string) => boolean) =>
  Object.keys(s).filter((id) => area(id) && ok(id)).length;

export function Dashboard({ lang, name, profile, kanaTotal, kanjiTotal, vocabTotal, tests, fronts }: {
  fronts: Record<string, ItemLink>;
  lang: Lang; name: string; profile: Profile | null; kanaTotal: number; kanjiTotal: number; vocabTotal: number;
  tests: { id: string; title: string; minutes: number }[];
}) {
  const t = text[lang];
  const deck = useDeck();
  const activityRaw = useStored(ACTIVITY_KEY);

  const data = useMemo(() => {
    if (!deck || activityRaw === undefined) return null;
    let activity: Activity | null = parseActivity(activityRaw);
    const bad = !deck.ok || !activity;
    activity ??= { days: {} };
    const now = new Date();
    const day = today();
    const { srs } = deck;
    const due = (id: string) => isDue(srs[id], day);
    const learned = (id: string) => isLearned(srs, id);
    return {
      bad,
      now,
      day,
      kanaLearned: count(srs, isKana, learned),
      kanaDue: count(srs, isKana, due),
      kanjiLearned: count(srs, isKanji, learned),
      kanjiDue: count(srs, isKanji, due),
      vocabLearned: count(srs, isVocab, learned),
      vocabDue: count(srs, isVocab, due),
      weak: weakItems(srs, fronts, WEAK_LIST_SIZE),
      summary: summarize(activity, now),
      at: now.getTime(),
      attempt: findSession(), // read here, after hydration: sessionStorage does not exist on the server
    };
  }, [deck, activityRaw, fronts]);
  const paper = data?.attempt && tests.find((p) => p.id === data.attempt?.id);
  // Past the deadline the attempt is submitted on open, so "continue" would be a false promise.
  const resume = paper && data.attempt && remaining(data.attempt.session.startedAt, paper.minutes, data.at) > 0 ? paper : undefined;

  const goal = profile?.goal;
  const exam = profile?.exam ? examDate(profile.exam) : null;
  const examKey = profile?.exam ? examDay(profile.exam) : null;
  const days = examKey && data ? daysUntil(examKey, data.day) : null;

  return (
    <main className={s.app}>
      <header className={s.heading}>
        <h1>{data && <><span lang="ja">{greet(data.now.getHours())}</span>, </>}{name}</h1>
        <p>
          {!goal ? <Link href="/onboarding">{t.setGoal}</Link>
            : days !== null && days > 0 ? t.goal(goal, days)
            : days === 0 ? t.goalToday(goal)
            : t.goalOnly(goal)}
        </p>
      </header>

      {!data ? <p role="status" className={s.note}>{t.loading}</p> : (
        <>
          <div className={s.stage}>
            <span>{t.stage}</span>
            <progress aria-label={t.stage} value={data.kanaLearned} max={kanaTotal} />
            <span>{data.kanaLearned} / {kanaTotal}</span>
          </div>

          <dl className={s.stats}>
            <div><dt>{t.streakLabel}</dt><dd>{t.streak(data.summary.streak)}</dd></div>
            <div>
              <dt>{t.minutesLabel}</dt>
              <dd>{t.minutes(data.summary.minutesToday, profile?.minutes)}</dd>
              {profile?.minutes && <progress aria-label={t.minutesLabel} value={Math.min(data.summary.minutesToday, profile.minutes)} max={profile.minutes} />}
            </div>
            <div><dt>{t.review}</dt><dd>{data.kanaDue + data.kanjiDue + data.vocabDue}</dd></div>
          </dl>

          <div className={s.continue}>
            <Link className="btn" href={continueHref(data.summary.last)}>{t.continue} <Arrow /></Link>
            <p>{t.continueWhat(data.summary.last)}</p>
          </div>

          {resume && data.attempt && (
            <p className={s.resume}>
              <Link href={`/test/${resume.id}`}>{testText[lang].resume(resume.title, data.attempt.session.current + 1, data.attempt.session.answers.length)}</Link>
            </p>
          )}

          <section className={s.section} aria-labelledby="dash-progress">
            <h2 id="dash-progress">{t.progress}</h2>
            <table className={s.table}>
              <caption className="sr-only">{t.progress}</caption>
              <thead><tr><th scope="col">{t.area}</th><th scope="col">{t.today}</th><th scope="col">{t.memorized}</th></tr></thead>
              <tbody>
                <tr><th scope="row">Kana</th><td>{data.summary.today.kana}</td><td>{data.kanaLearned} / {kanaTotal}</td></tr>
                <tr><th scope="row">{t.vocab}</th><td>{data.summary.today.vocab}</td><td>{data.vocabLearned} / {vocabTotal}</td></tr>
                <tr><th scope="row">Kanji</th><td>{data.summary.today.kanji}</td><td>{data.kanjiLearned} / {kanjiTotal}</td></tr>
                {t.soonAreas.map((area) => (
                  <tr key={area}><th scope="row">{area}</th><td colSpan={2} className={s.soon}>{t.soon}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={s.section} aria-labelledby="dash-review">
            <h2 id="dash-review">{t.review}</h2>
            {data.kanaDue + data.kanjiDue + data.vocabDue === 0 ? <p>{t.reviewNone}</p> : (
              <ul className={s.list}>
                {data.kanaDue > 0 && <li><span>{t.reviewKana(data.kanaDue)}</span><Link href="/review?kind=kana">{t.practise}</Link></li>}
                {data.kanjiDue > 0 && <li><span>{t.reviewKanji(data.kanjiDue)}</span><Link href="/review?kind=kanji">{t.practise}</Link></li>}
                {data.vocabDue > 0 && <li><span>{t.reviewVocab(data.vocabDue)}</span><Link href="/review?kind=vocab">{t.practise}</Link></li>}
              </ul>
            )}
            <p className={s.note}>{t.reviewNote(INTERVALS)}</p>
          </section>

          <WeakList items={data.weak} lang={lang} />

          <section className={s.section} aria-labelledby="dash-upcoming">
            <h2 id="dash-upcoming">{t.upcoming}</h2>
            {exam && days !== null && days >= 0 ? (
              <p>{t.exam(goal)} · {new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" }).format(exam)}</p>
            ) : (
              <p className={s.list}><span>{exam ? t.examPast : t.examNone}</span> <Link href="/onboarding">{t.pick}</Link></p>
            )}
          </section>

          <section className={s.section} aria-labelledby="dash-history">
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

          {data.bad && <p role="alert" className={s.warning}>{t.warning}</p>}
        </>
      )}
    </main>
  );
}

const greet = (hour: number) => (hour >= 5 && hour < 10 ? "おはよう" : hour >= 10 && hour < 18 ? "こんにちは" : "こんばんは");

const vi = {
  goal: (g: string, n: number) => `Mục tiêu ${g} · còn ${n} ngày tới kỳ thi`,
  goalToday: (g: string) => `Mục tiêu ${g} · thi hôm nay`,
  goalOnly: (g: string) => `Mục tiêu ${g}`,
  setGoal: "Đặt mục tiêu",
  stage: "Chặng hiện tại: Kana",
  streakLabel: "Chuỗi ngày học",
  streak: (n: number) => `${n} ngày liên tục`,
  minutesLabel: "Thời gian học",
  minutes: (m: number, goal?: number) => (goal ? `${m} / ${goal} phút hôm nay` : `${m} phút hôm nay`),
  continue: "Tiếp tục học",
  continueWhat: (last: Activity["last"]): string =>
    !last ? "Bắt đầu với Hiragana" : last.area === "vocab" ? "Thẻ từ vựng" : last.area === "kanji" ? "Ôn kanji" : last.ref.startsWith("katakana:") ? "Trắc nghiệm Katakana" : "Trắc nghiệm Hiragana",
  progress: "Tiến độ",
  area: "Phần",
  vocab: "Từ vựng",
  soonAreas: ["Ngữ pháp", "Đọc hiểu"],
  today: "Hôm nay",
  memorized: "Đã học",
  soon: "Sắp có",
  review: "Đến hạn ôn",
  reviewKana: (n: number) => `${n} chữ kana đến hạn ôn`,
  reviewKanji: (n: number) => `${n} chữ kanji đến hạn ôn`,
  reviewVocab: (n: number) => `${n} từ đến hạn ôn`,
  reviewNone: "Hôm nay không có gì đến hạn ôn.",
  reviewNote: (gaps: number[]) => `Mỗi lần nhớ đúng, lần ôn sau giãn ra ${gaps.join(", ")} ngày. Sai thì mục đó quay lại ngay trong ngày.`,
  practise: "Luyện",
  upcoming: "Sắp tới",
  exam: (g?: string) => (g ? `Kỳ thi JLPT ${g}` : "Kỳ thi JLPT"),
  examNone: "Chưa chọn kỳ thi",
  examPast: "Kỳ thi đã qua",
  pick: "Chọn kỳ thi",
  history: "Gần đây",
  todayLabel: "Hôm nay",
  yesterday: "Hôm qua",
  dayLine: (min: number, kana: number, kanji: number, vocab: number) => `${min} phút · ${kana} kana · ${kanji} kanji · ${vocab} từ`,
  empty: "Chưa có buổi học nào. Bắt đầu từ bảng chữ cái là nhanh nhất.",
  loading: "Đang tải tiến độ…",
  warning: "Không đọc được tiến độ lưu trong trình duyệt. Số liệu có thể thiếu.",
};

const en: typeof vi = {
  goal: (g, n) => `Goal ${g} · ${n} days to the exam`,
  goalToday: (g) => `Goal ${g} · exam today`,
  goalOnly: (g) => `Goal ${g}`,
  setGoal: "Set a goal",
  stage: "Current stage: Kana",
  streakLabel: "Streak",
  streak: (n) => `${n}-day streak`,
  minutesLabel: "Study time",
  minutes: (m, goal) => (goal ? `${m} / ${goal} min today` : `${m} min today`),
  continue: "Continue learning",
  continueWhat: (last) =>
    !last ? "Start with Hiragana" : last.area === "vocab" ? "Flashcards" : last.area === "kanji" ? "Kanji review" : last.ref.startsWith("katakana:") ? "Katakana quiz" : "Hiragana quiz",
  progress: "Progress",
  area: "Area",
  vocab: "Vocabulary",
  soonAreas: ["Grammar", "Reading"],
  today: "Today",
  memorized: "Learnt",
  soon: "Coming soon",
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
  history: "Recent",
  todayLabel: "Today",
  yesterday: "Yesterday",
  dayLine: (min, kana, kanji, vocab) => `${min} min · ${kana} kana · ${kanji} kanji · ${vocab} ${vocab === 1 ? "word" : "words"}`,
  empty: "No study sessions yet. The alphabet is the quickest start.",
  loading: "Loading progress…",
  warning: "Couldn't read progress saved in this browser. Numbers may be incomplete.",
};

const text: Record<Lang, typeof vi> = { vi, en };
