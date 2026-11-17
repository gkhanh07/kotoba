# Kotoba: bổ sung chức năng N5 và lộ trình nội dung N5 → N4 → N3

> **Đổi phạm vi (chốt với người dùng 2026-11-04):** lộ trình dừng ở N3. Bỏ các giai đoạn 31–34 (N2). Giai đoạn 35 (hoàn thiện) cũng bỏ khỏi lộ trình (2026-11-11); việc bắt buộc của nó nằm trong BACKLOG. Số giai đoạn giữ nguyên để các tham chiếu cũ (ADR, BACKLOG, spec) vẫn đúng.

> **Đợt hoàn thiện N5–N3 (chốt với người dùng 2026-11-14): phase 36–42 ở mục ngay dưới đây, thắng các mục cũ khi lệch.**

## Đợt hoàn thiện N5–N3: phase 36–42 (2026-11-14)

### Bối cảnh

Kotoba đã xong các phase 0–30: kana, 625 kanji, 3.046 từ, 138 điểm ngữ pháp, 81 bài, 3 đề thi thử, SRS Leitner, đồng bộ tài khoản, dashboard, tìm kiếm, redesign (ADR 010). Rà soát cho thấy sản phẩm chạy thật, không có mock data, nhưng còn thiếu so với yêu cầu "sản phẩm hoàn chỉnh": một số tính năng chưa có (yêu thích, chủ đề từ vựng, luyện đọc riêng, bài tập ngữ pháp, gõ đáp án, kiểm tra trình độ, lịch sử thi trên server), một loạt việc dở trong BACKLOG, vài lỗ hổng BE, và ~70 từ đồng âm bị bỏ.

Quyết định của người dùng (2026-11-14):
- **Không làm luyện nghe** đợt này (giữ non-goal trong PLAN.md, thêm sau).
- **Đặt `reviewed: true` cho nội dung N3**: người dùng đã duyệt N3 và ra lệnh trực tiếp. N5/N4 giữ `false` cho tới khi người dùng nói rõ. Nội dung mới viết trong đợt này luôn `reviewed: false`.
- Hai file sửa dở: tôi hoàn thiện rồi commit.
- Git: chỉ commit cục bộ trên `feat/n5-full`, không push, không merge.
- Id từ đồng âm mới: `vocab:<kana>:<kanji>`; id cũ giữ nguyên.
- Trần nội dung vẫn là N3. Giữ token/phông/chủ đề ADR 010, nhưng đổi cấu trúc, bố cục và luồng học (Phase 41).
- 6 ảnh mẫu người dùng gửi: **chỉ lấy UX**, không sao chép giao diện (Phase 41 mục 8).

Mọi phase theo AGENTS.md: spec `docs/phases/NN-*.md` (AC + ma trận test) → test đỏ → code → reviewer → Quality Gate → commit Conventional, không AI attribution. Checklist tiến độ: `docs/progress/PROGRESS.md` + `docs/plan/PLAN.md`, cập nhật đầu và cuối mỗi phase.

### Thứ tự thực hiện

#### Phase 36 — Dọn nền (làm ngay)
1. `chore(fe)`: `kotoba-fe/next.config.ts` đọc `allowedDevOrigins` từ biến môi trường (`ALLOWED_DEV_ORIGINS`, thêm vào `.env.example`), bỏ IP ghi cứng; `src/lib/i18n.ts` giữ hero tiếng Việt mới, cập nhật bản `en` và test liên quan.
2. `docs:` ghi các quyết định trên vào PLAN/PROGRESS; ADR 011 (id đồng âm); ghi ngoại lệ "người dùng ra lệnh đặt reviewed N3" vào PROGRESS.
3. `content(n3)`: đặt `reviewed: true` cho mọi mục `level: 3` trong `vocab.json`, `kanji.json`, `grammar.json` và đề `n3-1`; chạy `validate:content`.

