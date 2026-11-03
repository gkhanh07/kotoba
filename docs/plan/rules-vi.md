# Quy tắc làm việc gốc (17 mục, tiếng Việt)

Nguồn cho bản dịch `AGENTS.md` ở Task A. Khi hai bản lệch nhau, `docs/plan/PLAN.md` (mục "Quyết định cho cloud session") thắng.


1. Thứ tự ưu tiên

Khi phải đánh đổi, ưu tiên theo thứ tự:

Không làm mất/hỏng dữ liệu người dùng
Đúng (đúng yêu cầu, đúng logic, đúng dữ liệu hiển thị)
Ổn định (test đầy đủ, không flaky, không regression)
Dễ đọc, dễ bảo trì
Hiệu năng
Tốc độ hoàn thành

Không bao giờ hy sinh mục trên để đổi lấy mục dưới.

2. Nguyên tắc làm việc
Hiểu trước, làm sau. Đọc yêu cầu, đọc code liên quan (file cần sửa + nơi gọi nó + test hiện có) trước khi viết dòng đầu tiên.
Không đoán. Không đoán API, schema, tên file, hành vi thư viện. Không chắc → đọc code, đọc type, đọc docs của thư viện trong node_modules, hoặc viết thử nghiệm nhỏ để xác minh.
Thay đổi nhỏ, có mục đích. Chỉ sửa những gì task yêu cầu. Thấy vấn đề khác ngoài phạm vi → ghi vào docs/progress/BUGS.md hoặc docs/progress/BACKLOG.md, không tự sửa lan man (trừ bug Critical).
Theo convention có sẵn. Code mới phải trông như do cùng một người viết với code cũ: cùng cấu trúc thư mục, cách đặt tên, pattern state, cách style.
Trung thực tuyệt đối. Không nói "đã test" khi chưa chạy. Không nói "pass" khi chưa thấy output. Không che giấu test fail, cảnh báo hay phần làm chưa xong. Báo cáo đúng những gì đã thực sự xảy ra.
Tự chủ có giới hạn. Quyết định nhỏ thì tự quyết và ghi lại (ADR). Chỉ dừng hỏi trong các trường hợp ở mục 15.
3. Quy trình chuẩn cho mọi task
[1] Tiếp nhận → [2] Phân tích → [3] Kế hoạch → [4] Hiện thực → [5] Test
      → [6] Self review → [7] Quality Gate → [8] Commit → [9] Báo cáo
[1] Tiếp nhận (Definition of Ready)

Task chỉ bắt đầu khi trả lời được:

Mục tiêu là gì? Ai dùng? Thành công trông như thế nào?
Phạm vi gồm gì và không gồm gì?
Có ảnh hưởng dữ liệu đã lưu không?

Thiếu thông tin quan trọng → suy luận hợp lý từ code/tài liệu, ghi giả định vào spec. Chỉ hỏi khi giả định sai sẽ gây hậu quả khó sửa.

[2] Phân tích
Liệt kê file/màn hình/dữ liệu/luồng bị ảnh hưởng.
Tìm mọi nơi dùng code sắp sửa (grep theo tên hàm, type, key storage).
Xác định rủi ro: dữ liệu, hiệu năng, a11y, SSR/hydration, tương thích ngược.
[3] Kế hoạch

Với task lớn hơn ~50 dòng code hoặc chạm >3 file: viết spec ngắn tại docs/phases/ hoặc docs/tasks/<tên>.md:

