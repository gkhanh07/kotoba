# Kotoba: hoàn thiện thành khoá JLPT N5 đầy đủ (FE + BE)

## Context
Kotoba hiện có 7 màn hình (trang chủ, dashboard, kana, flashcards 12 từ, login/register/forgot/onboarding).
- Auth là giả: cookie chứa email thô, nhận mọi mật khẩu.
- Tiến độ chỉ lưu localStorage, không có lịch ôn.
- `kotoba-be` là khung NestJS rỗng.

Mục tiêu là khoá N5 trọn vẹn, chạy thật, làm tự động không cần can thiệp:
- Backend thật: SQLite/Prisma, auth, tiến độ, nội dung.
- Kana đủ nhóm, kanji N5 có Hán Việt, ~700 từ N5, ~25 bài ngữ pháp.
- Lộ trình bài học, ôn tập SRS chung, tra cứu, thi thử N5, cài đặt, trang pháp lý.
- Mỗi giai đoạn được kiểm bằng test và Chrome DevTools MCP.

## Quyết định đã chốt với người dùng
| Mục | Quyết định |
|---|---|
| Phạm vi | Trọn N5: kana, kanji, từ vựng, ngữ pháp, bài học, thi thử |
| Nguồn nội dung | Dữ liệu mở + tự soạn. KANJIDIC2 cho kanji, âm đọc, Hán Việt (`r_type="vietnam"`), jlpt=4. JMdict để kiểm âm đọc từ vựng. Nghĩa tiếng Việt, ví dụ, ngữ pháp, đề thi do Claude soạn, gắn `reviewed:false` |
| DB | SQLite qua Prisma **7.10.1, pin cứng** (tag "latest" của `prisma` là 8 RC) + `@prisma/adapter-better-sqlite3`. Dự phòng: `@prisma/adapter-libsql` nếu better-sqlite3 phải tự build (máy không có compiler) |
| Quên mật khẩu | Token thật, hạn 30 phút. Link in ra log BE. Mailer tách riêng, sau gắn SMTP bằng `SMTP_URL` |
| Âm thanh | `speechSynthesis` giọng ja. Ẩn nút khi thiếu giọng (máy này không có giọng ja) |
| Khách | Học mọi thứ, lưu localStorage. Đăng nhập/đăng ký thì gộp lên tài khoản |
| Kana | Thêm dakuten/handakuten, yōon, っ, trường âm thành nhóm riêng. Sửa chữ "92" |
| SRS | Leitner chung: khoảng 1/3/7/14/30 ngày, sai thì về hộp 0, "thuộc" = qua lần ôn 30 ngày. Đúng khi chưa đến hạn thì không đổi |
| Observe | Gỡ `@nestjs/observe` |
| Thi thử | Đọc kanji, viết kanji, từ theo ngữ cảnh, ngữ pháp, đoạn đọc. Có hẹn giờ, chấm điểm, xem lại. Ghi rõ "không có phần nghe" |
| Thiết kế | Quy trình impeccable đầy đủ. Mock do agent `impeccable-finish-reviewer` tự duyệt, không dừng chờ người dùng |
| Git | Commit riêng thay đổi pnpm→npm đang chờ trên main, rồi tạo nhánh `feat/n5-full`. Mỗi giai đoạn một commit sau khi kiểm xong. **Không push.** `.codegraph/` để untracked |

## Kiến trúc

### Nguyên tắc chính
Trình duyệt không bao giờ gọi BE trực tiếp. Chỉ Next server (server component, server action) gọi `API_URL=http://127.0.0.1:4000`. Hệ quả:
- Không cần CORS.
- Token nằm trong cookie httpOnly.
- BE chỉ listen trên loopback.

### Backend (`kotoba-be/src`, một `AppModule`, ESM, import dùng đuôi `.js`)
| File | Nội dung |
|---|---|
| `main.ts` | `process.loadEnvFile()`, body limit 1 MB, `listen(PORT ?? 4000, '127.0.0.1')` |
| `db.ts` | `Db extends PrismaClient`. `onModuleInit` reseed `content/*.json` trong một transaction: upsert, xoá item thiếu (`ponytail:` reseed mỗi lần boot) |
| `auth.ts` | Băm mật khẩu bằng `node:crypto` scrypt (`scrypt$N$r$p$salt$hash`, `timingSafeEqual`), token helpers, rate limiter `Map` cửa sổ trượt (`ponytail:` bộ nhớ trong một process), `AuthGuard` |
| `auth.controller.ts` | `/auth/register`, `login`, `logout`, `forgot` (luôn 204), `reset`. `/me` GET/PATCH, `/me/password`, `DELETE /me {password}` |
| `progress.controller.ts` | `GET`/`PUT /progress` + hàm thuần `merge()`: `at` mới hơn thắng, gộp ngày activity, bỏ id lạ |
| `content.controller.ts` | `GET /content/:kind?script=&lesson=&topic=`, `GET /content/item/:id` (kanji kèm từ chứa nó), `GET /search?q=` |
| `mailer.ts` | `send()`: không có `SMTP_URL` thì `Logger.log` |
| `validate.ts` | ~10 guard viết tay, không thêm dependency |