#### Phase 37 — Việc dở và lỗi hiển thị (BACKLOG) — xong
- Bỏ N2 khỏi `LEVELS` (`kotoba-fe/src/lib/library.ts`, `kotoba-be/src/config.ts`), sửa `LevelTabs.test.tsx`, `e2e/levels.spec.ts`; danh sách mục tiêu chỉ chào N5–N3 nhưng vẫn đọc được giá trị N2/N1 đã lưu (`lib/account.ts` `GOALS` không đổi).
- Bỏ nút Google bị vô hiệu (`(auth)/forms.tsx`); thanh "Giai đoạn: Kana" tính từ dữ liệu thật (`Dashboard.tsx`).
- Copy sai phạm vi: `testText.ts` ("JLPT N5" trên đề N4/N3), mô tả bài học trong `library.ts`, `/legal`, footer ghi nguồn Hán Việt.
- `TestApp`: `\n` trong `passage` thành đoạn; mũi tên không chặn cuộn ngang.
- Kanji: không render span `hv` rỗng, hàng "Âm On" rỗng; gập âm hiếm.
- Chú giải ký hiệu N/V/A trên trang ngữ pháp; romaji thống nhất chữ thường.
- Số đến hạn: dashboard chỉ đếm thẻ còn trong nội dung; `/vocab` và `/review?kind=vocab` cùng phạm vi level; `/flashcards` mặc định theo thứ tự bài (`byLesson` trong `content.controller.ts`).
- `loading.tsx` cho các route còn thiếu; `/review` chỉ gửi mục trong phạm vi (hiện 1,8 MB HTML).
- Bài học: dạy trước, hỏi sau; onboarding không hỏi lại mục tiêu đã chọn.
- Docs: README (credit EDRDG), `kotoba-be/README.md`, `PRODUCT.md` non-goals, `DESIGN.md` trùng Glossary; chuyển `INTERVALS`/`KNOWN_AT` vào `src/config/`.

#### Phase 38 — Bảo mật và độ bền BE — xong
- `kotoba-fe/src/lib/auth.ts`: không chuyển tiếp `x-forwarded-for` của client; e2e dùng cơ chế riêng cho test.
- Rate limit cho `/me/password`, `DELETE /me`, `/auth/reset`; dọn token hết hạn; giới hạn số thẻ mỗi lần `PUT /progress`.
- Lỗi reset-khi-đang-push (BACKLOG, mất dữ liệu → ưu tiên 1).
- Mail: `mailer.ts` gửi SMTP khi có cấu hình env, không có thì giữ log (ADR cho dependency). **Cần người dùng cấp SMTP mới gửi thật**; tôi không tự đăng ký dịch vụ.
- Nâng ngưỡng coverage BE theo ratchet.

#### Phase 39 — Từ đồng âm — xong
- `be`: chấp nhận id `vocab:<kana>:<kanji>` (seed, `content.spec.ts`, `jmdict-check.ts`, route `/vocab/[word]`), test fixture id cũ không đổi.
- `content`: thêm ~70 từ đã bỏ qua (danh sách trong BACKLOG), `reviewed: false`, kèm mẫu duyệt có seed.

#### Phase 40 — Tính năng học mới
Dùng lại `useDeck`/`review()` (`lib/store.ts`, `lib/srs.ts`), `prompt()`/`choicesFor` (`lib/library.ts`), `Sync.tsx`, guard trong `kotoba-be/src/validate.ts`.
1. **Yêu thích**: trường tuỳ chọn trên Card (ADR 002, không bump version) + cột Prisma mới (migration cộng thêm), nút sao ở trang chi tiết, bộ lọc và bộ thẻ "Đã lưu".
2. **Gõ đáp án**: chế độ nhập kana/romaji cho kana và từ vựng bên cạnh trắc nghiệm.
3. **Luyện ngữ pháp**: bài điền chỗ trống/sắp xếp câu sinh từ `examples`; đưa ngữ pháp vào SRS.
4. **Bật/tắt furigana và romaji**: thiết lập hiển thị, lưu cục bộ + hồ sơ.
5. **Từ vựng theo chủ đề**: trường `topic` (BE đã lọc sẵn `topic`), gán theo lô nội dung; trang lọc theo chủ đề.
6. **Luyện đọc**: trang riêng dùng lại các đoạn văn trong đề, thêm đoạn mới theo lô (`reviewed: false`).
7. **Kiểm tra trình độ**: bài ngắn lấy từ ngân hàng câu hỏi, gợi ý level và bài bắt đầu ở onboarding.
8. **Lịch sử thi trên server**: bảng `TestResult`, đồng bộ từ `kotoba.tests.v1`, hiện ở dashboard và export.
9. **Quản lý nội dung đã học**: danh sách theo trạng thái, đặt lại từng mục/bộ (`resetDeck`); lộ trình hằng ngày theo mục tiêu và ngày thi (`lib/daily.ts` `continueTarget`).

#### Phase 41 — Thay đổi lớn nhìn thấy ngay khi vào trang
Yêu cầu của người dùng: sau khi xong phải thấy khác hẳn, không phải vài chức năng lẻ. Giữ hệ token/phông/chủ đề ADR 010 (không vứt công redesign), nhưng **đổi cấu trúc và bố cục** các màn chính. Ghi ADR 012.
**Luồng UX (gộp bản spec "Shiori" người dùng gửi với UI hiện có).** Chỉ lấy luồng và hành vi; mục 9 "Visual rules" của spec (hệ Classical, mã màu hex, inline style) bỏ hẳn vì trái ADR 010 và luật `var(--token)`.

