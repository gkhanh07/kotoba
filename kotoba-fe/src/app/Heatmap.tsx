import { HEAT_LEVELS, HEAT_WEEKS } from "@/config/activity";
import type { Heat } from "@/lib/activity";
import type { Lang } from "@/lib/i18n";
import s from "./heatmap.module.css";

// 13 weeks of study minutes (phase 20). One hue, dark to bright, with every number also in text:
// each cell's label, the summary line and the legend's ranges (AGENTS.md §8.1, dataviz sequential rule).
const dm = (day: string) => `${Number(day.slice(8))}/${Number(day.slice(5, 7))}`;
// "0", "1–9", "10–19", "20–39", "40+": the minutes each level covers.
const ranges = ["0", ...HEAT_LEVELS.map((m, i) => (i + 1 < HEAT_LEVELS.length ? `${m}–${HEAT_LEVELS[i + 1] - 1}` : `${m}+`))];

export function Heatmap({ heat, lang }: { heat: Heat; lang: Lang }) {
  const t = text[lang];
  return (
    <section className={s.block} aria-labelledby="dash-heat">
      <h2 id="dash-heat">{t.title}</h2>
      <p className={s.summary}>{t.summary(heat.activeDays, heat.totalMinutes)}</p>
      <div className={s.chart}>
        <ul className={s.days} aria-hidden="true">
          {t.weekdays.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
        <div className={s.grid} role="group" aria-label={t.title}>
          {heat.weeks.map((week) => (
            <div key={week.find(Boolean)?.day} className={s.week}>
              {week.map((c, i) => c
                ? <span key={c.day} role="img" className={s.cell} data-level={c.level} aria-label={t.cell(dm(c.day), c.minutes)} title={t.cell(dm(c.day), c.minutes)} />
                : <span key={`empty-${i}`} className={s.future} />)}
            </div>
          ))}
        </div>
      </div>
      <ul className={s.legend} aria-label={t.legend}>
        <li aria-hidden="true">{t.less}</li>
        {ranges.map((r, level) => (
          <li key={r}><span className={s.cell} data-level={level} aria-hidden="true" />{t.range(r)}</li>
        ))}
        <li aria-hidden="true">{t.more}</li>
      </ul>
    </section>
  );
}

const vi = {
  title: `Hoạt động ${HEAT_WEEKS} tuần`,
  summary: (days: number, minutes: number) => `${days} ngày có học · ${minutes} phút trong ${HEAT_WEEKS} tuần`,
  cell: (day: string, minutes: number) => `${day}: ${minutes} phút`,
  weekdays: ["T2", "", "T4", "", "T6", "", ""],
  legend: "Thang màu theo số phút mỗi ngày",
  range: (r: string) => `${r} phút`,
  less: "Ít",
  more: "Nhiều",
};
const en: typeof vi = {
  title: `${HEAT_WEEKS} weeks of study`,
  summary: (days, minutes) => `${days} ${days === 1 ? "day" : "days"} studied · ${minutes} min in ${HEAT_WEEKS} weeks`,
  cell: (day, minutes) => `${day}: ${minutes} min`,
  weekdays: ["Mon", "", "Wed", "", "Fri", "", ""],
  legend: "Colour scale by minutes a day",
  range: (r) => `${r} min`,
  less: "Less",
  more: "More",
};
const text: Record<Lang, typeof vi> = { vi, en };
