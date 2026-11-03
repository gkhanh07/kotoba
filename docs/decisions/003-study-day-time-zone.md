# ADR 003: The study day is the calendar day in Asia/Ho_Chi_Minh

- Status: accepted
- Date: 2026-11-03

## Context
"Today" decides SRS due dates (`store.today()`), the activity log's day buckets, streaks, the 90-day trim and the dashboard's day counts. It was the browser's local day, so the same instant could be a different day on two devices, and a phase-18 daily limit ("10 new items per day") would reset at a different moment per device. The app is for Vietnamese learners.

## Options
1. Browser-local day (as before).
2. A fixed zone, `Asia/Ho_Chi_Minh` (UTC+7, no DST), computed with `Intl.DateTimeFormat`.
3. A per-user zone setting.

## Decision
Option 2. One function, `dayKey(d)` in `kotoba-fe/src/lib/activity.ts`, turns an instant into `YYYY-MM-DD` on the Vietnam wall clock; `record` takes the minute-of-day from the same clock. Every other day calculation works on day keys (`addDays`, `daysUntil` in `srs.ts`). The zone lives in `kotoba-fe/src/config/time.ts`. Stored timestamps stay UTC ms.

## Consequences
- Same day on every device and in kotoba-be merges, whatever the browser zone. Tests use UTC instants and pass under any `TZ`.
- No migration: stored keys keep their format. A learner whose browser was not on UTC+7 may see one day shift once (a due date or streak day one day off), which the Leitner schedule absorbs.
- The greeting on the dashboard still follows the browser clock (it is not a day calculation).
- Option 3 stays possible later by making the zone a parameter of `dayKey`.