```
[Khách] /  ── bài thử 3 câu ── chọn trình độ ──► /register (mang theo trình độ) ──► kiểm tra trình độ (bỏ qua được)
                                                                                      │
[Đã đăng nhập]  Hôm nay (/) · Lộ trình (/lessons) · Luyện tập (/review) · Thư viện (/library) · Tiến độ (/progress)
                     └──────────────┴──────────────────┴──► Phiên học (tập trung, ẩn nav) ──► Kết quả ──► Hôm nay
```

Nguyên tắc giữ (thành AC của spec phase): một hành động chính mỗi màn (`.btn` chính duy nhất); người học luôn thấy đang ở đâu / làm gì / còn bao lâu; nhớ lại chủ động, không hiện đáp án cạnh câu hỏi; mỗi màn một khái niệm; phản hồi tức thì có lý do; nút chính cố định; bàn phím đầy đủ (Space/Enter, 1–4, 1/2 Quên/Nhớ, Esc thoát); kanji neo bằng âm Hán Việt và đứng sau từ chứa nó; không popup chúc mừng, không confetti (ràng buộc luôn mục 7).

Thứ tự một phiên, không đổi: **Ôn thẻ đến hạn → Từ mới → Kanji → Ngữ pháp → Ghép câu → Luyện tập → Kết quả**, dựng từ nội dung của bài hiện tại trong 81 bài sẵn có; bước nào bài không có thì bỏ (bài kana không có kanji/ngữ pháp). Nút "Ôn ngay" chạy phiên chỉ gồm bước ôn.

Sửa so với spec, có lý do:
| Spec nói | Làm thế nào | Vì sao |
|---|---|---|
| Phiên cố định 15 phút, mỗi bài ~15 phút | Phiên cắt theo mục tiêu phút và `NEW_PER_DAY`; bài dài trải nhiều ngày; "≈ n phút còn lại" là ước lượng từ số bước | Bài hiện có lệch nhau (bài 13 có 51 mục) |
| Bài sau khoá tới khi xong bài trước, "mở vào ngày mai" | Không khoá. Chỉ một bài có nút "Học tiếp"; bài khác vẫn mở được | Người đã biết N5 hoặc đặt mục tiêu N3 sẽ bị chặn; hiện app cho vào tự do |
| Quên = gặp lại sau 10 phút | Nhãn "gặp lại trong phiên này"; thẻ chèn lại cuối phiên, về hộp 1 | Leitner tính theo ngày; không đổi thuật toán, không migration |
| Câu sai quay lại sau 2 câu (ảnh) / cuối phiên (spec) | Cuối phiên, bộ đếm ghi "làm lại câu sai"; phiên chỉ xong khi trả lời đúng hết | Chọn một quy tắc; cuối phiên giãn cách xa hơn |
| Modal đăng ký/đăng nhập, nút Google | Giữ trang `(auth)` hiện có; trình độ chọn ở trang khách đi theo query vào form | Trang riêng đã có test, URL trực tiếp, a11y; Google ngoài phạm vi |
| Hero "Mỗi ngày 15 phút…" | Giữ câu hero người dùng tự viết (Phase 36) | Yêu cầu đã chốt |
| Nav 4 mục, không có Thi thử/Thư viện | 5 mục; Thi thử nằm trong Luyện tập | App có đề thi và thư viện tra cứu, spec thì không |
| Bạn bè, bảng xếp hạng, nhắc 20:00, nút Nghe (R), mẹo nhớ, tập viết | Bỏ | Đã quyết ở mục 8 |
| Nút chính màn Kết quả là "Nhắc tôi…" | Nút chính "Về Hôm nay", phụ "Học thêm 5 phút" | Không có nhắc học |

Giữ thêm từ spec: lưu vị trí phiên bỏ dở để tiếp tục (cục bộ, theo ngày học); mục tiêu phút 5/10/15/20/30; furigana mặc định bật; XP = 10 × câu đúng + 5 × mục mới + 30 khi xong bài, 260 XP mỗi cấp (hằng số ở `src/config/`; nếu `kotoba.activity.v1` chưa ghi số câu đúng thì thêm trường tuỳ chọn, ngày cũ tính 0); bố cục mobile của phiên: chân trang dính đáy, nút ≥ 44px.

Thứ tự làm (mỗi bước một commit xanh, đi từ phần lõi dùng chung ra vỏ): (a) khung phiên học chung trích từ bài học/ôn tập/flashcard hiện có → (b) sáu loại bước trong phiên → (c) Kết quả + XP → (d) Hôm nay → (e) Lộ trình → (f) Luyện tập → (g) Tiến độ → (h) Thư viện → (i) điều hướng + trang khách → (j) hiệu ứng → (k) hoạt ảnh nét.