Acceptance criteria dạng Given/When/Then, đánh số AC-n.
Ma trận test: AC-n ↔ test case ↔ tầng test.
Danh sách bước làm, mỗi bước có thể kiểm chứng được.
[4] Hiện thực
Đi từng bước nhỏ, sau mỗi bước chạy typecheck + test liên quan.
Tách logic thuần ra khỏi UI trước, viết test cho logic, rồi mới gắn UI.
Không để code ở trạng thái "nửa vời" giữa các bước (không TODO treo, không code chết).
[5] Test → theo mục 7
[6] Self review → theo mục 9
[7] Quality Gate → theo mục 10
[8] Commit → theo mục 4
[9] Báo cáo → theo mục 14
Biến thể theo loại task
Loại	Khác biệt so với quy trình chuẩn
Feature	Đủ 9 bước. Bắt buộc spec + E2E cho luồng chính.
Bugfix	Bước [4] bắt đầu bằng test tái hiện bug (phải fail), xem mục 11.
Refactor	Không đổi hành vi. Test hiện có phải pass trước và sau mà không sửa test. Nếu thiếu test, viết test khóa hành vi trước khi refactor.
Content	Theo mục 12. Bắt buộc validate:content + kiểm JMdict.
Chore/Config	Chạy đủ Quality Gate; ghi lý do thay đổi dependency/config trong commit message.
4. Quy tắc Git
Không push, không force push, không rebase/amend commit đã có, không xóa branch, không đổi remote, trừ khi tôi yêu cầu rõ ràng.
Một commit = một thay đổi logic hoàn chỉnh, build được, test pass. Không commit code hỏng "để sửa sau".
Trước khi commit: git status + git diff --staged để chắc chỉ commit đúng file. Không commit: .env*, secret, file build (.next/, dist/, coverage/), file tạm, log, ảnh debug, node_modules.
Conventional Commits, tiếng Anh, thể mệnh lệnh:
feat(scope): ... tính năng mới
fix(scope): ... sửa bug
refactor(scope): ... không đổi hành vi
test(scope): ... chỉ thêm/sửa test
content(level): ... nội dung học
docs: ..., chore: ..., perf(scope): ..., style: ...
Body commit: tóm tắt thay đổi, AC đã đạt, số test thêm, bug liên quan (BUG-xxx), ADR liên quan.
Commit fail do hook (lint-staged, husky) → sửa nguyên nhân, không dùng --no-verify.
5. Chuẩn code
5.1 TypeScript
strict mode. Không thêm any, as unknown as, @ts-ignore, @ts-expect-error mới (trừ khi có comment giải thích vì sao bắt buộc).
Ưu tiên type suy luận được; khai báo type rõ cho API công khai của module (tham số, giá trị trả về của hàm export).
Dùng union literal / discriminated union cho trạng thái (status: 'idle' | 'saving' | 'saved' | 'error'), không dùng nhiều boolean rời rạc.
Dữ liệu từ bên ngoài (localStorage, file JSON, API, URL param) là không tin cậy → validate (zod hoặc type guard) trước khi dùng.
5.2 React / Next.js
Component nhỏ, một trách nhiệm. Logic phức tạp → custom hook hoặc pure function.
Không truy cập window, localStorage, Date.now(), Math.random() trong lúc render phía server. Đưa vào useEffect hoặc component client-only để tránh hydration mismatch.
Mọi setInterval/setTimeout/event listener/subscription phải được dọn trong cleanup.
key của list dùng id ổn định, không dùng index (trừ list tĩnh không đổi thứ tự).
Không lưu dữ liệu suy ra được (derived state) vào state; tính từ nguồn. Dùng useMemo chỉ khi đo được là cần.
Server Component mặc định (App Router); chỉ 'use client' khi cần tương tác/browser API.
5.3 Đặt tên & cấu trúc
Tên mô tả ý nghĩa: dueCards, remainingMs, calculateSectionScore. Không viết tắt khó hiểu.
Boolean bắt đầu bằng is/has/can/should.
Không magic number/string: đưa vào hằng số có tên (MAX_NEW_ITEMS_PER_DAY = 10, N5_EXAM_DURATION_MIN = 60).
Hằng số cấu hình nghiệp vụ tập trung một chỗ (ví dụ src/config/), không rải rác.
5.4 Xử lý lỗi
Không nuốt lỗi im lặng (catch {} rỗng bị cấm). Hoặc xử lý, hoặc log + hiển thị trạng thái lỗi cho người dùng.
Parse JSON/storage luôn trong try/catch, có fallback an toàn không ghi đè dữ liệu gốc khi parse lỗi (backup bản hỏng trước nếu phải reset).
Mọi màn hình có dữ liệu bất đồng bộ phải có đủ 4 trạng thái: loading, rỗng, lỗi, có dữ liệu.
5.5 Comment
Comment giải thích tại sao, không giải thích làm gì (code đã nói).
Thuật toán không hiển nhiên (SRS, chấm điểm, tính heatmap) cần comment ngắn mô tả quy tắc + link ADR.
Không để code bị comment-out, không để console.log debug.
5.6 Text giao diện
Tiếng Việt có dấu đầy đủ, nhất quán thuật ngữ (lập bảng thuật ngữ trong DESIGN.md nếu chưa có).
Tiếng Nhật giữ nguyên, dùng đúng font hỗ trợ CJK, furigana bằng <ruby> nếu app có.
Text hiển thị tập trung, không hard-code rải rác nếu repo đã có cơ chế quản lý text.
6. Dữ liệu & lưu trữ
Dữ liệu tiến độ người dùng là bất khả xâm phạm. Mọi thay đổi cấu trúc phải:
Tăng schemaVersion.
Có hàm migration từ mọi phiên bản cũ lên phiên bản mới (chạy tuần tự v1→v2→v3…).
Có test migration với fixture dữ liệu thật của từng phiên bản cũ.
Không bao giờ xóa trường cũ trước khi migration xong và đã kiểm chứng.
ID nội dung là vĩnh viễn. Không đổi, không tái sử dụng id của từ/kanji/ngữ pháp/câu hỏi đã phát hành. Muốn bỏ một mục → đánh dấu deprecated, không xóa.
Ghi dữ liệu an toàn: ghi nguyên tử (atomic) khi có thể; không ghi đè dữ liệu tốt bằng dữ liệu rỗng/hỏng; xử lý lỗi quota đầy.
Nhiều tab: cân nhắc sự kiện storage / BroadcastChannel; chiến lược xung đột phải được ghi ADR.
Thời gian: lưu timestamp UTC (ms); quy đổi "ngày học" theo múi giờ Asia/Ho_Chi_Minh tại một hàm duy nhất, có test ranh giới nửa đêm.
7. Chuẩn kiểm thử
7.1 Kim tự tháp
Tầng	Công cụ	Dùng cho	Yêu cầu
Unit	Vitest	Logic thuần (SRS, chấm điểm, chọn thẻ, migration, export, heatmap)	Coverage ≥ 90% lines & branches cho thư mục logic
Component	Vitest + RTL + user-event	Render dữ liệu, trạng thái, tương tác	Mỗi component có trạng thái rỗng/lỗi đều được test
Integration	Vitest + storage thật (jsdom / fake-indexeddb)	Component + hook + storage	Luồng đọc/ghi/reload
E2E	Playwright (mobile 360×740 + desktop 1440×900)	User journey nhiều màn hình	Mọi luồng chính + axe a11y scan
Content	Script validate:content	Dữ liệu học	Chạy trong mọi Quality Gate
7.2 Phải xét đủ các nhóm trường hợp

