# Kotoba N5: information architecture and screen mocks

Code-led wireframes for phases 9–14. They extend the incumbent rain-night world
(DESIGN tokens in `src/app/globals.css`); they do not restyle it. Every screen is an
**Operate** or **Read** surface: the hero street stays the only Persuade moment.

Legend: `[ Amber ]` = `.btn`, the one action colour, at most one per view.
`[ Ghost ]` = `.btn btnGhost`. `_link_` = amber underlined text link (secondary).
`ja` text is set in `--font-kana` with `lang="ja"`. Numbers use tabular figures.
**Icons:** `→ ▶ ▾ ⏱` in these drawings are placeholders, never shipped glyphs. They map
to one 18px, 1.75-stroke, square-cap SVG set built on the existing `Arrow` in
`SiteBar.tsx`: arrow, play (Speak), chevron (menu), clock (timer).
**Contrast:** readable text uses `--silver-dim` or brighter. `--silver-mute` (about 3.8:1
on `--night`) is kept for the large 404 numeral only; disabled controls use `--silver-dim` on a `--rule` border, as `.btn:disabled` does.

## 1. Information architecture

```
/                     street hero (guest) · dashboard (signed in)
├─ /lessons           Bài học: the 25-lesson path            ── primary nav
│  └─ /lessons/[n]    one lesson: kana | kanji | words | grammar, then "Ôn bài này"
├─ /review            Ôn tập: one queue of everything due     ── primary nav, due count
├─ /search?q=         Tra cứu: kana, kanji, words, grammar    ── primary nav
├─ /test              Thi thử: the mock papers                ── primary nav
│  └─ /test/[id]      sitting → result → review (same route, state in sessionStorage)
├─ Thư viện (library, a menu, not a page)
│  ├─ /kana           chart + quiz (exists), groups via ?group=
│  ├─ /kanji          N5 kanji grid → /kanji/[char]
│  ├─ /vocab          word decks by lesson → /flashcards?deck=n
│  └─ /grammar        grammar points → /grammar/[slug]
├─ /settings          profile, language, password, delete account (signed in only)
├─ /legal             privacy, terms, content credits (KANJIDIC2, JMdict, CC BY-SA 4.0)
└─ not-found / error / global-error
```

Rules that fall out of it:
- **Learning flows forward through lessons; memory flows back through review.** A lesson
  never schedules its own review screen: its items enter the shared SRS queue.
- **Library pages are reference.** They never grade. The only graded surfaces are
  /kana quiz, /flashcards, /review and /test.
- **Search is the one place every item kind meets.** Library lists link to details;
  details link sideways (kanji → words containing it → lesson that teaches it).

## 2. Site bar (replaces the current three-link nav)

Desktop ≥ 900px, one row on the existing `.bar`:

```
言葉 Kotoba   Bài học   Ôn tập 12   Tra cứu   Thi thử   Thư viện ▾        khanh@…  Đăng xuất   VI|EN
              ───────                                    ┌───────────────┐
              (current: amber underline, as today)       │ Bảng chữ cái  │
                                                         │ Kanji         │
                                                         │ Từ vựng       │
                                                         │ Ngữ pháp      │
                                                         └───────────────┘
```

- `Ôn tập 12`: the due count is plain tabular text in `--silver-dim`, and the
  accessible name is "Ôn tập, 12 mục đến hạn". It shows nothing at 0 and nothing
  before hydration. There is no pill or badge.
- `Thư viện ▾` is a native popover (`popovertarget`). The panel is an `--asphalt`
  sheet with a 1px `--rule-strong` edge and text links at 44px rows. It closes on Esc
  and on outside click, which the browser handles. It is placed with CSS anchor
  positioning (`position-anchor` on the trigger, `top: anchor(bottom)`,
  `left: anchor(left)`). The fallback for engines without `anchor()` is
  `position: fixed`, with the top at the bar's height and right-aligned to the
  `--pad-x` edge.
- `current` widens to `"lessons"|"review"|"search"|"test"|"library"`. The library
  item shows current on /kana, /kanji, /vocab, /grammar and /flashcards.

Mobile < 900px: logo left, `Menu` ghost button right. The same nav element becomes the
popover, so the markup is written once. Above 900px, author CSS overrides the UA
`[popover]:not(:popover-open)` rule. It also resets the whole UA `[popover]` box:
`display: flex; position: static; inset: auto; margin: 0; width: auto; height: auto;
border: 0; padding: 0; background: none; color: inherit; overflow: visible`, and hides
the `Menu` button.

Below 900px the inverse applies:
- The nested library popover is forced flat (`display: grid; position: static`, the same
  reset), so its links list inline.