1. **Điều hướng mới** (`SiteBar.tsx`, `MenuNav.tsx`): Hôm nay · Lộ trình · Luyện tập · Thư viện · Tiến độ; thanh trên có chuỗi ngày và cấp + thanh XP (dẫn tới Tiến độ); thanh tab dưới trên mobile thay cho menu ẩn; ẩn toàn bộ trong phiên học. URL cũ (`/kana`, `/kanji`, `/vocab`, `/grammar`, `/test`, `/flashcards`) vẫn chạy.
2. **"Hôm nay"** (`/`, viết lại bố cục `Dashboard.tsx`), trả lời "hôm nay học gì": lời chào theo giờ (tính ở client, tránh lệch hydration); khối "Phiên học hôm nay" liệt kê 5 phần (Ôn tập, Từ mới, Kanji, Ngữ pháp, Luyện tập) với nội dung thật và số phút, phần xong có ✓; một nút chính đổi nhãn theo trạng thái (Bắt đầu · n phút / Học bài mới · n phút / Tiếp tục phiên dở / Ôn lại từ hôm nay); cột phụ: vòng mục tiêu phút + 7 chấm của tuần; dải dưới: đang ở bài nào (%), ôn ngày mai (số thẻ), mục tiêu JLPT và ngày thi. Số liệu chi tiết chuyển sang Tiến độ.
3. **"Lộ trình"** (`/lessons`): level → bài, trạng thái Đã xong ✓ / Học tiếp (nút, chỉ một bài) / Chưa học; không khoá.
   **"Luyện tập"** (`/review`, gộp hub ôn tập hiện có): số thẻ đến hạn + nút chính "Ôn ngay · khoảng n phút"; biểu đồ thẻ đến hạn 7 ngày tới; 4 mức ghi nhớ Mới → Đang học → Thuộc → Vững ánh xạ từ 5 hộp Leitner (ngưỡng theo `KNOWN_AT`); thẻ hay quên (`lib/weak.ts`); bên dưới là các dạng bài của phase 40 (gõ đáp án, ngữ pháp, đọc hiểu, ôn trộn) và Thi thử, mỗi ô số liệu thật.
   **"Tiến độ"** (`/progress`, mới, lấy phần thống kê khỏi Dashboard): cấp + XP còn thiếu; 4 tổng số (chuỗi ngày, từ, kanji, ngữ pháp); phút học theo tuần có vạch mục tiêu; độ phủ từng level JLPT; lịch sử thi; heatmap.
4. **Trang khách mới** (`page.tsx`): hero theo câu của người dùng; bên cạnh là **bài thử 3 câu** không cần tài khoản (cách đọc một từ → âm Hán Việt một kanji → hỏi lại từ đầu để thấy lặp lại ngắt quãng), lấy từ nội dung N5 thật, xong thì "Lưu tiến độ" dẫn tới đăng ký; "Một phiên học diễn ra thế nào" 4 bước; "Kanji qua âm Hán Việt" 3 ví dụ thật; chọn trình độ (Chưa biết / N5 / N4 / N3) mang vào form đăng ký; số liệu nội dung thật theo level.
5. **Thư viện hợp nhất** (`/library`): kana, kanji, từ vựng (theo bài và theo chủ đề), ngữ pháp trong một màn có lọc level, trạng thái đã học, đã lưu.
6. **Màn học/ôn thống nhất**: cùng một khung phiên học (thanh tiến độ, phản hồi đúng/sai, màn tổng kết cuối phiên với gợi ý bước tiếp) cho bài học, ôn tập, flashcard và luyện tập; trích thành component dùng chung.
7. **Hiệu ứng chuyển động toàn site** (yêu cầu của người dùng). Chỉ dùng CSS và View Transitions của Next, không thêm thư viện; token thời lượng/easing mới trong `globals.css`; mọi hiệu ứng tắt khi `prefers-reduced-motion: reduce`; chỉ animate `transform`/`opacity` để không giật.
   - Chuyển trang: mờ + trượt nhẹ giữa các route; phần tử chung (ô kanji → trang chi tiết) nối liền.
   - Trang khách: biển hiệu neon bật sáng lần lượt, mưa và ánh phản chiếu chuyển động chậm, nội dung hiện dần khi cuộn tới.
   - Phiên học: thẻ lật 3D, thẻ trượt ra/vào khi sang câu, nháy sáng khi đúng, rung nhẹ khi sai, thanh tiến độ chạy mượt, màn tổng kết đếm số tăng dần.
   - Dashboard: số liệu đếm lên, thanh tiến độ và heatmap vẽ dần, huy hiệu chuỗi ngày bừng sáng khi đạt mốc.
   - Vi tương tác: hover/nhấn của nút và ô, đèn trạng thái SRS đổi màu có chuyển tiếp, khung chờ (skeleton) lấp lánh ở `loading.tsx`.
   - Test: e2e chạy với reduced motion để ổn định; một test xác nhận hiệu ứng tắt khi người dùng bật giảm chuyển động.