Với mọi tính năng, đi qua danh sách này; mục không áp dụng ghi N/A + lý do trong spec:

Happy path
Biên: 0, 1, max, max+1, còn 1 giây, đúng nửa đêm
Rỗng / chưa có dữ liệu
Dữ liệu sai/hỏng/phiên bản cũ
Lỗi mạng, offline, timeout, storage đầy
Đồng thời: double click, 2 tab, thao tác chồng nhau
Thời gian: tab ẩn, sleep, reload giữa chừng, qua ngày, đổi múi giờ
Persistence: reload/đóng mở lại giữ đúng trạng thái
Chuyển trạng thái hợp lệ và không hợp lệ
Điều hướng: back/forward, vào thẳng URL, URL/id sai → 404
Bàn phím & a11y
Hiển thị: text dài, responsive, dark mode (nếu có), không tràn/che
Hiệu năng với dữ liệu lớn (≥ 5.000 mục)
7.3 Quy tắc "dữ liệu hiển thị"
Mọi con số/nhãn động trên UI phải có test khẳng định giá trị chính xác, tính từ fixture biết trước. toBeVisible() hay "trang không crash" không được coi là test dữ liệu.
Đối chiếu chéo: cùng một số liệu hiển thị ở nhiều nơi (dashboard, chi tiết, kết quả, file export) phải bằng nhau và bằng dữ liệu lưu.
Kiểm tra định dạng (%, làm tròn, mm:ss, ngày giờ VN), thứ tự sắp xếp, kết quả lọc (không trùng, không sót).
7.4 Viết test tốt
Tên test mô tả hành vi: it('auto-submits exactly once when the timer reaches zero').
Cấu trúc Arrange – Act – Assert. Một test kiểm một hành vi.
Xác định (deterministic): fake timers/clock, random có seed, không phụ thuộc thứ tự chạy, không dùng sleep cố định trong E2E (dùng auto-wait / expect.poll).
Query theo vai trò người dùng (getByRole, getByLabelText), hạn chế data-testid, không query theo class CSS.
Fixture đặt trong tests/fixtures/, dùng lại, có tên rõ ý (progress.v1.with-lapses.json).
E2E: fail nếu có console.error hoặc page error.
Test mới phải được thấy fail ít nhất một lần (đảo assertion hoặc tắt code) để chắc nó thực sự kiểm tra đúng thứ.
7.5 Cấm
test.skip, .only, xit, comment-out test, xóa assertion, nới lỏng assertion cho pass.
Sửa test cho khớp code sai. Nếu test sai thật → sửa test và ghi lý do trong commit.
Mock chính module đang được test.
Snapshot test cho component lớn thay cho assertion có ý nghĩa.
8. Giao diện, a11y, hiệu năng, bảo mật
8.1 Accessibility (mục tiêu Lighthouse a11y ≥ 95, axe 0 lỗi serious/critical)
HTML semantic (button cho hành động, a cho điều hướng, heading đúng thứ bậc).
Mọi control có label; icon-only button có aria-label.
Điều khiển hoàn toàn bằng bàn phím; focus luôn nhìn thấy; modal giữ focus và trả focus khi đóng.
Thông báo động (trạng thái lưu, hết giờ, kết quả) qua aria-live ở mức hợp lý, không spam mỗi giây.
Không dùng màu làm kênh thông tin duy nhất (đúng/sai, heatmap). Tương phản ≥ 4.5:1.
Phím tắt: có bảng trợ giúp, không kích hoạt khi focus ô nhập, không đè phím tắt của trình duyệt/screen reader.
8.2 Responsive & hiển thị
Kiểm tra tại 360px, 768px, 1440px. Không scroll ngang, không tràn chữ, vùng bấm ≥ 44×44px trên mobile.
Sau thay đổi UI: chụp screenshot bằng Playwright ở mobile + desktop và xem ảnh trước khi kết luận.
8.3 Hiệu năng
Danh sách lớn: phân trang hoặc virtualization.
Không import cả thư viện lớn khi chỉ cần một hàm; dynamic import cho phần nặng ít dùng.
Không chặn main thread khi xử lý dữ liệu lớn; đo trước/sau khi tối ưu, ghi số liệu vào báo cáo.
8.4 Bảo mật & riêng tư
Không dangerouslySetInnerHTML với dữ liệu chưa sanitize.
Không log/xuất dữ liệu nhạy cảm; file export chỉ chứa tiến độ học.
Không commit secret; biến môi trường public phải có tiền tố đúng (NEXT_PUBLIC_) và không chứa bí mật.
Dependency mới: kiểm tra mức độ phổ biến, bảo trì, giấy phép; ghi lý do.
9. Checklist self code review (chạy trên git diff trước mỗi commit)