- The `Thư viện ▾` trigger is hidden.

Opened, the nav is a full-width sheet under the bar:
1. Primary items at 1.25rem in `--font-title`.
2. A `--rule` divider.
3. The library links.
4. Account and VI|EN.

Today the wrapped three-row nav takes about 300px of an 844px phone screen, which is
why the menu is needed.

```
┌──────────────────────────────┐
│ 言葉 Kotoba          [ Menu ] │
├──────────────────────────────┤
│ Bài học                       │
│ Ôn tập                     12 │
│ Tra cứu                       │
│ Thi thử                       │
│ ───────────────────────────── │
│ Bảng chữ cái · Kanji          │
│ Từ vựng · Ngữ pháp            │
│ ───────────────────────────── │
│ khanh@…   Đăng xuất    VI|EN  │
└──────────────────────────────┘
```

Footer (new, every page except the hero street): one `--rule-dim` line, then the
`--silver-dim` .85rem text "Dữ liệu kanji: KANJIDIC2 · Từ điển: JMdict · CC BY-SA 4.0 ·
_Điều khoản và quyền riêng tư_".

## 3. Screens

Shared page head, as on /flashcards today: an `h1` in `--font-title`, `--silver`,
`--glow-cool`, with one 65ch `--silver-dim` lede. There is no eyebrow above the `h1`.

### 3.1 /lessons: the path

The route is a train line: the elevated line from the hero becomes the spine of the
path. Each lesson is a station.

```
Bài học
25 bài, từ bảng chữ đến ôn tập N5. Học theo thứ tự hoặc nhảy tới bài bạn cần.

  ●━━ 1  Hiragana cơ bản                 46/46 đã nhớ
  ┃
  ●━━ 2  Katakana cơ bản                 46/46
  ┃
  ◐━━ 3  Âm đục và âm ghép               31/58             Học tiếp →    ← one amber
  ┃
  ○   4  Âm ngắt và trường âm            0/12
  ┆
  ○   5  Chào hỏi và giới thiệu          0/18
  …
  ○  25  Ôn tập N5
```

- The station marks are 1px SVG: `●` filled amber = done (every item box ≥ 1),
  `◐` half = started, `○` = untouched. The track is solid `--rule-strong` up to the
  last started station and dashed `--rule-dim` beyond it.
- Only the **first unfinished started** lesson carries the amber `Học tiếp`. If none
  is started, it goes to lesson 1 as `Bắt đầu`. Each row is one `<a>` (44px+), with
  no nested link or button. `Học tiếp →` is a trailing `<span>` inside that row's link,
  styled as the amber `.btn` face (outline, glow, filled when the row is hovered). Done
  rows carry no action label: the whole row already links to the lesson.
- Counts are `learned/total`, tabular, right-aligned in a column. On mobile the
  count drops under the title, and the action becomes a full-width row under lesson 3.
- **Empty or guest:** identical, progress comes from localStorage.
- **Loading:** server-rendered list, counts hydrate in. The count column shows `—`
  until the deck hydrates (no skeleton shimmer).
- **Error (BE down):** falls to `error.tsx` (3.12).

### 3.2 /lessons/[n]: one lesson

Read mode, one column of at most 46rem, with sections in fixed order. The kana
lessons (1–4) skip straight to the kana group.

```
← Bài học
Ăn uống
Bài 13 / 25 · Những từ để gọi món, nói thích và không thích.

Kanji  (4)
 ┌────┐ ┌────┐ ┌────┐ ┌────┐
 │ 食 │ │ 飲 │ │ 魚 │ │ 肉 │      each: char 2.5rem cool-core, Hán Việt under it
 │THỰC│ │ẨM  │ │NGƯ │ │NHỤC│      links → /kanji/[char]
 └────┘ └────┘ └────┘ └────┘

Từ vựng  (24)
 たべます   食べます   ăn                               ▶ (Speak, hidden if no ja voice)
 のみます   飲みます   uống
 …           (two-column definition grid; wraps to one column < 640px)

Ngữ pháp  (2)
 〜が すきです    Thích ~            _Xem bài ngữ pháp →_
 〜を ください    Cho tôi ~

───────────────────────────────────────────────────────
 18 / 30 mục đã vào lịch ôn          [ Học bài này → ]   ← flashcards?deck=13
                                     _Bài 14: Đi lại →_
```

- The amber action studies the lesson's items: words via `/flashcards?deck=n`, kana
  via `/kana?group=…&mode=quiz`. When everything is at box ≥ 1 it becomes the ghost
  `Ôn lại`, and the amber moves to `Bài 14 →`.