8. **UX phiên học theo 6 ảnh mẫu** (chỉ hành vi; hình thức vẫn là hệ ADR 010). Áp vào khung phiên học chung ở mục 6.
   - **Chế độ tập trung**: trong phiên không có menu; chỉ Thoát (có xác nhận nếu đang dở), thanh tiến độ chia đoạn theo bước, và "x / y phút" so với mục tiêu ngày. Mục tiêu ngày tính bằng phút (5/10/15/20/30, mặc định 15) đo từ thời gian thực học; trường mới tuỳ chọn, không bump schema (ADR 002); `NEW_PER_DAY` vẫn là trần số mục mới.
   - **Chia nhỏ**: cứ 3 mục mới thì một lượt kiểm tra nhanh 3 mục đó; chân trang báo trước bước kế ("Sau từ này: kiểm tra nhanh 3 từ vừa học"). Thay cho "dạy trước, hỏi sau" ở Phase 37.
   - **Nút chính cố định** góc phải dưới, cùng một phím ở mọi bước (Space tiếp, Enter kiểm tra, 1–4 chọn đáp án, H gợi ý); bảng trợ giúp phím; phím không bắt khi đang gõ ô nhập (§8.1).
   - **Thẻ từ mới**: cách đọc, nghĩa, loại từ, một câu ví dụ có gạch dưới từ đang học, nút bật/tắt furigana ngay trên thẻ. Ưu tiên câu ví dụ chỉ chứa kanji người học đã gặp (kiểm được bằng dữ liệu); "ngữ pháp đã gặp" không kiểm tự động được nên không cam kết.
   - **Thẻ kanji**: âm Hán Việt đặt lớn nhất, rồi nghĩa, On/Kun, số nét; kanji xuất hiện sau các từ chứa nó trong cùng bài; danh sách "Từ có chữ này" đánh dấu đã học / chưa học (kèm số bài), không ép học thêm.
   - **Ngữ pháp**: công thức thành các khối (dùng `pattern` sẵn có), giải thích và bài tập cạnh nhau trên desktop, xếp dọc trên mobile; bài ghép câu có 1 thẻ thừa, kéo thả hoặc phím số, nút Kiểm tra mờ tới khi ghép đủ. Cần trường ví dụ tách đoạn trong `grammar.json` (BACKLOG): lô nội dung riêng, `reviewed: false`, trường tuỳ chọn nên ví dụ cũ vẫn chạy.
   - **Phản hồi**: đúng/sai hiện ngay tại đáp án (màu + biểu tượng ✓/✗, không chỉ màu) và dải chân trang; một dòng nói lý do sai sinh từ dữ liệu thật (cách đọc đúng, âm Hán Việt của chữ sai); câu sai chèn lại cuối phiên, phải trả lời đúng mới xong phiên; thông báo qua `aria-live`.
   - **Ôn tập nhớ lại chủ động**: gõ cách đọc (romaji tự đổi sang kana) trước khi thấy đáp án, có lối thoát "Không nhớ"; sau khi lật chỉ 2 nút Quên / Nhớ, mỗi nút ghi khoảng gặp lại lấy từ `INTERVALS`; gõ đúng thì gợi ý sẵn "Nhớ"; đếm ngược "còn n / m thẻ đến hạn"; thẻ đến hạn luôn đứng trước bài mới; đánh dấu khó (D) nối vào Yêu thích/điểm yếu. Giữ Leitner 5 hộp (không đổi thuật toán, không migration): "Quên" về hộp 1 và lặp lại trong phiên.
   - **Màn tổng kết**: phút đã học so với mục tiêu, số thẻ ôn / từ mới / kanji / % đúng, dải 7 ngày của tuần, "Hay nhầm hôm nay" tự xếp ưu tiên vào lượt ôn sau, dòng "Ngày mai: n thẻ ôn + Bài k, khoảng x phút" tính từ lịch SRS thật, nút phụ "Học thêm 5 phút".
   - **XP + cấp cá nhân** (người dùng chọn; ADR 013 đảo non-goal XP trong PLAN.md). XP là số **suy ra** từ hoạt động thật đã lưu (thẻ ôn, mục mới, phút học, bài thi), tính bằng một hàm thuần trong `src/lib/` với hằng số ở `src/config/`; không lưu XP riêng nên không có dữ liệu mới để lệch hay mất. Hiện ở thanh trên, "Hôm nay" và màn tổng kết (+XP của phiên, đếm lên). Không có bạn bè, không bảng xếp hạng.
   - **Hoạt ảnh thứ tự nét** (người dùng chọn; ADR 014): dữ liệu KanjiVG (CC BY-SA 3.0) cho 625 kanji, sinh bằng script trong `kotoba-be/scripts/` vào một file nội dung riêng để giấy phép share-alike chỉ áp lên file đó; ghi công ở `/legal`, footer và README; trang kanji và thẻ kanji phát lại từng nét, có nút xem lại, dừng khi reduced motion (hiện các nét đánh số tĩnh). Không có tập viết, không chấm chữ viết tay. Kanji thiếu trong KanjiVG thì chỉ hiện số nét.
   - **Không lấy từ ảnh** (ghi lý do trong PLAN.md): nút Nghe và nhắc giờ học (người dùng chọn không làm; màn tổng kết chỉ báo việc ngày mai), bảng xếp hạng bạn bè, mẹo nhớ kanji (không có nguồn được phép, tự viết 625 mẹo là bịa nội dung), "Sửa thẻ" (nội dung dùng chung, không phải thẻ cá nhân), "Tập viết".