Đúng đắn

 Đáp ứng đủ mọi AC, không làm thừa ngoài phạm vi
 Xử lý đủ trạng thái rỗng / lỗi / loading / biên
 Không phá tương thích dữ liệu cũ (có migration + test nếu đổi schema)

Chất lượng

 Đặt tên rõ, hàm ngắn, không lặp code, không magic number
 Không any, ts-ignore, console.log, code chết, TODO treo
 Cleanup đầy đủ (timer, listener, subscription)
 Không hydration mismatch, không re-render thừa rõ ràng

Test

 Mỗi AC có test; các nhóm 7.2 đã được xét
 Mọi số liệu hiển thị mới có test giá trị chính xác
 Test xác định, không flaky, đã thấy fail ít nhất một lần

UI/a11y

 Bàn phím, focus, label, aria-live, tương phản
 Đã xem screenshot mobile + desktop

Tài liệu

 Spec/ADR/PROGRESS/BUGS đã cập nhật

Ghi các điểm tự phát hiện và đã sửa vào cuối file spec của task.

10. Quality Gate (Definition of Done)

Một task chỉ được coi là xong khi tất cả đều đạt, và đã thực sự chạy các lệnh:

 lint: 0 lỗi, 0 cảnh báo mới
 typecheck: 0 lỗi
 test: 100% pass, coverage logic ≥ 90%
 test:e2e: 100% pass trên mobile + desktop; axe 0 lỗi serious/critical; không console error
 validate:content: pass
 build: thành công, không cảnh báo mới
 Checklist mục 9 đã đi qua
 Tài liệu đã cập nhật
 Đã commit theo mục 4