- Kanji tiles are the one grid here, and they are not icon cards: each is a character
  specimen with text, framed by a 1px `--rule`.
- **Unknown lesson:** `notFound()`.

### 3.3 /review: one queue

The /flashcards card frame is reused, so the queue reads as the same instrument.
The front depends on the item kind:

```
Ôn tập
Hôm nay còn 12 mục.  Kana 5 · Kanji 3 · Từ vựng 4

 12 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  còn lại

 ┌─────────────────────────────────────────────┐
 │                                             │
 │                    食                        │   front: kana / kanji / word
 │                                             │
 │            Chạm để lật · phím cách          │
 └─────────────────────────────────────────────┘
        Bạn nhớ mục này chưa?
   [ Chưa nhớ ]            [ Nhớ rồi ]              ← sticky grade row, as /flashcards
```

- **Back by kind:**
  - Kana: romaji and the Vietnamese hint.
  - Kanji: Hán Việt, on/kun, and the Vietnamese meaning.
  - Word: reading, meaning, and the example.
- **Kana quiz?** No. Review is self-graded throughout, because one instrument is
  easier to learn than three. The kana quiz stays as practice under the library.
- **Done:** the card area is replaced by a `--wet` panel with the text "Xong hàng
  đợi hôm nay. Mục tiếp theo đến hạn: ngày mai, 8 mục." Under it sit an amber
  `Học bài tiếp →` (the continue lesson) and the link `_Về bảng điều khiển_`.
- **Empty from the start:** the same panel, saying "Chưa có gì để ôn. Học một bài
  để bắt đầu lịch ôn." with an amber `Bắt đầu bài 1 →`.
- **`?kind=`:** `kana`, `kanji` or `vocab` narrows the queue to that kind. The lede
  then names only that kind ("Hôm nay còn 14 từ vựng.") and a `_Ôn tất cả_` link drops
  the filter. An unknown value is ignored.
- **Storage blocked:** the existing `.warning` line, and the queue still runs in memory.
- **Keyboard:** Space flips, 1 = chưa nhớ, 2 = nhớ rồi. A hint line under the row
  says so on pointer-fine devices only.

### 3.4 /search: Tra cứu

```
Tra cứu
Gõ kana, romaji, chữ Hán, Hán Việt hoặc tiếng Việt không dấu.

 ┌──────────────────────────────────────────────┐ [ Tìm ]
 │ taberu                                        │
 └──────────────────────────────────────────────┘

 Từ vựng  (3)
  食べます   たべます · tabemasu   ăn                     Bài 13
  食べ物     たべもの · tabemono   đồ ăn                  Bài 13
 Kanji  (1)
  食   THỰC   ショク · た.べる   ăn                        Bài 13
 Ngữ pháp  (0)       (section hidden when empty)
```

- A GET `<form>` with `<input type="search" name="q" autofocus>`, server
  rendered, no client JS. The amber button is the one action.
- Results are grouped by kind in a fixed order: words, kanji, grammar, kana. Each
  row is one link to the detail page. The matched text is wrapped in `<mark>`,
  styled as an amber underline with no background block.
- **Before query:** five example chips are shown as plain links, not pills:
  `_たべ_ · _taberu_ · _hoc_ · _日_ · _は_`.
- **No results:** "Không tìm thấy “xyz”. Thử romaji, hoặc bỏ dấu tiếng Việt."
- **Query too short** (< 1 char after trim) is the same as before query.

### 3.5 /test: the papers

```
Thi thử
Đề mô phỏng JLPT N5 phần Từ vựng, Ngữ pháp và Đọc hiểu. Không có phần nghe.

 Đề 1      45 câu · 50 phút          Lần gần nhất: 31/45     [ Làm đề → ]
 ─────────────────────────────────────────────────────────────────────
 Cấu trúc đề: Đọc kanji 7 · Viết kanji 5 · Từ theo ngữ cảnh 6 ·
 Ngữ pháp 9 · Sắp xếp câu 4 · Đọc hiểu 14            (a 2-col <dl>)
```

- There is one paper at launch, laid out as a table row and not a card. When a
  sitting is unfinished, the amber says `Làm tiếp (còn 23:10)`.
- The "no listening" line is part of the lede and cannot be missed.

### 3.6 /test/[id]: sitting

```
Đề 1 · Câu 12 / 45                                   ⏱ 37:42      [ Nộp bài ]  ← ghost
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  (answered fraction)

 Phần 2 · Viết kanji
 ___の 下に ねこが います。   つくえ

 ( ) 机      ( ) 杌      ( ) 札      ( ) 机        (radio group, 4 choices, 44px rows)

 [ ← Câu trước ]                                 [ Câu sau → ]   ← amber
  1 2 3 4 5 6 7 8 9 10 11 [12] 13 …   (question map, see below)
```