Kiểm chứng riêng: ảnh trước/sau ở 360, 768, 1440 cho mỗi màn đính vào báo cáo; e2e cho luồng khách → dùng thử → đăng ký → Hôm nay → phiên học → tổng kết.

#### Phase 42 — Hoàn thiện UI và QA cuối
- Phần còn lại của bản critique trang chủ, `rgba()` thô → token, Lighthouse a11y ≥ 95, ảnh chụp 360/768/1440 mọi route.
- Chạy toàn bộ gate, cập nhật DESIGN/README/PROGRESS, báo cáo cuối theo mẫu §14 kèm danh sách nội dung còn `reviewed: false`.

### Chia việc cho Codex (người dùng yêu cầu 2026-11-14, để tăng tốc)

Mở rộng quy ước cũ (Codex chỉ review read-only; ngoại lệ viết nội dung trên file tách rời). Từ đợt này Codex được **viết** song song, với điều kiện giữ nguyên các luật của AGENTS.md.

Giới hạn thật của việc tăng tốc: Quality Gate và e2e vẫn chạy tuần tự, một người commit. Codex chỉ rút ngắn phần *viết*, không rút ngắn phần *kiểm*. Vì vậy chỉ giao việc dài, độc lập, có đầu ra kiểm được bằng máy.

Giao cho Codex (`codex exec --sandbox workspace-write`, mỗi lần một việc, ghi rõ danh sách file được phép sửa):
| Việc | Phase | File Codex sở hữu | Kiểm bằng |
|---|---|---|---|
| Lô ~70 từ đồng âm | 39 | `content/vocab.json` (chỉ thêm mục mới) | `validate:content`, `jmdict`, mẫu seed |
| Gán `topic` cho từ vựng | 40.5 | `content/vocab.json` (chỉ thêm trường) | `validate:content`, diff không đổi trường khác |
| Đoạn đọc mới | 40.6 | file nội dung đọc riêng | `validate:content`, mẫu seed |
| Ví dụ ngữ pháp tách đoạn | 41.8 | `content/grammar.json` (chỉ thêm trường) | test ghép lại đúng bằng `examples` gốc |
| Script KanjiVG → file nét | 41.8 | `kotoba-be/scripts/kanjivg.ts` + file sinh ra | test đếm 625 kanji, số nét khớp `strokes` |
| Docs: README, `kotoba-be/README.md`, `PRODUCT.md` | 37 | đúng các file đó | đọc lại |
| Module BE tách rời khi Claude đang làm FE (rate limit, dọn token, SMTP mailer) | 38 | `kotoba-be/src/**` theo spec | unit + supertest e2e do Claude chạy |
| Review read-only trước mỗi commit | mọi phase | không sửa gì | Claude tự xác minh từng phát hiện |

Không giao cho Codex: Phase 41 phần giao diện (cần một ngôn ngữ hình ảnh thống nhất), migration và mọi thứ chạm dữ liệu người dùng (`store.ts`, `srs.ts`, `Sync.tsx`, Prisma schema), lỗi reset-khi-đang-push, e2e/Playwright, git.

Luật khi giao:
- Hai bên không sửa cùng một file cùng lúc. Hai việc cùng chạm `vocab.json` (đồng âm, `topic`) chạy nối tiếp, không song song.
- Codex không commit, không chạy e2e, không chạy dev server, không đặt `reviewed: true`. Nội dung nó viết là `reviewed: false` và theo §12 (không bịa; JMdict bắt buộc).
- Đầu ra của Codex là bản nháp: Claude đọc diff, chạy gate, sửa hoặc bỏ. Test do agent `test` viết vẫn là hợp đồng, Codex không được nới.
- Mỗi lần giao kèm đường dẫn spec, AC cần đạt, danh sách file được sửa, lệnh kiểm. Ghi vào PROGRESS.md phần nào do Codex viết.
- Codex lỗi, hết quota hoặc ra kết quả kém hai lần liên tiếp cho một việc: Claude tự làm việc đó, không chờ.
- Binary không nằm trên PATH: `~/.vscode/extensions/openai.chatgpt-<ver>-win32-x64/bin/windows-x86_64/codex.exe`; kiểm lại thư mục phiên bản trước khi gọi.