Các điểm khác:
- **Schema Prisma:**
  - `User`: profile + `activity` JSON.
  - `Token`: sha256 của token, `kind` session|reset, `expiresAt`.
  - `Item`: id như `kanji:日`, kind, lesson, sort, `search` chuẩn hoá, `data` JSON.
  - `Card`: (userId, itemId), box, due `YYYY-MM-DD`, at. Xoá user thì cascade. Xoá item thì **Restrict**.
- **Session:** token ngẫu nhiên lưu DB (không dùng JWT), hạn 7 hoặc 30 ngày. Đổi/đặt lại mật khẩu và xoá tài khoản sẽ thu hồi session.
- **Rate limit:** login 5 lần/email + 20 lần/IP mỗi 15 phút, forgot 3 lần/giờ, register 10 lần/giờ. IP lấy từ header `X-Client-IP` do FE gửi.
- **Cấu hình:** `.env.example` (PORT, DATABASE_URL=file:./dev.db, APP_URL, SMTP_URL). `.gitignore` thêm `.env`, `*.db`, `.cache/`, `src/generated/`. Thêm script `prestart: prisma migrate deploy`.
- **Test:**
  - vitest unit cho scrypt, limiter, merge, hàm chuẩn hoá search.
  - e2e supertest trên `test.db`: globalSetup chạy migrate, `overrideProvider(Mailer)` lấy outbox.
  - Giai đoạn 1 kiểm decorator metadata dưới vitest. Lỗi thì dùng `@Inject()` tường minh.

### Frontend
- **`lib/api.ts`:** ~15 dòng, `fetch` server-only. Gọi kèm auth thì `no-store`. Nội dung thì `force-cache` + `revalidate: 3600`.
- **`lib/auth.ts`:** giữ tên hàm, thay thân bằng gọi BE.
  - `currentUser` bọc `cache()`.
  - Không có cookie: trả `null`, không fetch.
  - BE trả 401: trả `null`.
  - BE sập: **throw** để rơi vào error boundary, không được coi là đăng xuất.
  - `signIn` và `signUp` trả thêm lỗi `credentials`/`rate`/`taken`.
  - Thêm hàm mới: `requestReset`, `resetPassword`, `changePassword`, `deleteAccount`.
  - Bỏ cookie `kotoba.profile`.
- **`lib/srs.ts`:** thuần, có `.check.mjs`.
  - Hàm: `apply`, `isDue`, `dueCount`, `pickNext` (đến hạn → mới → luyện thêm), `choicesFor` chuyển từ progress.ts sang.
  - `migrate()` chuyển dữ liệu cũ:

    | Dữ liệu cũ | Hộp mới |
    |---|---|
    | kana streak ≥3 | hộp 2 |
    | kana streak 1–2 | hộp 1 |
    | kana đã gặp, streak 0 | hộp 0 |
    | flashcard `learned` | hộp 2 |
    | flashcard `learning` | hộp 0 |
    | flashcard `new` | bỏ |

    Kèm bảng map 12 id cũ (`water` → `vocab:水`). Không xoá key cũ.
- **`lib/store.ts`:** `useSrs()` bằng `useSyncExternalStore` trên `kotoba.srs.v1`, kèm `review()`, `reset()`, `clearLocal()`. Xoá `progress.ts`. `activity.ts` thêm vùng `kanji`.
- **`app/Sync.tsx`:** mount ở root layout, nhận `uid`.

  | Tình huống | Hành động |
  |---|---|
  | Dữ liệu khách, chưa có chủ | Đẩy hết lên (đây là bước gộp), rồi ghi chủ |
  | Đúng chủ | Gửi các card có `at > lastSync`, debounce 3 s, flush khi `visibilitychange` |
  | Chủ khác | Nhận dữ liệu từ server, không gửi gì |
  | Khách | Không gọi mạng |

  `LogoutButton`: flush, `clearLocal`, rồi mới chạy action logout.