- `Phần 2 · Viết kanji` is the `<h2>` of its question group. Each question is a
  `<fieldset>` whose `<legend>` is the prompt.
- **Question map:** each number is a 44px link.
  - Answered: `--chalk` with a 1px underline.
  - Open: `--silver-dim`, no underline.
  - Current: a 1px `--amber` box and `aria-current="step"`.
  - Every item carries an `aria-label` such as "Câu 7, đã trả lời" or "Câu 8, chưa
    làm", so state is never colour alone.
- The **timer** lives in the header, in `--silver` with tabular figures. Under 5
  minutes it turns `--neon`, goes to weight 700, and gains the text "Còn" before the
  time ("Còn 4:59"), so the change is not colour only. It gets an
  `aria-live="polite"` announcement once at 5:00 and once at 1:00. At 0:00 the paper
  auto-submits.
- `Nộp bài` is ghost because "next" is the frequent action. Submitting with open
  questions opens a native `<dialog>`: "Còn 4 câu chưa làm. Nộp luôn?" with the
  ghost `Làm tiếp` and the amber `Nộp bài`.
- Answers and the deadline live in sessionStorage. A reload resumes the same
  question and time.
- Reading passages sit above their questions in a `--wet` block of at most 65ch.
  On ≥ 1100px the passage is sticky on the left with the questions on the right.

### 3.7 /test/[id]: result and review

```
Kết quả · Đề 1
31 / 45      69%       (score in --font-title 4rem, chalk; no confetti)

 Đọc kanji        6/7   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░
 Viết kanji       3/5   ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░
 Từ theo ngữ cảnh 4/6   …
 Ngữ pháp         7/9
 Sắp xếp câu      2/4
 Đọc hiểu        9/14

 Đây là đề luyện, không phải điểm JLPT thật. Mức đỗ N5 thật tính theo
 thang điểm riêng của kỳ thi.

 [ Xem lại câu sai → ]    _Làm lại đề_    _Về danh sách đề_
```

- Section bars are 3px rules in amber on `--rule`, the same as the flashcard progress bar.
- **Review** reuses the sitting layout read-only:
  - The chosen wrong answer is struck through in `--neon`.
  - The right answer is marked "Đáp án đúng" in `--chalk` with a 1px `--cool`
    outline. Colour is never the only cue.
  - A filter offers `Câu sai (14)` / `Tất cả (45)` as a two-button segmented
    control, reusing the VI|EN switch style.

### 3.8 /kanji and /kanji/[char]

```
Kanji N5
103 chữ, xếp theo bài học. Chạm một chữ để xem âm đọc, Hán Việt và từ chứa nó.

 Lọc:  Tất cả · Đã nhớ · Chưa học        (links; ?filter=)
 Bài 6 · Số đếm và tiền
  一  二  三  四  五  六  七  八  九  十  百  千  万  円
  NHẤT NHỊ TAM …   (Hán Việt under each, --silver-dim, .75rem caps)
 Bài 7 · Thời gian
  …
```

- The tiles sit on a dense grid (4.5rem), one `<a>` each. Learned kanji show a
  1px amber underline under the Hán Việt, so the state is not shown by colour fill alone.

```
← Kanji                                                       ▶ Đọc
 ┌───────────┐  食   THỰC
 │           │  Âm On   ショク
 │    食     │  Âm Kun  た.べる · く.う
 │  (8rem)   │  Nghĩa   ăn, đồ ăn
 └───────────┘  Số nét  9 · Bài 13
 Từ chứa 食
  食べます · たべます · ăn        食べ物 · たべもの · đồ ăn
 [ Học bài 13 → ]
```

- The specimen is `--cool-core` with `--glow-cool`. It is the one neon sign on the page.
- **Amber on detail pages:** kanji and grammar details share one rule. They are Read
  pages, and their single amber is `Học bài n →` to the lesson that teaches the item.
  Without a lesson there is no amber.
- **Missing vi gloss:** "Chưa có nghĩa tiếng Việt", shown in `--silver-dim` italic. The
  English gloss stays visible in the EN UI only.
- **Unknown char:** `notFound()`.

### 3.9 /vocab: decks

```
Từ vựng N5
Mỗi bài học là một bộ thẻ. Học một bộ hoặc ôn tất cả từ đến hạn.

 Bài 5   Chào hỏi và giới thiệu     18 từ    12 đã nhớ · 2 đến hạn     →
 Bài 6   Số đếm và tiền             22 từ    0                         →
 …
                                  [ Ôn 14 từ đến hạn → ]   ← /review?kind=vocab, amber
```