### Ngoài phạm vi
Luyện nghe và nút phát âm, N2/N1, tập viết kanji, bạn bè/bảng xếp hạng, nhắc học (push/e-mail), Google OAuth, PWA, light mode, push/merge/deploy.

### Kiểm chứng
Sau mỗi phase: `npm run check` ở `kotoba-be` và `kotoba-fe`, rồi `npm run test:e2e` ở `kotoba-fe` (mobile + desktop, axe, không console error); nội dung thêm `npm run validate:content` và `npm run sample -- <seed>`. Test mới phải thấy đỏ trước. Thay đổi UI: xem ảnh Playwright 360×740 và 1440×900. `git status` sạch cuối mỗi task.

## Bắt đầu ở đây (mỗi phiên, kể cả cloud session)
1. Nếu có `docs/progress/PROGRESS.md`: đọc trước, làm tiếp task đầu tiên chưa DONE. Không làm lại task đã DONE.
2. Nếu chưa có: bắt đầu từ Task A.
3. Sau khi có `AGENTS.md`, `AGENTS.md` là luật. File này là lộ trình.
4. Làm liền một mạch, không chờ người dùng duyệt giữa các giai đoạn. Chỉ dừng trong các trường hợp ở mục 15 của quy tắc (đã điều chỉnh bên dưới).
5. Khi phiên sắp hết (ngữ cảnh hoặc thời gian): commit phần đã xanh, cập nhật PROGRESS.md (task đang dở, bước tiếp theo, giả thuyết hiện tại), push, rồi báo cáo theo mẫu mục 14. Phiên sau người dùng chỉ gõ "Tiếp tục theo docs/progress/PROGRESS.md".

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
| Plugin | Chỉ impeccable. Không có ponytail trong cloud. Dòng ưu tiên giữa quy tắc repo và ponytail ở A1 vẫn viết, để dùng khi chạy ở máy local |
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

Người dùng đưa 17 mục quy tắc bằng tiếng Việt (đã dịch thành `AGENTS.md`; bản gốc `docs/plan/rules-vi.md` xoá ngày 2026-11-11, còn trong lịch sử git). Việc cần làm:
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

Không thêm agent thiết kế: đã có `impeccable-finish-reviewer` và `impeccable-documenter` (plugin impeccable). Không thêm agent lập kế hoạch: đã có `Plan` sẵn.

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
- Giai đoạn nội dung (15, 23–30) thì giao `content` theo từng đợt, mỗi đợt một lần gọi.

Commit: `chore: add claude subagents for be, fe, test, content and review`.

Kiểm:
- Các file `.claude/agents/*.md` có frontmatter hợp lệ (`name`, `description`, `tools`). Trong cùng phiên, gọi thử được bằng Agent tool. Nếu agent mới chưa được nạp trong phiên hiện tại thì ghi vào báo cáo, không coi là lỗi.
- Thử gọi `reviewer` trên diff của A1–A3: không sửa file nào và trả về danh sách lỗi.

### Ảnh hưởng lên các giai đoạn 14–30 bên dưới
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
- Plan gốc đã bỏ khỏi repo (xem lịch sử git). Các giai đoạn 0–13 đã commit trên `feat/n5-full`.
- Người dùng đã rà danh sách 64 đề xuất. Chốt lại: giữ nhóm "nên làm" và nhóm "làm bản rút gọn". Bỏ phần thứ tự nét chữ (KanjiVG).
- Mục tiêu của bổ sung này:
  - Trả lời được "mình yếu ở đâu" và "hôm nay học gì".
  - Bù phần từ vựng còn thiếu: mới có 499 từ, plan gốc là ~700.
  - Không thêm hệ thống mới: không listening, không AI, không CMS, không XP, không PWA.
- Người dùng muốn nội dung tới N3 (lúc đầu là N2, rút lại ngày 2026-11-04), làm theo thứ tự N5 → N4 → N3. Từ 2026-11-04 có điểm dừng ở cuối mỗi cấp (`AGENTS.md` §15) và cổng duyệt mẫu nội dung (`AGENTS.md` §12). Quy tắc dừng sớm vẫn áp dụng.
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