- **Bảo vệ route:** chỉ `/settings` và `/onboarding` cần đăng nhập. Kiểm tra ngay trong page, không dùng `proxy.ts`.
- Trước khi dùng API Next nào, đọc `node_modules/next/dist/docs/` (AGENTS.md):
  - `error.tsx` nhận `retry()`.
  - `global-error.tsx` phải tự render `<html>`.
  - Chỉ set cookie được trong action hoặc route handler.
- Màu chỉ dùng `var(--token)`. Grep kiểm không có hex ngoài `globals.css`.

### Luồng nội dung (`kotoba-be/content`, `kotoba-be/scripts`, chạy bằng Node 24 type stripping)
- **`scripts/kanjidic.ts`:**
  - Tải về `.cache/`, gunzip bằng `node:zlib`, tách bằng regex.
  - Lọc jlpt=4 (80 chữ, có thể thêm vài chữ ở `EXTRA`).
  - Ghi `kanji.json`, giữ lại các trường tự soạn (`vi`, `lesson`, `reviewed`).
- **`scripts/jmdict-check.ts`:** mỗi cặp (từ, âm đọc) phải có trong JMdict, mỗi câu ví dụ phải chứa từ. Sai là exit 1.
- **Dữ liệu:**
  - `kana.json`: ~110 chữ mỗi bảng, giữ id cũ `hiragana:ka`.
  - `kanji.json`.
  - `vocab.json`: ~700 từ, soạn theo đợt từng bài, mỗi đợt qua cổng JMdict.
  - `grammar.json`: ~25 bài.
  - `lessons.json`: ~25 bài, bài 1–4 là các nhóm kana.
  - `tests/n5-1.json`: ~45 câu.
  - `LICENSE.md`: CC BY-SA 4.0.
- **`content/content.spec.ts`** chạy trong `npm test`:
  - id duy nhất, tham chiếu bài học tồn tại.
  - kanji trong từ vựng phải là kanji N5, hoặc từ có cờ `kanaOnly`.
  - mỗi câu thi có 4 lựa chọn khác nhau, đáp án hợp lệ.
  - in ra số mục `reviewed:false`.

## Các giai đoạn (mỗi giai đoạn một commit trên `feat/n5-full`)
**Kiểm chung cho mọi giai đoạn UI:**
- DevTools: screenshot 1440×900 và 390×844, `list_console_messages` không có lỗi, `list_network_requests` không có request trình duyệt nào tới :4000, `take_snapshot` để kiểm a11y. Kiểm cả hai trạng thái reduced-motion qua `emulate`.
- FE: `npm run lint`, `npm run build`, `npm run check` (script mới: `node --experimental-strip-types --test src/lib/*.check.mjs`).
- Kết thúc: agent `impeccable-finish-reviewer`, sau đó agent `impeccable-documenter` cập nhật `DESIGN.md`.