- Rows link to `/flashcards?deck=n`. Lessons with no words, such as the kana
  lessons, are omitted.
- With nothing due, the amber becomes `Học bài tiếp →`, the first unfinished deck.

### 3.10 /grammar and /grammar/[slug]

```
Ngữ pháp N5
25 điểm ngữ pháp, mỗi điểm một ví dụ có dịch.

 Bài 5    〜は 〜です            A là B
 Bài 13   〜が すきです          Thích ~
 …
```

```
← Ngữ pháp
〜が すきです
Bài 13 · Thích ~

 Cấu trúc
   N + が すきです / きらいです
 Giải thích            (≤ 70ch Vietnamese prose)
 Ví dụ
   ねこが すきです。               ▶
   Tôi thích mèo.
   にくが きらいです。
   Tôi ghét thịt.
 Lưu ý
   Với すき, đối tượng dùng が, không dùng を.

 [ Học bài 13 → ]
 _← 〜を ください_                         _〜で (nơi chốn) →_
```

- The structure line uses `--font-kana` in a 1px `--rule-strong` box. It is the one
  framed element.
- The amber follows the detail-page rule in 3.8: one `Học bài n →`. Prev and next are links.

### 3.11 /settings

```
Cài đặt

 Hồ sơ
   Tên hiển thị  [______________]
   Mục tiêu      ( ) N5  ( ) N4 …       Kỳ thi  [ Tháng 12 / 2026 ▾ ]
                                            [ Lưu thay đổi ]   ← amber, disabled until dirty
 Ngôn ngữ
   ( ) Tiếng Việt   ( ) English        (saves instantly, same cookie as VI|EN)
 Mật khẩu
   Mật khẩu hiện tại [____]  Mật khẩu mới [____]      [ Đổi mật khẩu ]  ← ghost
 Xóa tài khoản
   Xóa vĩnh viễn tài khoản và tiến độ đã đồng bộ. Không hoàn tác được.
   [ Xóa tài khoản… ]  ← ghost, --neon text; opens <dialog> asking for the password
```

- One amber per view: the profile save. Each section is its own `<form>` with its own
  result line (`role="status"`). "Đã lưu" fades out after 4s, and errors stay.
- **Signed out:** redirect to `/login?next=/settings`.

### 3.12 /legal, 404, error

- `/legal` is Read: a single 68ch column with three `h2` sections (Quyền riêng tư,
  Điều khoản, Nguồn dữ liệu) and anchor links at the top. It has no amber.
- **404** is a street sign that is off. The `h1` "404" sits in `--font-sign`,
  `--silver-mute`, with no glow. Under it: "Biển này chưa thắp đèn. Trang bạn tìm không
  có ở đây." Then the amber `Về trang chủ →` and the links `_Tra cứu_` and `_Bài học_`.
- **error.tsx** has the same frame. The `h1` reads "Mất điện một lúc". The copy says
  "Không kết nối được máy chủ. Tiến độ của bạn vẫn lưu trên máy này." The amber
  `Thử lại` calls `retry()`.
- **global-error.tsx** renders its own `<html>` with inline-safe styles only (the
  globals may not load). It has the same copy and a plain button.

## 4. States checklist (every screen)

| State | Treatment |
|---|---|
| Hover | Link text → `--amber-core`. Rows get a `--wet` background. Cards get an amber border (as the flashcard). |
| Focus | The existing global `:focus-visible` amber outline. Never removed. |
| Disabled | `--silver-dim` text on a `--rule` border, `cursor: not-allowed`, no glow. |
| Loading | Server-rendered first. Hydration-only numbers show `—`. No skeleton shimmer. |
| Empty | One sentence that says what to do next, plus the amber action that does it. |
| Error | Inline `role="alert"` line for forms. A route failure goes to `error.tsx`. |
| Reduced motion | No flip rotation, no rain drift, no timer pulse. |

## 5. What this IA deliberately leaves out

- No streak flames, XP or leaderboards (principle 4: honest progress).
- No library landing page. The menu is enough for four destinations.
- No per-lesson quiz screen: review and the mock test cover recall.

## 6. Ceiling ideas (not committed; build only if the base lands clean)

- Lesson numbers as circled transit line marks, like station codes on a Tokyo map.
- The sitting's question map as a pixel light grid, with answered cells lit.
- In test review, answered cards lock with a brief trace along their edge, like a
  station sign switching on.
