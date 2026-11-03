# Kotoba: bổ sung chức năng N5 và lộ trình nội dung N5 → N4 → N3 → N2

## Bắt đầu ở đây (mỗi phiên, kể cả cloud session)
1. Nếu có `docs/progress/PROGRESS.md`: đọc trước, làm tiếp task đầu tiên chưa DONE. Không làm lại task đã DONE.
2. Nếu chưa có: bắt đầu từ Task A.
3. Tài liệu đi kèm:
   - `docs/plan/rules-vi.md`: 17 mục quy tắc gốc tiếng Việt. Đây là nguồn để dịch sang `AGENTS.md` ở Task A1.
   - `docs/plan/original-n5.md`: plan gốc (kiến trúc, quyết định đã chốt, giai đoạn 0–13 đã xong). Đọc để hiểu kiến trúc. Bảng giai đoạn 14–15 trong file đó đã bị thay bằng các giai đoạn 14–35 bên dưới.
4. Sau khi có `AGENTS.md`, `AGENTS.md` là luật. File này là lộ trình.
5. Làm liền một mạch, không chờ người dùng duyệt giữa các giai đoạn. Chỉ dừng trong các trường hợp ở mục 15 của quy tắc (đã điều chỉnh bên dưới).
6. Khi phiên sắp hết (ngữ cảnh hoặc thời gian): commit phần đã xanh, cập nhật PROGRESS.md (task đang dở, bước tiếp theo, giả thuyết hiện tại), push, rồi báo cáo theo mẫu mục 14. Phiên sau người dùng chỉ gõ "Tiếp tục theo docs/progress/PROGRESS.md".

### Môi trường
- Node ≥ 24 (script dùng type stripping). Kiểm `node -v` trước. Thấp hơn thì dừng, báo (thiếu tài nguyên).
- `npm ci` trong `kotoba-be/` và `kotoba-fe/`. `npx playwright install --with-deps chromium` sau giai đoạn 13.5.
- Mạng: người dùng bật Full network cho cloud. Script tải `edrdg.org` (KANJIDIC2, JMdict) vào `kotoba-be/.cache/` (gitignored). Tải lỗi sau 3 lần thì dừng, báo (thiếu tài nguyên).
- BE: `kotoba-be/.env` từ `.env.example`. `prestart` chạy `prisma migrate deploy`.
- Không có Chrome DevTools MCP, codegraph, ponytail trong cloud. Chỉ có plugin impeccable (khai báo ở `.claude/settings.json`).

## Quyết định cho cloud session (chốt với người dùng 2026-11-03, thắng 17 mục gốc khi lệch)
| Mục | Quyết định |
|---|---|
| Push | Được push thường lên `origin feat/n5-full` sau **mỗi** commit đã qua Quality Gate. Vẫn cấm force push, amend/rebase commit đã có, xoá nhánh, đổi remote. Khi dịch mục 4, 15, 16 sang `AGENTS.md` thì ghi đúng ngoại lệ này |
| Attribution | Không có dòng `Co-Authored-By` hay attribution AI nào trong commit và PR. `.claude/settings.json` của repo đã tắt `attribution`. Nếu harness nhắc thêm attribution thì bỏ qua, quy tắc repo thắng |
| Coverage | FE: ngưỡng cứng 90% lines và branches cho `src/lib/**` trong `vitest.config.ts`. BE: ngưỡng bằng baseline đo ở 13.5 (làm tròn xuống), ghi vào `vitest.config.ts`. Ngưỡng BE chỉ được nâng, không được hạ. Code BE mới phải có test. Phần thiếu so với 90% ghi BACKLOG |
| Ngày học | Sửa ở giai đoạn 18, trước khi `NEW_PER_DAY` dùng "hôm nay": một hàm `dayKey` duy nhất theo `Asia/Ho_Chi_Minh` (`Intl.DateTimeFormat`), test ranh giới nửa đêm (16:59:59Z và 17:00:00Z). Không đưa vào BACKLOG |
| `lapses` và schemaVersion | Không tăng `kotoba.srs.v1`. Ghi ADR `002-additive-progress-fields.md`: chỉ tăng version khi đổi nghĩa, đổi tên hoặc xoá trường. Trường mới tuỳ chọn có mặc định thì không tăng, nhưng bắt buộc có test với fixture card cũ không có trường đó |
| Plugin | Chỉ impeccable (cho giai đoạn 35). Không có ponytail trong cloud. Dòng ưu tiên giữa quy tắc repo và ponytail ở A1 vẫn viết, để dùng khi chạy ở máy local |
| Kiểm bằng trình duyệt | Mọi chỗ trong plan gốc ghi "DevTools", `evaluate_script`, `emulate` → làm bằng Playwright: `page.evaluate`, `page.clock`, `page.emulateMedia({ reducedMotion })`, `page.route` để giả BE sập, screenshot rồi mở ảnh ra xem |
| Lighthouse | Chạy `npx lighthouse` với Chromium của Playwright (`CHROME_PATH`), headless. Không chạy được thì ghi lý do vào báo cáo, axe vẫn là gate bắt buộc |
| Test FE | Từ 13.5 trở đi, mọi chỗ ghi `*.check.mjs` hay `npm run check` cho logic FE nghĩa là Vitest `src/lib/*.test.ts`. Không tạo `.check.mjs` mới |
| Hằng số | Hằng số nghiệp vụ mới (`NEW_PER_DAY`, thời gian đề, ngưỡng `lapses ≥ 2`, …) đặt ở `kotoba-fe/src/config/` hoặc `kotoba-be/src/config.ts`. Hằng số cũ chưa gom thì để BACKLOG |
| Số commit | Theo `AGENTS.md`: một giai đoạn có thể gồm nhiều commit, mỗi commit một thay đổi logic hoàn chỉnh và xanh. Đợt nội dung: mỗi đợt một commit `content(<level>): …` |
| Dừng sớm | Theo mục 11 và 15: sau 3 lần thử theo 3 hướng khác nhau vẫn không qua thì dừng, không commit phần hỏng, ghi PROGRESS (BLOCKED), push phần đã xanh trước đó, báo cáo |