| # | Việc | Kiểm |
|---|---|---|
| 0 | Commit thay đổi pnpm→npm trên main, tạo nhánh | `git status` sạch, chỉ còn `.codegraph/` |
| 1 | BE nền: gỡ Observe, port 4000 loopback, Prisma 7.10.1 + adapter, schema + migration `init`, `db.ts`, env, gitignore. Xoá Hello controller/service/spec | `npm i` dùng binary build sẵn. build, lint, test, e2e boot OK. `npm start` log port 4000 |
| 2 | BE auth, users, mailer, rate limit, validate | e2e: register → login → /me → PATCH → sai mật khẩu 401 → lần thứ 6 bị 429 → forgot (outbox có link) → reset (mật khẩu và session cũ mất hiệu lực) → đổi mật khẩu → `DELETE /me` cascade |
| 3 | FE auth qua BE: `api.ts`, `auth.ts`, actions, chữ báo lỗi, trang `/reset-password` | DevTools: đăng ký → onboarding → dashboard, logout, sai mật khẩu, forgot → link trong log BE → reset → login. Cookie httpOnly (skill cookie-debugging) |
| 4 | Luồng nội dung + content/search API, kana.json đủ nhóm, kanji.json, 12 thẻ cũ chuyển sang vocab.json, khung lessons | Script kanjidic chạy lại không tạo diff. jmdict pass. e2e đếm số mục. `search?q=nhat` ra 日 |
| 5 | Kana nhiều nhóm ở FE (`getKanaSet` gọi BE, `?group=`), sửa chữ "92" (i18n.ts) | Screenshot từng nhóm, quiz yōon chạy được |
| 6 | SRS cho khách: srs.ts + check, store.ts, migrate, chuyển KanaApp/FlashcardApp (tự chấm "Nhớ/Chưa nhớ")/Dashboard (số mục đến hạn) | check pass. `evaluate_script` nạp key v1 cũ → reload → dashboard hiện số đến hạn |
| 7 | Đồng bộ tài khoản: `/progress` + spec `merge`, Sync.tsx, action `syncProgress`, LogoutButton | e2e merge. DevTools: học khi là khách → đăng ký → card có trong `/progress` → xoá localStorage → reload → card quay về → logout xoá dữ liệu local |
| 8 | Skill `impeccable:impeccable`: IA + nav (Bài học / Ôn tập / Tra cứu / Thi thử, thư viện kana/kanji/từ vựng/ngữ pháp), mock mọi màn hình còn lại, agent review tự duyệt, bản nháp DESIGN.md | Reviewer đạt. Commit mock |
| 9 | Khung site: `not-found`, `error`, `global-error`, `/legal` (riêng tư, điều khoản, ghi nguồn KANJIDIC2/JMdict + link ở footer), `/settings` (hồ sơ, ngôn ngữ, đổi mật khẩu, xoá tài khoản), nav mới | 404. Tắt BE → hiện trang lỗi → retry hồi phục. Các luồng settings chạy. Lighthouse a11y ≥95 |
| 10 | Kanji list/detail, từ vựng soạn theo đợt, `/vocab` các bộ từ → `/flashcards?deck=`, nút `<Speak>` | Nút Speak ẩn trên máy này. Giả `getVoices` có giọng ja bằng `evaluate_script` → nút hiện |
| 11 | Ngữ pháp list/detail, lộ trình bài học + trang bài (hoàn thành = mọi mục ở hộp ≥1) | Content spec. Screenshot lộ trình có tiến độ dở dang |
| 12 | `/review`: hàng đợi ôn chung kana/kanji/từ vựng | Nạp card đến hạn → trả lời đến hết hàng đợi → dashboard cập nhật |
| 13 | `/search`: form GET, server component, kết quả chia theo loại | Thử `たべ`, `taberu`, `hoc`, `日`, `は` |
| 14 | Thi thử: `/test` → `/test/[id]` làm bài → kết quả → xem lại. Timer + đáp án lưu sessionStorage, hết giờ tự nộp, hàm `score()` thuần + check | check. DevTools đi trọn luồng, reload giữa bài vẫn còn |
| 15 | Hoàn thiện: finish review toàn site, Lighthouse các trang chính, DESIGN.md cuối, README hướng dẫn chạy 2 app, cập nhật PRODUCT.md | Ghi lại verdict của reviewer |

## File quan trọng
- **BE:** `kotoba-be/src/{main,app.module,db,auth,auth.controller,progress.controller,content.controller,mailer,validate}.ts`, `prisma/schema.prisma`, `prisma.config.ts`, `content/*`, `scripts/*`, `test/*.e2e-spec.ts`.
- **FE:**
  - Sửa: `src/lib/{auth,kana,i18n,account,activity}.ts`, `src/app/{layout,SiteBar,Dashboard}.tsx`, `kana/KanaApp.tsx`, `flashcards/FlashcardApp.tsx`, `(auth)/actions.ts`.
  - Mới: `src/lib/{api,srs,store}.ts`, `src/app/Sync.tsx`.
  - Route mới: `reset-password`, `settings`, `legal`, `kanji`, `vocab`, `grammar`, `lessons`, `review`, `search`, `test`.
- **Tái sử dụng:** các validator và `jlptSessions` trong `account.ts`, `summarize`/`continueHref` trong `activity.ts`, `choicesFor`/`pickNext` trong `progress.ts` (chuyển sang srs), `dict()`/`getLang`, `Arrow`, các class `btn`.

## Rủi ro
- **Khối lượng nội dung tự soạn** (nghĩa tiếng Việt, ngữ pháp, đề thi) là rủi ro lớn nhất. JMdict chỉ kiểm được âm đọc. Mọi mục gắn `reviewed:false` để người dùng rà sau.
- **Native build:** nếu better-sqlite3 phải tự build thì cài lỗi. Chuyển sang libsql.
- **Giấy phép CC BY-SA** đi theo `kanji.json`, phải ghi nguồn trên site.
- **Đồng hồ máy khách:** merge theo `at` dựa vào giờ máy khách (`ponytail:`).
- **Header IP do FE gửi** chỉ an toàn khi BE chỉ listen trên loopback.
- **Không chạy được với Next 16:** nếu một bước làm sai docs Next 16, dừng giai đoạn đó, sửa theo docs, không lách.
- **Dừng sớm:** nếu một giai đoạn kiểm không qua sau vài lần sửa thì dừng ở đó và báo lại kết quả thật, không commit.