Nếu một mục không thể đạt → không commit, báo cáo rõ nguyên nhân và những gì đã thử.

11. Quy trình xử lý bug
Ghi nhận vào docs/progress/BUGS.md với mã BUG-xxx:
Mô tả, bước tái hiện, mong đợi, thực tế, môi trường
Mức độ: Critical (mất dữ liệu, crash, chặn luồng chính) / High (sai kết quả, sai số liệu) / Medium (lỗi phụ, có cách vòng) / Low (thẩm mỹ)
Tái hiện bằng test (unit nếu được, E2E nếu cần), test phải fail.
Tìm nguyên nhân gốc (hỏi "tại sao" đến khi ra gốc). Không vá triệu chứng, không thêm if đặc biệt cho đúng một trường hợp.
Sửa, test chuyển sang pass, giữ làm regression test.
Quét các chỗ tương tự có cùng kiểu lỗi và sửa luôn.
Cập nhật BUGS.md: nguyên nhân gốc, cách sửa, test, commit.
Ưu tiên: Critical sửa ngay (commit riêng fix:) trước khi làm tiếp; High sửa trong task hiện tại; Medium/Low đưa vào backlog nếu ngoài phạm vi.

Sau 3 lần thử theo 3 hướng khác nhau vẫn không sửa được → dừng, báo cáo những gì đã thử và giả thuyết hiện tại.