## Đã xong
- Đã xoá `Co-Authored-By: Claude` khỏi toàn bộ lịch sử và push lên.
- Giai đoạn 0–13 đã commit trên `feat/n5-full` (đến `389557c`).
- Phần BE của giai đoạn 14 được commit riêng cùng lúc thêm thư mục `docs/plan/` này: `content/tests.json` (đề `n5-1`, 45 câu), `GET /tests` và `GET /tests/:id`, spec kiểm đề, e2e. Lúc commit: BE 15 unit + 18 e2e pass, lint sạch.

## Task A (làm trước giai đoạn 14): quy trình làm việc bằng tiếng Anh

Người dùng đưa 17 mục quy tắc bằng tiếng Việt (`docs/plan/rules-vi.md`). Việc cần làm:
- Dịch sang tiếng Anh và đưa vào quy trình làm việc của repo.
- Chốt "dùng đúng như viết" cho phần test, tức là thêm Vitest, RTL, Playwright và axe cho FE.

### A1. `AGENTS.md` ở gốc repo (file mới) và `CLAUDE.md` ở gốc
`AGENTS.md`:
- Bản dịch tiếng Anh đầy đủ 17 mục, giữ nguyên thứ tự và mức độ bắt buộc.
- Chỉ sửa những chỗ phải khớp với repo thật, và các quyết định ở bảng "Quyết định cho cloud session". Mục 17 vốn đã yêu cầu cập nhật theo `package.json`.
  - **Mục 12:** `scripts/verify-jmdict.ts` → `kotoba-be/scripts/jmdict-check.ts` (`npm run jmdict`). Cờ `needsReview: true` → `reviewed: false`, là trường đang có trong JSON nên không đổi tên để khỏi phải migrate. Thêm "kanji vượt cấp thì `word` viết bằng kana, chữ kanji để ở trường `kanji`". Repo không có cờ `kanaOnly`: xem `vocab:ねこ`.
  - **Mục 4:**
    - Thêm "không dòng `Co-Authored-By` hay attribution của AI trong commit và PR".
    - Ngoại lệ push như bảng quyết định (cả ở mục 15 và 16).
    - Ghi rõ: từ giờ commit theo Conventional Commits, thay cho kiểu `Phase N: …`.
    - Một giai đoạn có thể gồm nhiều commit nếu mỗi commit là một thay đổi logic hoàn chỉnh.
  - **Mục 6:** thêm câu về quy tắc schemaVersion cho trường thêm vào (ADR 002).
  - **Mục 7 và 8:** Playwright chạy ở 360×740 và 1440×900. Kiểm thêm responsive ở 768px. Áp dụng cho cả hai app.
  - **Mục 10:** coverage theo bảng quyết định (FE 90% cứng, BE không được thấp hơn baseline).
  - **Mục 17:** lệnh thật, chia theo `kotoba-fe/` và `kotoba-be/` (repo không có `package.json` ở gốc).
  - **Mục 5.4, `catch {}` rỗng bị cấm:** áp cho code mới. Chỗ cũ thì ghi vào BACKLOG, không tự sửa lan man.
- Thêm một dòng ở đầu về thứ tự ưu tiên giữa các nguồn quy tắc. Lý do: chế độ ponytail (khi chạy local) và quy tắc mới mâu thuẫn ở chỗ bắt buộc spec, ADR và test.
  - Quy tắc của repo thắng ponytail khi hai bên mâu thuẫn.
  - Ponytail vẫn áp dụng cho việc chọn giải pháp.
- Thêm "Start of session: read `docs/progress/PROGRESS.md`, then `docs/plan/PLAN.md`".

Các file đi kèm:
- `CLAUDE.md` ở gốc chỉ có `@AGENTS.md`, cùng mẫu với `kotoba-fe/CLAUDE.md`, để Claude Code tự nạp.
- `kotoba-be/AGENTS.md` (file mới): một dòng "Follow `../AGENTS.md`".
- `kotoba-fe/AGENTS.md`: thêm một dòng trỏ về `../AGENTS.md`. Giữ nguyên block Next và phần quy tắc màu.

### A2. Bộ tài liệu bắt buộc (mục 13), tạo khung
- **`docs/progress/PROGRESS.md`:**
  - Giai đoạn 0–13 đã xong, kèm hash.
  - Giai đoạn 14: phần BE đã commit, phần FE chưa làm.
  - Baseline lấy từ output thật của `npm test` và `test:e2e` ở BE và `check` ở FE.
- **`docs/progress/BUGS.md`:** trống, có sẵn mẫu `BUG-xxx`.
- **`docs/progress/BACKLOG.md`:** ghi các chỗ lệch quy tắc đã thấy, không sửa trong task này.
  - Các `catch {}` rỗng có sẵn (grep rồi liệt kê).
  - Magic number chưa gom vào `src/config/`, ví dụ `INTERVALS` và `KNOWN_AT` trong `srs.ts`.
  - README chưa ghi nguồn JMdict/KANJIDIC.
  - (`dayKey` theo giờ trình duyệt **không** vào BACKLOG: sửa ở giai đoạn 18.)
- **`docs/decisions/001-test-stack.md`:** ADR chọn Vitest, RTL và Playwright, ghi lý do thêm dependency.
- **`docs/decisions/002-additive-progress-fields.md`:** quy tắc schemaVersion ở bảng quyết định.
- `docs/phases/` sẽ chứa spec của từng giai đoạn từ 14 trở đi.
- **Commit:** `docs: add agent working rules and progress docs`.

### A3. Giai đoạn 13.5: hạ tầng test (chạy trước giai đoạn 14)
**FE `kotoba-fe`**, thêm devDeps: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `@axe-core/playwright`. Ghi lý do trong ADR 001. Trước khi viết config, đọc docs Vitest với React 19 và Next 16 trong `node_modules`.
- **`vitest.config.ts`:** môi trường `jsdom`, coverage cho `src/lib/**`, ngưỡng 90% lines và branches.
- **Chuyển `src/lib/*.check.mjs` sang `src/lib/*.test.ts`:** giữ nguyên mọi assertion, không nới lỏng. Xoá `.check.mjs` sau khi bản Vitest pass. Trước đó đảo một assertion để thấy test fail.
- **`playwright.config.ts`:**
  - Hai project `mobile` (360×740) và `desktop` (1440×900).
  - `webServer` khởi động BE (`kotoba-be` ở :4000) và FE.
  - Một fixture chung làm test fail nếu có `console.error` hoặc `pageerror`, kèm helper `axe` chặn lỗi serious/critical.
