"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { examDate, type Profile } from "@/lib/account";
import { ACTIVITY_KEY, continueHref, daysBetween, parseActivity, summarize, type Activity } from "@/lib/activity";
import { FLASHCARDS_KEY, parseStatuses } from "@/lib/flashcards";
import type { Lang } from "@/lib/i18n";
import { MASTERED_AT, PROGRESS_KEY, isMastered, type Progress } from "@/lib/progress";
import s from "./dashboard.module.css";

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

const count = <T,>(values: T[], ok: (v: T) => boolean) => values.filter(ok).length;
const fromKey = (day: string) => { const [y, m, d] = day.split("-").map(Number); return new Date(y, m - 1, d); };

export function Dashboard({ lang, name, profile, kanaTotal, vocabTotal }: {
  lang: Lang; name: string; profile: Profile | null; kanaTotal: number; vocabTotal: number;
}) {
  const t = text[lang];
  const kanaRaw = useStored(PROGRESS_KEY);
  const vocabRaw = useStored(FLASHCARDS_KEY);
  const activityRaw = useStored(ACTIVITY_KEY);
  const ready = kanaRaw !== undefined && vocabRaw !== undefined && activityRaw !== undefined;

  const data = useMemo(() => {
    if (!ready) return null;
    let bad = false;
    let kana: Progress = {};
    try { kana = JSON.parse(kanaRaw ?? "{}") as Progress; } catch { bad = true; }
    let vocab: Record<string, string> = {};
    try { vocab = parseStatuses(vocabRaw); } catch { bad = true; }
    let activity: Activity | null = parseActivity(activityRaw);
    if (!activity) { bad = true; activity = { days: {} }; }
    const now = new Date();
    return {
      bad,
      now,
      mastered: count(Object.keys(kana), (id) => isMastered(kana, id)),
      kanaReview: count(Object.values(kana), (v) => v.seen > 0 && v.streak < MASTERED_AT),
      learned: count(Object.values(vocab), (v) => v === "learned"),
      vocabReview: count(Object.values(vocab), (v) => v === "learning"),
      summary: summarize(activity, now),
    };
  }, [ready, kanaRaw, vocabRaw, activityRaw]);

  const goal = profile?.goal;
  const exam = profile?.exam ? examDate(profile.exam) : null;
  const days = exam && data ? daysBetween(data.now, exam) : null;

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
            <progress aria-label={t.stage} value={data.mastered} max={kanaTotal} />
            <span>{data.mastered} / {kanaTotal}</span>
          </div>

          <dl className={s.stats}>
            <div><dt>{t.streakLabel}</dt><dd>{t.streak(data.summary.streak)}</dd></div>
            <div>
              <dt>{t.minutesLabel}</dt>
              <dd>{t.minutes(data.summary.minutesToday, profile?.minutes)}</dd>
              {profile?.minutes && <progress aria-label={t.minutesLabel} value={Math.min(data.summary.minutesToday, profile.minutes)} max={profile.minutes} />}
            </div>
            <div><dt>{t.review}</dt><dd>{data.kanaReview + data.vocabReview}</dd></div>
          </dl>

          <div className={s.continue}>
            <Link className="btn" href={continueHref(data.summary.last)}>{t.continue} <Arrow /></Link>
            <p>{t.continueWhat(data.summary.last)}</p>
          </div>

          <section className={s.section} aria-labelledby="dash-progress">
            <h2 id="dash-progress">{t.progress}</h2>
            <table className={s.table}>
              <caption className="sr-only">{t.progress}</caption>
              <thead><tr><th scope="col">{t.area}</th><th scope="col">{t.today}</th><th scope="col">{t.memorized}</th></tr></thead>
              <tbody>
                <tr><th scope="row">Kana</th><td>{data.summary.today.kana}</td><td>{data.mastered} / {kanaTotal}</td></tr>
                <tr><th scope="row">{t.vocab}</th><td>{data.summary.today.vocab}</td><td>{data.learned} / {vocabTotal}</td></tr>
                {t.soonAreas.map((area) => (
                  <tr key={area}><th scope="row">{area}</th><td colSpan={2} className={s.soon}>{t.soon}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={s.section} aria-labelledby="dash-review">
            <h2 id="dash-review">{t.review}</h2>
            {data.kanaReview + data.vocabReview === 0 ? <p>{t.reviewNone}</p> : (
              <ul className={s.list}>
                {data.kanaReview > 0 && <li><span>{t.reviewKana(data.kanaReview)}</span><Link href="/kana?mode=quiz">{t.practise}</Link></li>}
                {data.vocabReview > 0 && <li><span>{t.reviewVocab(data.vocabReview)}</span><Link href="/flashcards">{t.practise}</Link></li>}
              </ul>
            )}
            <p className={s.note}>{t.reviewNote}</p>
          </section>

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
                  const ago = daysBetween(fromKey(r.day), data.now);
                  const label = ago === 0 ? t.todayLabel : ago === 1 ? t.yesterday : `${r.day.slice(8)}/${r.day.slice(5, 7)}`;
                  return <li key={r.day}><span>{label}</span><span>{t.dayLine(r.minutes, r.kana, r.vocab)}</span></li>;
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
    !last ? "Bắt đầu với Hiragana" : last.area === "vocab" ? "Thẻ từ vựng" : last.ref.startsWith("katakana:") ? "Trắc nghiệm Katakana" : "Trắc nghiệm Hiragana",
  progress: "Tiến độ",
  area: "Phần",
  vocab: "Từ vựng",
  soonAreas: ["Kanji", "Ngữ pháp", "Đọc hiểu"],
  today: "Hôm nay",
  memorized: "Đã thuộc",
  soon: "Sắp có",
  review: "Cần ôn",
  reviewKana: (n: number) => `${n} chữ kana chưa thuộc chắc`,
  reviewVocab: (n: number) => `${n} từ đang học`,
  reviewNone: "Chưa có gì cần ôn.",
  reviewNote: "Kotoba chưa có lịch ôn ngắt quãng; đây là những mục bạn đã gặp nhưng chưa thuộc.",
  practise: "Luyện",
  upcoming: "Sắp tới",
  exam: (g?: string) => (g ? `Kỳ thi JLPT ${g}` : "Kỳ thi JLPT"),
  examNone: "Chưa chọn kỳ thi",
  examPast: "Kỳ thi đã qua",
  pick: "Chọn kỳ thi",
  history: "Gần đây",
  todayLabel: "Hôm nay",
  yesterday: "Hôm qua",
  dayLine: (min: number, kana: number, vocab: number) => `${min} phút · ${kana} kana · ${vocab} từ`,
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
    !last ? "Start with Hiragana" : last.area === "vocab" ? "Flashcards" : last.ref.startsWith("katakana:") ? "Katakana quiz" : "Hiragana quiz",
  progress: "Progress",
  area: "Area",
  vocab: "Vocabulary",
  soonAreas: ["Kanji", "Grammar", "Reading"],
  today: "Today",
  memorized: "Memorized",
  soon: "Coming soon",
  review: "To review",
  reviewKana: (n) => `${n} kana not solid yet`,
  reviewVocab: (n) => `${n} ${n === 1 ? "word" : "words"} in progress`,
  reviewNone: "Nothing to review.",
  reviewNote: "No spaced-repetition schedule yet; these are items you've met but not memorized.",
  practise: "Practise",
  upcoming: "Upcoming",
  exam: (g) => (g ? `JLPT ${g} exam` : "JLPT exam"),
  examNone: "No exam date set",
  examPast: "This exam has passed",
  pick: "Pick an exam",
  history: "Recent",
  todayLabel: "Today",
  yesterday: "Yesterday",
  dayLine: (min, kana, vocab) => `${min} min · ${kana} kana · ${vocab} ${vocab === 1 ? "word" : "words"}`,
  empty: "No study sessions yet. The alphabet is the quickest start.",
  loading: "Loading progress…",
  warning: "Couldn't read progress saved in this browser. Numbers may be incomplete.",
};

const text: Record<Lang, typeof vi> = { vi, en };