## Lộ trình N4 → N3 (chạy liền sau giai đoạn 21)
Thứ tự cố định. Cuối mỗi cấp dừng lại để người dùng dùng thử app và duyệt mẫu nội dung (`AGENTS.md` §12, §15); trong một cấp thì không dừng giữa các đợt. Chỉ commit khi kiểm qua, push sau mỗi commit. Giai đoạn nào kiểm không qua sau 3 hướng thử thì dừng cả lộ trình và báo kết quả thật (quy tắc dừng sớm).

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
| N2 | (bỏ) | (bỏ) | (bỏ) | — |

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
- **Trước 28 (từ critique `/` ngày 2026-11-04, người dùng chọn top 3):** một commit `fix:` riêng.
  - Dashboard đang dùng mẫu số chưa lọc theo cấp: người học N5 thấy Từ vựng 0/1272, Kanji 0/625. Đây là bug High (§11), cần ghi vào BUGS.md và có test hiển thị đúng con số.
  - Copy "3 lần liên tiếp" ở trang chủ phải sửa theo code: "đã học" là box ≥ 1, "đã thuộc" là `KNOWN_AT`. Ghi ADR cho định nghĩa này.
  - Copy lỗi thời: Kanji "sắp có", footer "chỉ trong trình duyệt", Ngữ pháp "sắp có".
  - Làm việc này trước khi thêm từ N3 để mẫu số không lệch thêm.
- **Trước 28: giữ an toàn dữ liệu lưu (review quy trình 2026-11-04, `AGENTS.md` §2 "data-safety debt").** Một commit `fix(store):` riêng, có spec ngắn.
  - Các `catch {}` rỗng trong `kotoba-fe/src/lib/store.ts` và `activity.ts` (BACKLOG, Task A): đọc lỗi thì giữ nguyên dữ liệu gốc và báo lỗi, không âm thầm trả về giá trị mặc định rồi ghi đè.
  - Ví dụ: `syncState()` gặp JSON hỏng thì trả về `forget: []`, nên các lần reset chưa gửi bị mất mà không ai biết.
  - Có test với fixture dữ liệu hỏng cho từng chỗ.
- **Trước 28: duyệt mẫu nội dung đã có (`AGENTS.md` §12).** Hiện có 0 mục `reviewed: true`.
  - Agent rút mẫu ngẫu nhiên có seed: 30 mục cho mỗi loại (từ, kanji, ngữ pháp, câu hỏi đề) ở N5 và N4, cộng 30 kanji N3.
  - Người dùng duyệt và đánh `reviewed: true` cho mục đúng. Loại nào sai quá 5% thì sửa loại đó và rút mẫu mới.
  - Giai đoạn 28 chỉ bắt đầu sau bước này.
- Lặp lại 23–26 cho N3. Từ vựng có khoảng 9 đợt (28a…28i).
- Đề N3-1 `minutes: 100`. Thêm các loại phần mới nếu N3 có mà N5 không có, ví dụ `usage` (cách dùng từ). `lib/test.ts` không cần biết loại phần, chỉ nhóm theo `part`.
- Màn hình kết quả hiện câu "không mô phỏng đỗ/trượt".

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
- **Khối lượng nội dung N4–N3** (sau khi bỏ N2): khoảng 520 kanji, 2.400 từ và 100 điểm ngữ pháp mới, tức gấp khoảng 3–5 lần N5. Tất cả là `reviewed:false`, và JMdict không kiểm được nghĩa tiếng Việt. Đây là phần tốn thời gian nhất và dễ sai nhất của lộ trình, cần nhiều phiên. Cần người duyệt lại trước khi coi là nội dung dùng được.
- **Nguồn tách N3/N2:** chưa xác minh license. Nếu phải dùng heuristic `freq` thì việc chia cấp chỉ gần đúng, phải ghi rõ ở `/legal`.
- **Đề N3/N2 không phản ánh đỗ/trượt thật:** thiếu phần nghe, mà từ N3 trở lên mỗi phần có điểm liệt (19/60). Kết quả chỉ để luyện tập.
- **Seed khi khởi động:** số mục tăng từ khoảng 1k lên khoảng 10k. Nội dung JSON lớn hơn sẽ làm boot chậm và diff khó review. Xử lý ở giai đoạn 22: đo trước, chỉ chuyển sang seed theo hash khi thật sự chậm.
- **Phụ thuộc giữa các giai đoạn:** giai đoạn 22 phải xong trước mọi nội dung N4. `currentLesson` (giai đoạn 18) là thứ giúp chuyển cấp liền mạch.
- **Cloud session:** máy tạm, mất hết khi phiên kết thúc nếu chưa push. Vì vậy push sau mỗi commit xanh và cập nhật PROGRESS trước khi hết phiên.
- **Dừng sớm:** một giai đoạn kiểm không qua sau 3 hướng thử thì dừng lại, báo kết quả thật, không commit phần hỏng.