- **Một smoke E2E đầu tiên:** vào `/`, `/kana` và `/review` với khách, chạy axe, chụp screenshot cả hai viewport.
- **Scripts:**
  - `typecheck` = `tsc --noEmit`.
  - `test` = `vitest run`.
  - `test:coverage`.
  - `test:e2e` = `playwright test`.
  - `check` = `lint && typecheck && test:coverage && build` (E2E chạy riêng vì cần BE).
- `.gitignore` thêm `playwright-report/`, `test-results/` và `coverage/`.

**BE `kotoba-be`:**
- Scripts:
  - `typecheck` = `tsc --noEmit`.
  - `validate:content` = `vitest run content && node scripts/jmdict-check.ts`.
  - `check` = `lint && typecheck && test && test:e2e && validate:content && build`.
- Đo coverage `src/`, ghi baseline vào PROGRESS, đặt ngưỡng trong config bằng baseline (bảng quyết định). Phần thiếu so với 90% ghi BACKLOG.

**Commit:** `chore(test): add vitest, rtl and playwright with axe to kotoba-fe` (và một commit `chore(test): …` riêng cho scripts BE nếu tách được).

### A4. Subagent hỗ trợ (`.claude/agents/*.md` ở gốc repo, commit vào repo)
Mỗi file gồm frontmatter `name`, `description` (nói rõ khi nào gọi) và `tools`. Thân file là quy tắc riêng cho vai trò đó. Mọi agent đều mở đầu bằng: "Read `AGENTS.md` and the phase spec named in your prompt first".

| Agent | Phạm vi được sửa | Tools | Quy tắc riêng |
|---|---|---|---|
| `be` | `kotoba-be/src`, `prisma`, `test` | Read, Edit, Write, Grep, Glob, Bash | Đổi schema thì phải kèm migration. Endpoint mới có e2e. Guard dùng `validate.ts`. Kết thúc bằng `npm run check` trong `kotoba-be` |
| `fe` | `kotoba-fe/src`, `kotoba-fe/e2e` | Read, Edit, Write, Grep, Glob, Bash | Đọc docs Next 16 trong `node_modules/next/dist/docs` trước khi dùng API. Màu chỉ dùng `var(--token)`. Trình duyệt không gọi BE. Mỗi component có test RTL. Kết thúc bằng `npm run check` trong `kotoba-fe` |
| `test` | Chỉ file test (`*.test.ts(x)`, `*.e2e-spec.ts`, `e2e/**`, fixture) | Read, Edit, Write, Grep, Glob, Bash | Viết test theo ma trận trong spec, cho fail trước rồi mới pass. Không sửa code sản phẩm: thấy lỗi thì báo về kèm output. Cấm `.skip`, `.only`, nới assertion. Chạy Playwright và axe ở 360×740 và 1440×900 |
| `content` | `kotoba-be/content/*.json`, `scripts/levels.txt` | Read, Edit, Write, Grep, Glob, Bash | Mỗi lần gọi soạn đúng một đợt (~200 từ, hoặc một nhóm kanji hay ngữ pháp). Gắn `reviewed:false`. Không tự bịa âm đọc. Không đổi id đã có. Phải qua `npm run validate:content`. Báo số mục và các mục bị loại |
| `reviewer` | Không sửa gì | Read, Grep, Glob, Bash (chỉ lệnh đọc, `lint` và `tsc --noEmit`; không chạy test) | Đối chiếu `git diff` với `AGENTS.md` và spec: phạm vi thay đổi, mục cấm (§5, §16), test, migration, màu, việc gọi :4000. Trả về danh sách lỗi theo mức độ. Gọi trước mỗi commit của một giai đoạn |

**Đã có sẵn:** cả năm file `.claude/agents/{be,fe,test,content,reviewer}.md` đã được viết và commit trước, theo đúng code thật của `kotoba-be` và `kotoba-fe`. Ở A4 không tạo lại, chỉ đối chiếu với `AGENTS.md` vừa viết và sửa chỗ lệch: lệnh, đường dẫn (ví dụ thư mục fixture), số mục `§` được trích, `npm run check` sau phase 13.5. Nếu không lệch thì A4 chỉ còn phần "Kiểm" bên dưới.

Không thêm agent thiết kế: đã có `impeccable-finish-reviewer` và `impeccable-documenter` (plugin impeccable), dùng ở giai đoạn 35. Không thêm agent lập kế hoạch: đã có `Plan` sẵn.

Quy tắc phối hợp, ghi thành một mục "Agents" trong `AGENTS.md`:
- Chỉ agent chính được commit, push và cập nhật `PROGRESS.md`. Subagent không commit, không push.
- BE và FE chỉ chạy song song khi hai bên sửa những file tách biệt nhau.
- Mỗi lúc chỉ một agent chạy `test:e2e` hoặc Playwright, vì chung cổng :4000/:3000 và chung `dev.db`/`test.db`. Khi gọi hai agent song song, agent chính ghi rõ trong prompt "another agent is running in parallel": khi đó subagent bỏ qua e2e, agent chính tự chạy e2e sau.
- Test do `test` viết là hợp đồng: `be`/`fe` không được sửa hay nới chúng. Test sai thì báo về, agent chính quyết định.
- Luồng chuẩn của một giai đoạn:
  1. Agent chính viết spec.
  2. `test` viết test cho fail.
  3. `be` và/hoặc `fe` làm cho test pass.
  4. `reviewer` duyệt.
  5. Agent chính chạy Quality Gate, commit, push, rồi cập nhật PROGRESS.
- Giai đoạn nhỏ (sửa một hai file) thì agent chính tự làm, không tách agent.
- Giai đoạn nội dung (15, 23–34) thì giao `content` theo từng đợt, mỗi đợt một lần gọi.

Commit: `chore: add claude subagents for be, fe, test, content and review`.