12. Quy tắc nội dung học (từ vựng, kanji, ngữ pháp, đề thi)
Không bịa. Mọi cách đọc phải được kiểm bằng JMdict (scripts/verify-jmdict.ts). Không chắc → needsReview: true và liệt kê trong báo cáo.
Mỗi mục có đủ trường bắt buộc theo schema, trong đó có level. Một từ chỉ thuộc một cấp.
Không trùng (cùng chữ + cùng cách đọc) trong toàn bộ dữ liệu.
Nghĩa tiếng Việt tự nhiên, ngắn gọn, đúng ngữ cảnh; ví dụ đúng ngữ pháp, có bản dịch.
Đề thi: dùng nội dung thuộc cấp đó hoặc thấp hơn; đáp án nhiễu hợp lý; mỗi câu có giải thích; thời gian đúng cấu hình của cấp.
Soạn theo đợt ~200 mục, mỗi đợt một commit content(<level>): ..., chạy validate:content + JMdict trước khi commit.
Nguồn dữ liệu và giấy phép (JMdict/KANJIDIC – EDRDG) được ghi trong README.
13. Tài liệu bắt buộc duy trì
File	Nội dung	Khi nào cập nhật
docs/progress/PROGRESS.md	Trạng thái từng giai đoạn/task, baseline, số test	Đầu và cuối mỗi task
docs/progress/BUGS.md	Mọi bug, mức độ, nguyên nhân, cách sửa	Khi phát hiện / sửa bug
docs/progress/BACKLOG.md	Việc phát hiện ngoài phạm vi	Khi phát hiện
docs/phases/*.md, docs/tasks/*.md	Spec, AC, ma trận test, kết quả review	Trước khi code, sau khi review
docs/decisions/NNN-*.md	ADR: Bối cảnh, Phương án, Quyết định, Hệ quả	Mỗi quyết định ảnh hưởng dữ liệu/kiến trúc/hành vi
DESIGN.md	Kiến trúc, mô hình dữ liệu, thuật toán, quy ước UI, thuật ngữ	Khi kiến trúc thay đổi
README.md	Cài đặt, script, cách test, cách thêm nội dung	Khi quy trình thay đổi

PROGRESS.md là nguồn sự thật để tiếp tục khi phiên bị ngắt: đầu mỗi phiên, đọc file này trước.

14. Giao tiếp & báo cáo
Viết báo cáo bằng tiếng Việt, ngắn gọn, dữ kiện cụ thể (số test, hash commit, tên file).
Không kể lể từng bước đã làm; tập trung vào kết quả, quyết định, rủi ro.
Mẫu báo cáo sau mỗi task:
## <Task/Giai đoạn>: <tên> — DONE | BLOCKED | PARTIAL
- Commit: <hash> <message>
- AC: x/y đạt (chưa đạt: AC-n — lý do)
- Test: +a unit, +b component, +c e2e | tổng N | coverage logic x%
- Quality Gate: lint ✓ typecheck ✓ test ✓ e2e ✓ content ✓ build ✓
- Bug: tìm thấy n, đã sửa m (BUG-xxx…)
- Quyết định cần duyệt: ADR-xxx …
- needsReview: …
- Rủi ro / việc còn lại: …
15. Khi nào dừng lại hỏi

Chỉ dừng và hỏi khi:

Thay đổi có thể xóa/hỏng dữ liệu người dùng mà không migration an toàn được.
Yêu cầu mâu thuẫn nhau làm thay đổi mô hình dữ liệu hoặc trải nghiệm chính.
Cần thao tác không thể hoàn tác ngoài repo (push, deploy, xóa dữ liệu thật, thay đổi dịch vụ bên ngoài).
Thiếu tài nguyên bắt buộc (file JMdict, credential, quyền truy cập).
Bị kẹt sau 3 hướng thử khác nhau.

Ngoài các trường hợp trên: chọn phương án hợp lý nhất, ghi ADR, làm tiếp, đưa vào báo cáo để duyệt.

Khi hỏi: nêu bối cảnh 1–2 câu, các phương án (kèm phương án đề xuất), hệ quả của từng phương án.

16. Danh sách CẤM (tóm tắt)
❌ Push, force push, amend/rebase commit cũ, --no-verify
❌ Commit khi Quality Gate chưa xanh
❌ Skip/xóa/nới lỏng test để pass
❌ Nói đã test/đã pass khi chưa chạy thật
❌ Đổi id nội dung đã phát hành, đổi schema không migration
❌ Bịa cách đọc, nghĩa, ví dụ; bỏ qua kiểm JMdict
❌ any, ts-ignore, console.log, catch {} rỗng, code comment-out
❌ Sửa lan man ngoài phạm vi task
❌ Thêm dependency không cần thiết, không ghi lý do
❌ Commit secret, file build, file tạm
17. Lệnh thường dùng

Cập nhật đúng theo package.json của repo ở Giai đoạn 0.

bash
npm run dev               # chạy local
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
npm run test              # unit + component + integration
npm run test:coverage     # kèm coverage
npm run test:e2e          # Playwright
npm run validate:content  # kiểm dữ liệu nội dung + JMdict
npm run build             # build production
npm run check             # chạy toàn bộ Quality Gate
