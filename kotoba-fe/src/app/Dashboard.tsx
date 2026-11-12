"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { examDate, examDay, type Profile } from "@/lib/account";
import { ACTIVITY_KEY, heat, parseActivity, summarize, type Activity } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import { NEW_PER_DAY, WEAK_LIST_SIZE } from "@/config/srs";
import { continueTarget, freshFor } from "@/lib/daily";
import type { Stop } from "@/lib/library";
import { INTERVALS, daysUntil, isDue, isLearned, type Srs } from "@/lib/srs";
import { weakItems, type ItemLink } from "@/lib/weak";
import { learnedToday, today, useDeck } from "@/lib/store";
import { remaining } from "@/lib/test";
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

export function Dashboard({ lang, name, profile, scope, tests, fronts, stops }: {
  fronts: Record<string, ItemLink>; stops: Stop[];
  lang: Lang; name: string; profile: Profile | null; scope: { kana: string[]; kanji: string[]; vocab: string[] };
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
    const kanaDue = count(srs, isKana, due), kanjiDue = count(srs, isKanji, due), vocabDue = count(srs, isVocab, due);
    const dueTotal = kanaDue + kanjiDue + vocabDue;
    const fresh = freshFor(stops, srs, learnedToday(), NEW_PER_DAY).ids.length;
    const summary = summarize(activity, now);
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
      weak: weakItems(srs, fronts, WEAK_LIST_SIZE),
      fresh,
      summary,
      heat: heat(activity, day),
      next: continueTarget(dueTotal, fresh, summary.last),
      at: now.getTime(),
      attempt: findSession(), // read here, after hydration: sessionStorage does not exist on the server
    };
  }, [deck, activityRaw, fronts, stops, scope]);
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
        <header className={s.heading}>
          <h1 id="dash-title">{data && <><span lang="ja">{greet(data.now.getHours())}</span>, </>}{name}</h1>
          <p>
            {!goal ? <Link href="/onboarding">{t.setGoal}</Link>
              : days !== null && days > 0 ? t.goal(goal, days)
              : days === 0 ? t.goalToday(goal)
              : t.goalOnly(goal)}
          </p>
        </header>

        {!data ? <p role="status" className={s.note}>{t.loading}</p> : (
          <div className={s.next}>
            <p className={s.nextWhat}>{data.next.daily ? t.continueDaily(data.dueTotal, data.fresh) : t.continueWhat(data.summary.last)}</p>
            <Link className="btn" href={data.next.href}>{t.continue} <Arrow /></Link>
            {resume && data.attempt && (
              <p className={s.resume}>
                <Link href={`/test/${resume.id}`}>{testText[lang].resume(resume.title, data.attempt.session.current + 1, data.attempt.session.answers.length)}</Link>
              </p>
            )}
          </div>
        )}

        {data && (
          <div className={s.stage}>
            <span>{t.stage}</span>
            <progress className="meter" aria-label={t.stage} value={data.kanaLearned} max={scope.kana.length} />
            <span>{data.kanaLearned} / {scope.kana.length}</span>
          </div>
        )}
      </section>

      {data && (
        <>
          <dl className={s.stats}>
            <div className="panel"><dt>{t.streakLabel}</dt><dd>{t.streak(data.summary.streak)}</dd></div>
            <div className="panel">
              <dt>{t.minutesLabel}</dt>
              <dd>{t.minutes(data.summary.minutesToday, profile?.minutes)}</dd>
              {profile?.minutes && <progress className="meter" aria-label={t.minutesLabel} value={Math.min(data.summary.minutesToday, profile.minutes)} max={profile.minutes} />}
            </div>
            <div className="panel"><dt>{t.review}</dt><dd>{data.dueTotal}</dd></div>
          </dl>

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
              </section>

              <WeakList items={data.weak} lang={lang} />
            </div>

            <div className={s.column}>
              <section className={`panel ${s.section}`} aria-labelledby="dash-upcoming">
                <h2 id="dash-upcoming">{t.upcoming}</h2>
                {exam && days !== null && days >= 0 ? (
                  <p>{t.exam(goal)} · {new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" }).format(exam)}</p>
                ) : (
                  <p className={s.list}><span>{exam ? t.examPast : t.examNone}</span> <Link href="/onboarding">{t.pick}</Link></p>
                )}
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
            </div>
          </div>

          {data.bad && <p role="alert" className={`notice ${s.warning}`} data-tone="warn">{t.warning}</p>}
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
  continueDaily: (due: number, fresh: number) => `Phiên hôm nay: ${due} đến hạn · ${fresh} mới`,
  continueWhat: (last: Activity["last"]): string =>
    !last ? "Bắt đầu với Hiragana" : last.area === "vocab" ? "Thẻ từ vựng" : last.area === "kanji" ? "Ôn kanji" : last.ref.startsWith("katakana:") ? "Trắc nghiệm Katakana" : "Trắc nghiệm Hiragana",
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
  continueDaily: (due, fresh) => `Today’s session: ${due} due · ${fresh} new`,
  continueWhat: (last) =>
    !last ? "Start with Hiragana" : last.area === "vocab" ? "Flashcards" : last.area === "kanji" ? "Kanji review" : last.ref.startsWith("katakana:") ? "Katakana quiz" : "Hiragana quiz",
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
  history: "Recent",
  todayLabel: "Today",
  yesterday: "Yesterday",
  dayLine: (min, kana, kanji, vocab) => `${min} min · ${kana} kana · ${kanji} kanji · ${vocab} ${vocab === 1 ? "word" : "words"}`,
  empty: "No study sessions yet. The alphabet is the quickest start.",
  loading: "Loading progress…",
  warning: "Couldn't read progress saved in this browser. Numbers may be incomplete.",
};

const text: Record<Lang, typeof vi> = { vi, en };