Kiểm:
- Các file `.claude/agents/*.md` có frontmatter hợp lệ (`name`, `description`, `tools`). Trong cùng phiên, gọi thử được bằng Agent tool. Nếu agent mới chưa được nạp trong phiên hiện tại thì ghi vào báo cáo, không coi là lỗi.
- Thử gọi `reviewer` trên diff của A1–A3: không sửa file nào và trả về danh sách lỗi.

### Ảnh hưởng lên các giai đoạn 14–35 bên dưới
Mọi giai đoạn từ giờ theo `AGENTS.md`:
- Có spec ở `docs/phases/NN-<tên>.md`, gồm AC-n và ma trận test, viết trước khi code.
- Logic có unit test bằng Vitest. Component có test RTL cho các trạng thái rỗng và lỗi. Luồng chính có E2E Playwright kèm axe.
- Quality Gate: `check` của cả hai app và `test:e2e`.
- Mỗi giai đoạn cập nhật PROGRESS.
- Commit theo Conventional Commits, ví dụ `feat(test): mock exam flow`, `content(n4): vocab batch 1`. Push sau mỗi commit xanh.
- Các mục "Kiểm" của từng giai đoạn dưới đây trở thành gợi ý cho AC. Danh sách đầy đủ lấy theo mục 7.2.
- Riêng giai đoạn 14: `TestApp` phải có test `it('auto-submits exactly once when the timer reaches zero')` chạy với fake timers.

### Kiểm Task A
- `AGENTS.md` có đủ 17 mục bằng tiếng Anh. Mọi lệnh ở mục 17 chạy được thật.
- `CLAUDE.md` ở gốc chứa `@AGENTS.md`.
- 13.5 xanh:
  - `npm run check` ở FE pass, coverage của `src/lib` ≥ 90% (nếu thấp hơn thì viết thêm test cho đến khi đạt, vì đây là ngưỡng cứng).
  - Số test Vitest ≥ số assertion trong các file `.check.mjs` cũ.
  - Smoke E2E pass trên cả hai project, 0 lỗi axe serious/critical.
  - `npm run check` ở BE pass.

## Context
- Plan gốc là `docs/plan/original-n5.md`. Các giai đoạn 0–13 đã commit trên `feat/n5-full`.
- Người dùng đã rà danh sách 64 đề xuất. Chốt lại: giữ nhóm "nên làm" và nhóm "làm bản rút gọn". Bỏ phần thứ tự nét chữ (KanjiVG).
- Mục tiêu của bổ sung này:
  - Trả lời được "mình yếu ở đâu" và "hôm nay học gì".
  - Bù phần từ vựng còn thiếu: mới có 499 từ, plan gốc là ~700.
  - Không thêm hệ thống mới: không listening, không AI, không CMS, không XP, không PWA.
- Người dùng muốn nội dung tới N2, làm liền một mạch N5 → N4 → N3 → N2. Không dừng chờ duyệt giữa các cấp, nhưng quy tắc dừng sớm vẫn áp dụng.
  - Hiện chỉ có nội dung N5: 103 kanji, 499 từ, 34 điểm ngữ pháp.
  - `Item` chưa có cột cấp độ. `User.goal` đã có các giá trị `N5…N1`.
  - `scripts/kanjidic.ts` mới lọc `jlpt=4`. KANJIDIC2 dùng thang 4 cấp cũ, trong đó cấp 2 cũ gộp cả N3 và N2.
- Các quyết định, quy tắc kiểm và kiến trúc của plan gốc vẫn giữ nguyên:
  - Trình duyệt không bao giờ gọi BE, chỉ Next server gọi `API_URL`.
  - Màu chỉ dùng `var(--token)`.
  - Đọc docs Next 16 trước khi dùng API.

## Quyết định mới
| Mục | Quyết định |
|---|---|
| Thời gian đề | `minutes: 60`, không phải 50. Từ 12/2020, N5 gồm từ vựng 20 phút và ngữ pháp/đọc 40 phút (jlpt.jp/e/topics/202009091599642827.html). Dùng một đồng hồ chung (`ponytail:` hai phần có giờ riêng thì tách đồng hồ khi cần) |
| Route thi thử | Giữ `/test` và `/test/[id]` như mock IA. Một route đi qua các bước intro → làm bài → kết quả → xem lại. Không tách 6 route |
| Lưu bài thi | Bài đang làm lưu `sessionStorage` `kotoba.test.<id>`. Kết quả cuối lưu `localStorage` `kotoba.tests.v1`, mỗi đề một kết quả. Không lưu lên server (`ponytail:`) |
| Giải thích đáp án | Mục 12 bắt buộc mỗi câu có giải thích. Thêm `explain: string` (tiếng Việt) cho mọi câu trong `tests.json`, kể cả 45 câu `n5-1` đã có. `content.spec.ts` kiểm `explain` không rỗng. Màn hình xem lại hiện giải thích |
| Số lần sai | Thêm `lapses` vào Card ở cả FE và BE. Merge vẫn theo `at` mới hơn thắng, `lapses` đi kèm card (`ponytail:` hai máy cùng offline có thể mất một lần đếm). Không tăng schemaVersion (ADR 002) |
| Hướng của card | Một lịch ôn cho mỗi item. Hướng hỏi chọn ngẫu nhiên lúc ôn: chữ → nghĩa, nghĩa → chữ, chữ → cách đọc (với từ có kanji). Lý do: `Card.itemId` là FK tới `Item`, và `newer()` bỏ các id lạ (`ponytail:` tách lịch theo hướng nếu khả năng nhớ lại kém xa khả năng nhận diện) |
| Phiên học hằng ngày | Không làm flow mới. `/review` không tham số sẽ gồm các mục đến hạn, cộng tối đa `NEW_PER_DAY = 10` mục mới của bài đang học |
| Mục mới trong JSON | `similar` trong `kanji.json` là trường tự soạn. `kanjidic.ts` phải giữ lại trường này khi chạy lại |
| Cấp độ của nội dung | `level Int` (5, 4, 3, 2) có trên mọi mục trong `content/*.json`, `lessons.json`, `tests.json`, và cột `Item.level` (index `[kind, level, sort]`). Vẫn một file cho mỗi loại, không tách thư mục theo cấp |
| Số bài | `lesson` vẫn đánh số toàn cục: N4 nối tiếp sau bài cuối của N5, cứ thế đến N2. `currentLesson()` (giai đoạn 18) tự đi sang N4 khi N5 xong, nên không cần setting "cấp đang học" |
| Lọc theo cấp ở UI | `?level=` trên `/kanji`, `/vocab`, `/grammar`, `/flashcards`, `/test`, dạng tab link (server component, không JS). Mặc định là cấp của `currentLesson`, hoặc N5 nếu chưa có. `/lessons` hiện mọi cấp, mỗi cấp có tiêu đề riêng |
| Danh sách lớn | Mục 8.3: từ giai đoạn 22, `/vocab` và `/kanji` phân trang bằng `?page=` (server component, link Trước/Sau), vì N3/N2 thêm hàng nghìn mục. Có E2E với dữ liệu ≥ 5.000 mục (mục 7.2) |
| Nguồn danh sách kanji và từ theo cấp | N4 lấy từ KANJIDIC2 (cấp cũ 3). N3/N2 tách theo danh sách JLPT của Jonathan Waller (tanos.co.uk). Kiểm license (theo hiểu biết là CC BY, phải xác minh trên trang trước khi dùng, ghi URL và nội dung license vào ADR) rồi ghi nguồn ở `/legal`. Nếu license không ổn hoặc không truy cập được: chia cấp cũ 2 theo `freq` của KANJIDIC (`ponytail:` heuristic, không phải danh sách chính thức). Danh sách chỉ dùng để chọn mục. Nghĩa tiếng Việt tự soạn |
| Thời gian đề | N4 80 phút (25 + 55), N3 100 phút (30 + 70), N2 105 phút (từ vựng, ngữ pháp và đọc gộp một phần). Không có phần nghe ([jlpt.jp](https://www.jlpt.jp/sp/e/guideline/testsections.html)) |
| Kết quả đề N3/N2 | Chỉ hiện điểm thô và điểm theo từng phần. Ghi rõ "Không mô phỏng đỗ/trượt: thiếu phần nghe và điểm liệt từng phần". Không quy đổi sang thang 180 |
| Gate kanji trong từ | `content.spec.ts` đổi từ "kanji phải là N5" thành "kanji phải có trong `kanji.json` với `level ≥ level của từ`", tức là cấp bằng hoặc dễ hơn. Nếu không thì `word` viết bằng kana, chữ kanji để ở trường `kanji` |

## Các giai đoạn (theo Quality Gate trong `AGENTS.md`)
Kiểm chung cho mọi giai đoạn UI:
- E2E Playwright ở 360×740 và 1440×900. Xem ảnh chụp trước khi kết luận.
- Fixture làm test fail khi có `console.error`.
- Axe không có lỗi serious/critical.
- Có E2E khẳng định không có request trình duyệt nào tới :4000.
- Kiểm cả hai trạng thái reduced-motion.
- Chạy `npm run check` ở cả hai app và `test:e2e`.

### 14. Thi thử (hoàn tất phần đang dở)
- **BE:**
  - Sửa `minutes` thành 60 trong `kotoba-be/content/tests.json` và trong `test/content.e2e-spec.ts`.
  - Thêm `explain` cho 45 câu `n5-1`, spec kiểm `explain` không rỗng (bảng quyết định).
- **`kotoba-fe/src/lib/test.ts` (thuần) và `test.test.ts` (Vitest):**
  - `score(paper, answers)` → `{ right, total, parts: {part, right, total}[] }`.
  - `remaining(startedAt, minutes, now)`.
  - `wrongIds(paper, answers)`.
- **`app/test/page.tsx` (server):**
  - Danh sách đề lấy từ `GET /tests`: tên đề, số phút, số câu.
  - Điểm lần trước đọc từ `kotoba.tests.v1` (client island).
  - Ghi rõ "Không có phần nghe".
- **`app/test/[id]/page.tsx`:** server lấy `GET /tests/:id`, `notFound()` khi BE trả 404. Trang render `TestApp.tsx` (client):
  - **Intro:** số câu, số phút, các phần thi, ghi chú không có phần nghe, nút amber "Bắt đầu".
  - **Làm bài:**
    - Bảng chọn câu 1…45 với các trạng thái chưa làm, đã làm, đánh dấu, câu hiện tại (`aria-current`, `aria-label` theo trạng thái).
    - Hiện tiến độ `18/45` và đếm ngược.
    - Nút Trước/Sau.
    - Phím tắt: `1–4` chọn đáp án, `←/→` chuyển câu, `F` đánh dấu. Viết theo mẫu `onKey` trong `ReviewApp.tsx`. Có bảng trợ giúp phím tắt (mục 8.1).
    - Mỗi lần trả lời ghi vào sessionStorage. Reload thì làm tiếp được.
    - Hết giờ thì tự nộp.
    - Nộp bài qua `<dialog>` native để xác nhận, có báo số câu chưa làm.
  - **Kết quả:**
    - `37/45 — 82%` và bảng điểm theo từng phần.
    - Phần yếu nhất.
    - Nút "Xem lại câu sai" và nút "Làm lại câu sai". Nút sau chỉ cho làm lại các câu `wrongIds`, không chấm vào kết quả đã lưu.
  - **Xem lại:** mỗi câu hiện lựa chọn của mình, đáp án đúng và giải thích.
- **Hiển thị `{…}` và `★`:** render phần `{…}` thành `<u>` và `★` thành ô trống, dùng chung một hàm nhỏ.
- **Nav:** thêm "Thi thử" vào `SiteBar.tsx` và `MenuNav.tsx`, `current: "test"`.
- **Dashboard:** nếu sessionStorage còn bài dở thì hiện "Làm tiếp N5-1 · câu 24/45".
- **Kiểm:**
  - BE: `npm run check`.
  - FE: Vitest cho `score`, `remaining`, `wrongIds`. Test RTL fake timers: tự nộp đúng một lần.
  - Playwright: làm trọn bài. Reload giữa bài, đáp án vẫn còn.
  - `page.clock` (hoặc `page.evaluate` lùi `startedAt`) quá 60 phút → reload → bài tự nộp.
  - Làm lại câu sai chạy được.

### 15. Bù từ vựng lên khoảng 700
- Soạn thêm khoảng 200 từ vào `kotoba-be/content/vocab.json`, theo đợt từng bài (lessons 5–24). Ưu tiên bài đang ít từ nhất. Mỗi từ gắn `reviewed:false`.
- Mỗi đợt phải qua:
  - `scripts/jmdict-check.ts`: âm đọc có trong JMdict, câu ví dụ chứa từ.
  - `content.spec.ts`: kanji trong từ phải là kanji N5, nếu không thì `word` viết bằng kana, chữ kanji để ở trường `kanji`.
- Sửa các con số đếm cố định trong e2e.
- **Kiểm:**
  - `npm run validate:content` pass.
  - `npm test` in ra số mục.
  - Playwright: `/vocab` hiện đủ bộ từ, con số khớp số trong JSON.

### 16. Số lần sai (`lapses`) và mục hay sai
- **BE:**
  - Thêm `lapses Int @default(0)` vào `Card` trong `prisma/schema.prisma`, migration tên `lapses`.
  - `isCard` trong `src/progress.ts` nhận thêm `lapses` tuỳ chọn, là số nguyên 0–10000.
  - Hàm `rows()` trong `progress.controller.ts` trả kèm `lapses`.
- **FE, `lib/srs.ts`:**
  - Thêm `lapses?: number` vào `Card`.
  - Trong `apply()`: trả lời sai thì `lapses + 1`, trả lời đúng thì giữ nguyên.
  - Thêm `weakest(srs, n)`: chỉ lấy card có `lapses ≥ 2`, sắp `lapses` giảm dần, rồi đến `box` tăng dần.
  - `srs.test.ts` thêm case cho cả hai, kèm fixture `tests/fixtures/progress.v1.without-lapses.json`.
  - `migrate()` và `parseSrs()` chấp nhận card cũ không có `lapses`.
  - Ghi ADR 002 nếu chưa có.
- **Dashboard:** khối "Hay sai", tối đa 5 mục, mỗi mục kèm "sai N lần" và link tới trang chi tiết. Khối có nút "Ôn các mục này" → `/review?weak=1`.
- **`/review?weak=1`:** `ReviewApp` lọc theo `weakest`. Dùng lại phần lọc `scoped` đang có.
- **Kiểm:**
  - Check, e2e cho `PUT /progress` có `lapses`, và card cũ không có `lapses` vẫn hợp lệ.
  - Playwright: trả lời sai 2 lần → dashboard hiện mục đó với "sai 2 lần" → ôn qua `?weak=1`.

### 17. Card nhiều hướng
- **`lib/library.ts`:** thêm hàm thuần `prompt(item, rand)` → `{ front, back, dir }`.
  - Vocab: `word→meaning`, `meaning→word`, và `word→reading` (chỉ khi `word !== reading`).
  - Kanji: `char→meaning`, `meaning→char`.
  - Kana giữ như cũ.
  - Có test Vitest với `rand` cố định (seed).
- `ReviewApp.tsx` và `FlashcardApp.tsx` gọi `prompt()` mỗi khi đổi sang card mới. Chấm điểm vẫn gọi `review(item.id, knew)`.
- Đưa phím `Space` và `1/2` sang `FlashcardApp`, dùng cùng mẫu với `ReviewApp`.
- **Kiểm:**
  - Vitest pass.
  - Playwright: thấy đủ cả 3 hướng trên cùng một bộ từ (giả `Math.random` bằng `page.addInitScript`).
  - Phím tắt chạy trên `/flashcards`.

### 18. Phiên học hằng ngày qua `/review`
- **Sửa ngày học trước (bảng quyết định):** một hàm `dayKey` duy nhất theo `Asia/Ho_Chi_Minh` trong `lib/activity.ts`, mọi nơi tính "hôm nay" và ngày đến hạn đều gọi hàm này. Test ranh giới nửa đêm VN. Commit riêng `fix(activity): compute study day in Asia/Ho_Chi_Minh`.
- Tách phần chọn bài trong `app/lessons/Path.tsx` (`target = started ?? open`) ra hàm thuần `currentLesson(stops, srs)` trong `lib/library.ts`. `Path.tsx` dùng lại hàm này.
- **`/review` không tham số:** gồm các mục đến hạn, cộng tối đa `NEW_PER_DAY − số mục mới đã học hôm nay` mục mới của `currentLesson`. Số mục đã học hôm nay lấy từ `summarize(activity).today`. `NEW_PER_DAY` đặt ở `src/config/`.
- Màn hình kết thúc hiện số mục, % trả lời đúng và số phút.
- Nút "Tiếp tục học" trên Dashboard:
  - Có mục đến hạn hoặc mục mới thì trỏ `/review`.
  - Không có thì giữ `continueHref(last)`.
- **Kiểm:**
  - Vitest cho `currentLesson` và `dayKey`.
  - Playwright với khách mới: `/review` có 10 mục mới của bài 1. Học hết → mở lại thì chỉ còn mục sai.

### 19. Trang từ vựng và kanji dễ nhầm
- **`app/vocab/[word]/page.tsx` (server):** gọi `GET /content/item/vocab:<word>`, `notFound()` khi BE trả 404. Trang hiện:
  - Từ, âm đọc, romaji, nghĩa.
  - Câu ví dụ kèm `<Speak>`.
  - Các kanji N5 trong từ, mỗi chữ link tới `/kanji/[char]`.
  - Link tới bài học.
  - Trạng thái SRS (client island đọc `useDeck`): hộp, ngày đến hạn, số lần sai.
- **Đổi link sang trang mới** ở:
  - Kết quả tìm vocab trong `app/search/page.tsx` (đang trỏ `/lessons/n#l-vocab`).
  - Danh sách từ trong `/kanji/[char]`.
  - Danh sách từ trong trang bài học.
- **Kanji dễ nhầm:**
  - Thêm `similar?: string[]` vào khoảng 10 cặp trong `kanji.json`, như 土/士, 日/目, 人/入, 未/末.
  - `scripts/kanjidic.ts` thêm `similar` vào kiểu `Authored` và giữ lại trường này.
  - `content.spec.ts` kiểm hai chiều: chữ trong `similar` có tồn tại, và quan hệ đối xứng.
  - `/kanji/[char]` hiện "Dễ nhầm với" kèm link.
- **Kiểm:**
  - Chạy lại `kanjidic.ts` không tạo diff.
  - Spec pass.
  - Playwright: từ `/search?q=taberu` mở được `/vocab/食べる`, và `/vocab/khongco` ra 404.

### 20. Heatmap và báo trạng thái đồng bộ
- Đọc skill `dataviz` trước (nếu không có trong phiên thì theo mục 8.1: không dùng màu làm kênh duy nhất, có nhãn chữ).
- **Heatmap trên Dashboard:**
  - Lưới 13 tuần × 7 ngày, lấy số phút từ `activity.days` (dữ liệu đang giữ 90 ngày). Ngày tính bằng `dayKey` của giai đoạn 18.
  - Chia mức bằng token màu sẵn có.
  - Mỗi ô có `aria-label`, ví dụ "3/11: 18 phút". Thêm một dòng chữ tóm tắt cho trình đọc màn hình.
  - Hàm thuần `heat(activity, today)` đặt trong `activity.ts`, có test Vitest.
- **Báo trạng thái đồng bộ:**
  - `Sync.tsx` publish trạng thái `saved | pending(n) | failed` qua một store `useSyncExternalStore` nhỏ trong `lib/store.ts`.
  - `SiteBar` hiện chữ `--silver-dim`: "Đã lưu", "Chờ lưu N thay đổi", hoặc "Lỗi đồng bộ · Thử lại". Thông báo qua `aria-live="polite"`.
  - Chỉ hiện khi đã đăng nhập.
- **Kiểm:**
  - Vitest cho `heat`.
  - Playwright: tắt BE (dừng tiến trình hoặc `page.route` không áp dụng vì gọi từ Next server, nên dừng BE thật) → "Lỗi đồng bộ" → bật lại BE → bấm Thử lại → "Đã lưu".

### 21. Xuất dữ liệu
- **BE:** `GET /me/export` (`AuthGuard`) trả `{ profile, cards, activity }`, có e2e. Không chứa mật khẩu hay token (mục 8.4).
- **FE:** route handler `app/settings/export/route.ts` gọi BE bằng token trong cookie, trả về file `kotoba-export.json` (`Content-Disposition: attachment`). Trình duyệt vẫn không gọi BE trực tiếp. Thêm link ở `/settings` và nhắc tới ở `/legal`.
- **Kiểm:**
  - e2e pass.
  - Playwright: tải về được file JSON, số card trong file bằng số card trên dashboard (mục 7.3). Khách bị chuyển hướng hoặc nhận 401.

## Lộ trình N4 → N3 → N2 (chạy liền sau giai đoạn 21)
Thứ tự cố định, không dừng chờ duyệt giữa các cấp. Chỉ commit khi kiểm qua, push sau mỗi commit. Giai đoạn nào kiểm không qua sau 3 hướng thử thì dừng cả lộ trình và báo kết quả thật (quy tắc dừng sớm).

Kiểm chung cho mọi giai đoạn nội dung:
- `npm run validate:content` pass (gồm `scripts/jmdict-check.ts` và `content.spec.ts`: gate kanji theo cấp, `similar` đối xứng, đề hợp lệ, `explain` không rỗng).
- `npm test` và e2e pass. Các con số đếm cố định trong e2e được sửa theo.
- Mọi mục mới gắn `reviewed:false`.
- Playwright mở `/lessons`, `/kanji?level=N`, `/vocab?level=N` và một trang bài mới, xem screenshot.

Ước lượng khối lượng mới cho mỗi cấp, theo danh sách Tanos, cần xác minh lại khi lấy nguồn:

| Cấp | Kanji mới | Từ mới | Ngữ pháp mới | Thời gian đề |
|---|---|---|---|---|
| N4 | ~170 | ~650 | ~40 | 80 phút |
| N3 | ~370 | ~1.800 | ~60 | 100 phút |
| N2 | ~370 | ~1.800 | ~90 | 105 phút |

### 22. Tổng quát hoá cấp độ (làm một lần)
- **BE:**
  - Thêm `level Int @default(5)` vào `Item` trong Prisma, migration tên `level`, index `[kind, level, sort]`.
  - Seed đọc `level` từ JSON.
  - `GET /content/*`, `/tests` và `/search` nhận `?level=` tuỳ chọn, dùng guard trong `validate.ts`. `/content/*` nhận thêm `?page=` cho danh sách lớn.
  - Đo thời gian seed. Nếu quá ~2 giây với 10k mục thì seed chỉ chạy khi hash của nội dung đổi (`ponytail:`).
- **`scripts/kanjidic.ts`:**
  - Ánh xạ cấp cũ sang cấp mới: 4 → 5, 3 → 4, 2 → 3 hoặc 2 theo file danh sách `scripts/levels.txt`. File này được sinh từ nguồn đã chốt và commit kèm ghi nguồn.
  - Vẫn giữ các trường tự soạn.
- **Content:**
  - Gắn `level: 5` cho toàn bộ nội dung N5 hiện có.
  - Đổi gate trong `content.spec.ts` như ở bảng quyết định.
- **FE:**
  - `lib/library.ts` thêm `LEVELS` và helper đọc `?level=`.
  - Tab cấp độ trên `/kanji`, `/vocab`, `/grammar`, `/flashcards`, `/test`.
  - Phân trang `?page=` trên `/vocab` và `/kanji`.
  - `/lessons` chia nhóm theo cấp.
  - Kết quả `/search` có badge cấp.
  - `/legal` ghi nguồn danh sách cấp độ.
- **Kiểm:**
  - Migration chạy trên `dev.db` có sẵn.
  - Chạy lại `kanjidic.ts` không tạo diff cho N5.
  - Playwright: tab N4 hiện trạng thái rỗng (empty state) đúng.

### 23–26. N4
- **23. Kanji N4:** chạy `kanjidic.ts`, soạn `vi`, gán `lesson`, thêm cặp `similar` mới nếu có.
- **24. Từ vựng N4:** soạn theo đợt khoảng 200 từ. Mỗi đợt là một giai đoạn con (24a, 24b, …), một commit, và phải qua gate.
- **25. Ngữ pháp và bài học N4:** soạn ngữ pháp kèm câu ví dụ. Thêm các bài nối tiếp số bài N5 vào `lessons.json`. Mỗi bài gồm kanji, từ và ngữ pháp của bài đó.
- **26. Đề thi thử N4-1:** `minutes: 80`, đủ các phần như N5, mỗi câu có `explain`. `content.spec.ts` kiểm tỉ lệ câu theo từng phần.
- **Kiểm thêm:** khách học xong toàn bộ N5 (dùng `page.evaluate` ghi SRS) → `/review` và "Tiếp tục học" chuyển sang bài N4 đầu tiên.

### 27–30. N3
- Lặp lại 23–26 cho N3. Từ vựng có khoảng 9 đợt (28a…28i).
- Đề N3-1 `minutes: 100`. Thêm các loại phần mới nếu N3 có mà N5 không có, ví dụ `usage` (cách dùng từ). `lib/test.ts` không cần biết loại phần, chỉ nhóm theo `part`.
- Màn hình kết quả hiện câu "không mô phỏng đỗ/trượt".

### 31–34. N2
- Lặp lại 23–26 cho N2. Từ vựng có khoảng 9 đợt (32a…32i).
- Đề N2-1 `minutes: 105`, thêm phần `formation` (cấu tạo từ). Phần đọc có đoạn dài hơn, cần kiểm bố cục ở 360×740 và 768px.

### 35. Hoàn thiện (giai đoạn 15 cũ, làm sau N2)
- Agent `impeccable-finish-reviewer` review toàn site, ghi lại verdict. Nếu plugin không có trong phiên: dùng agent `reviewer` của repo cộng screenshot, ghi rõ vào báo cáo.
- Lighthouse các trang chính, a11y ≥ 95 (cách chạy ở bảng quyết định).
- `impeccable-documenter` viết bản `DESIGN.md` cuối (có bảng thuật ngữ, mục 5.6).
- README hướng dẫn chạy cả 2 app, ghi nguồn và license JMdict/KANJIDIC (EDRDG) và danh sách cấp độ.
- Cập nhật `PRODUCT.md`, ghi rõ những gì cố ý không làm: listening, AI, CMS, PWA, XP.

## File chính
- **BE:** `content/{tests,vocab,kanji,grammar,lessons}.json`, `content/content.spec.ts`, `scripts/kanjidic.ts`, `scripts/levels.txt` (mới), seed, `prisma/schema.prisma` (+ migration), `src/progress.ts`, `src/progress.controller.ts`, `src/auth.controller.ts` (`/me/export`), `test/*.e2e-spec.ts`.
- **FE, file mới:** `lib/test.ts`, `lib/test.test.ts`, `src/config/`, `app/test/page.tsx`, `app/test/[id]/{page,TestApp}.tsx`, `app/vocab/[word]/page.tsx`, `app/settings/export/route.ts`, `e2e/**`.
- **FE, file sửa:** `lib/{srs,library,activity,store}.ts`, `app/{Dashboard,SiteBar,MenuNav,Sync}.tsx`, `app/review/ReviewApp.tsx`, `app/flashcards/FlashcardApp.tsx`, `app/lessons/Path.tsx`, `app/search/page.tsx`, `app/kanji/[char]/page.tsx`.
- **Tái sử dụng:**
  - `onKey` và `scoped` trong `ReviewApp.tsx`.
  - `summarize` và `continueHref` trong `activity.ts`.
  - `isLearned`, `isDue`, `review()`, `useDeck()`.
  - `Arrow`, `Speak`, các class `btn`.
  - Các guard trong `validate.ts`.

## Rủi ro
- **Nội dung tự soạn tăng thêm:** khoảng 200 từ, 45 lời giải thích và các cặp kanji dễ nhầm. Tất cả gắn `reviewed:false`. JMdict chỉ kiểm được âm đọc, không kiểm được nghĩa.
- **Migration `lapses` trên `dev.db` có sẵn:** script `prestart` chạy `migrate deploy`. Nhờ `@default(0)` nên card cũ vẫn hợp lệ.
- **Trộn hướng card:** câu hỏi nghĩa → từ khó hơn nên người học sẽ sai nhiều hơn, và `lapses` tăng theo. Chấp nhận được, đã ghi `ponytail:`.
- **Khối lượng nội dung N4–N2:** khoảng 900 kanji, 4.250 từ và 190 điểm ngữ pháp mới, tức gấp khoảng 8–10 lần N5. Tất cả là `reviewed:false`, và JMdict không kiểm được nghĩa tiếng Việt. Đây là phần tốn thời gian nhất và dễ sai nhất của lộ trình, cần nhiều phiên. Cần người duyệt lại trước khi coi là nội dung dùng được.
- **Nguồn tách N3/N2:** chưa xác minh license. Nếu phải dùng heuristic `freq` thì việc chia cấp chỉ gần đúng, phải ghi rõ ở `/legal`.
- **Đề N3/N2 không phản ánh đỗ/trượt thật:** thiếu phần nghe, mà từ N3 trở lên mỗi phần có điểm liệt (19/60). Kết quả chỉ để luyện tập.
- **Seed khi khởi động:** số mục tăng từ khoảng 1k lên khoảng 10k. Nội dung JSON lớn hơn sẽ làm boot chậm và diff khó review. Xử lý ở giai đoạn 22: đo trước, chỉ chuyển sang seed theo hash khi thật sự chậm.
- **Phụ thuộc giữa các giai đoạn:** giai đoạn 22 phải xong trước mọi nội dung N4. `currentLesson` (giai đoạn 18) là thứ giúp chuyển cấp liền mạch.
- **Cloud session:** máy tạm, mất hết khi phiên kết thúc nếu chưa push. Vì vậy push sau mỗi commit xanh và cập nhật PROGRESS trước khi hết phiên.
- **Dừng sớm:** một giai đoạn kiểm không qua sau 3 hướng thử thì dừng lại, báo kết quả thật, không commit phần hỏng.
