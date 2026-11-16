# Phase 41: Đổi cấu trúc UX — phiên học, Hôm nay, 5 mục điều hướng

Nguồn: `docs/plan/PLAN.md` mục Phase 41. Giữ token/phông/chủ đề ADR 010; đổi cấu trúc, bố cục, luồng. Quyết định: ADR 013 (cấu trúc + phiên học), ADR 014 (XP), ADR 015 (KanjiVG). PLAN gọi ba ADR này là 012/013/014; số 012 đã dùng cho SMTP (Phase 38) nên dời lên một.

Phần nội dung đã làm trước (commit cc06692, Codex viết, Claude kiểm): `parts` cho 358 ví dụ ngữ pháp (`reviewed: false`), `kotoba-be/scripts/kanjivg.ts` + `content/strokes.json` (CC BY-SA 3.0), API kanji trả `paths`.

Thứ tự bước, mỗi bước một commit xanh: (a+b) lõi phiên học `lib/session.ts` + `/session` với sáu loại bước → (c) Kết quả + XP → (d) Hôm nay → (e) Lộ trình → (f) Luyện tập → (g) Tiến độ → (h) Thư viện → (i) điều hướng + trang khách → (j) hiệu ứng → (k) hoạt ảnh nét.

## Lệch so với PLAN (có lý do)
| PLAN | Làm | Vì sao |
|---|---|---|
| XP = 10 × câu đúng + 5 × mục mới + 30/bài, từ `activity` | XP = 10 × Σ hộp + 5 × số thẻ, suy từ thẻ SRS (ADR 014) | `activity` cắt ở 90 ngày nên XP từ đó sẽ tụt theo thời gian; thẻ được đồng bộ và không bị cắt. "+30/bài" cần toàn bộ nội dung trên mọi trang (thanh trên), bỏ |
| Thẻ từ mới có "loại từ" | Không hiện | `vocab.json` không có trường loại từ; không bịa |
| Kéo thả ở bài ghép câu | Bấm thẻ hoặc phím số để đặt/bỏ | Bấm dùng được bằng bàn phím và trình đọc màn hình; kéo thả cần thêm thư viện hoặc nhiều code cho cùng hành vi |
| Đánh dấu khó (D) | Nút Lưu (`toggleSaved` có sẵn) | "Đã lưu" của 40a đã là cờ yêu thích/khó; thêm cờ thứ hai trùng nghĩa |
| Lặp lại "sau 10 phút" | "Gặp lại trong phiên này", chèn cuối phiên | Như bảng ở PLAN |
| Lộ trình: 3 trạng thái Đã xong ✓ / Học tiếp / Chưa học | Bài đã học dở mà không phải bài hiện tại vẫn ghi "Đang học"; bài ôn tập (25, 45, 81, không có mục) không ghi trạng thái | Ghi "Chưa học" cho bài đã học một phần là sai; bài ôn tập không có gì để xong (ADR 010) |
| AC-19: hiệu ứng chỉ transform/opacity | Mưa ở hero vẫn chạy `background-position` (ngoại lệ ghi trong test) | Bản transform đo được chậm hơn: lớp phủ lớn hơn khung nhìn phải dời cả lớp; dưới reduced motion mưa vẫn tắt |
| AC-19: hiệu ứng chỉ transform/opacity | Transition khi hover/đổi trạng thái vẫn đổi màu, viền, bóng | Đó là phản hồi trạng thái, chỉ tốn paint, không dịch chuyển gì; test cấm mọi thuộc tính layout trong `transition`, và reduced motion vẫn tắt hết |
| AC-19: hiệu ứng chỉ transform/opacity | Nét kanji vẽ bằng `stroke-dashoffset` (ngoại lệ `draw` ghi trong test) | Vẽ nét chính là bài học; SVG 109 đơn vị, repaint rẻ. Reduced motion tắt hẳn, hiện số nét tĩnh |
| AC-20: kanji không có `paths` chỉ hiện số nét | Chỉ có unit test, không có e2e | Cả 625 kanji đều có nét KanjiVG, không có dữ liệu thật để e2e |

## AC
### 41a+b Phiên học
- AC-1 `buildSession(input)` (thuần, `lib/session.ts`) trả danh sách bước theo thứ tự cố định: ôn thẻ đến hạn → mục mới (kana; từ rồi kanji của bài) theo cụm 3: học 3 thẻ rồi kiểm tra nhanh 3 mục đó → ngữ pháp của bài hiện tại (thẻ công thức) → ghép câu → luyện tập (điền chỗ trống). Bước bài không có thì bỏ. Mục mới tính bằng `freshFor` (trần `NEW_PER_DAY`); ngữ pháp tối đa `GRAMMAR_PER_SESSION`, chỉ điểm chưa có thẻ.
- AC-2 Chế độ `review` (nút "Ôn ngay") chỉ có bước ôn. Chế độ `more` ("Học thêm 5 phút") lấy thêm `EXTRA_NEW` mục mới vượt trần, không có bước ôn.
- AC-3 Trả lời sai ở bước ôn/kiểm tra/ghép/điền: gọi `review(id, false)`, bước đó chèn lại cuối phiên; chỉ lần chấm đầu của mỗi mục tính vào % đúng; phiên chỉ xong khi mọi bước chấm đã đúng.
- AC-4 Bước ôn: gõ cách đọc trước (romaji tự đổi sang kana, `typedMatch`), có "Không nhớ"; kanji thì nhớ trong đầu rồi lật. Sau khi lật chỉ có Quên / Nhớ, mỗi nút ghi khoảng gặp lại; gõ đúng thì focus sẵn ở "Nhớ", gõ sai thì ở "Quên".
- AC-5 Thẻ học: từ (cách đọc, nghĩa, câu ví dụ gạch dưới từ đang học); kanji (Hán Việt lớn nhất, nghĩa, On/Kun, số nét, "Từ có chữ này" có đánh dấu đã học/chưa học).
- AC-6 Kiểm tra nhanh: 4 lựa chọn (từ → nghĩa, kanji → Hán Việt, kana → romaji); đúng/sai hiện tại đáp án bằng màu + ✓/✗ và một dòng lý do từ dữ liệu thật; `aria-live`.
- AC-7 Ghép câu: thẻ là `parts` xáo trộn + 1 thẻ thừa; nút Kiểm tra bị tắt tới khi ghép đủ số đoạn; chấm vào id ngữ pháp.
- AC-8 Chế độ tập trung: `/session` không có thanh điều hướng; có Thoát (hỏi xác nhận khi đã chấm ít nhất một bước), thanh tiến độ chia đoạn theo bước, "x / y phút" (y = `profile.minutes ?? 15`), "Sau bước này: …". Nút chính cố định ở chân trang, cao ≥ 44px. Phím: Space/Enter nút chính, 1–4 chọn, 1/2 Quên/Nhớ, Esc thoát; không bắt phím khi đang gõ ô nhập.
- AC-9 Phiên dở lưu cục bộ `kotoba.session.v1` `{day, mode, steps, index, first}`; mở lại cùng ngày học, cùng chế độ thì tiếp tục; ngày khác, chế độ khác hoặc hỏng thì dựng phiên mới.
### 41c Kết quả + XP
- AC-10 Màn kết quả: phút đã học / mục tiêu, số thẻ ôn / mục mới / ngữ pháp, % đúng, dải 7 ngày, "Hay nhầm hôm nay" (mục sai lần đầu), "Ngày mai: n thẻ ôn" (`dueCount` ngày mai), XP của phiên (sau − trước, có dấu). Nút chính "Về Hôm nay", phụ "Học thêm 5 phút". Không popup, không confetti.
- AC-11 `xpOf(srs)` và `levelOf(xp)` thuần trong `lib/xp.ts`, hằng số ở `config/xp.ts` (260 XP/cấp).
### 41d Hôm nay
- AC-12 `/` khi đã đăng nhập: lời chào theo giờ tính ở client; khối "Phiên học hôm nay" 5 phần (Ôn tập, Từ mới, Kanji, Ngữ pháp, Luyện tập) với số thật và phút ước lượng, phần xong có ✓; đúng một `.btn` chính, nhãn theo trạng thái (Bắt đầu · n phút / Tiếp tục phiên dở / Ôn lại từ hôm nay khi đã xong); vòng phút so với mục tiêu + 7 chấm tuần; dải dưới: bài hiện tại (%), ôn ngày mai, mục tiêu JLPT/ngày thi.
### 41e–h
- AC-13 Lộ trình: mỗi bài một trạng thái Đã xong ✓ / Học tiếp (một bài duy nhất, là `.btn`) / Chưa học; không khoá.
- AC-14 Luyện tập (`/review`): số thẻ đến hạn + nút chính "Ôn ngay · khoảng n phút" (`/session?mode=review`); biểu đồ thẻ đến hạn 7 ngày tới; 4 mức Mới → Đang học → Thuộc → Vững; thẻ hay quên; các ô luyện tập của Phase 40 và Thi thử. Số "Cần ôn" và số phút tính cùng tập với phiên ôn: thẻ kana/kanji/từ (10 s/thẻ) + điểm ngữ pháp đến hạn có câu luyện (15 s/điểm). Mức: Mới hộp 0, Đang học hộp 1–2, Thuộc hộp 3–5 (đã qua lần ôn cách 3 ngày, `HELD_AT`), Vững từ `KNOWN_AT`; biểu đồ và mức chỉ đếm thẻ kana/kanji/từ.
- AC-15 Tiến độ (`/progress`): cấp + XP còn thiếu; 4 tổng số (chuỗi ngày, từ, kanji, ngữ pháp); phút theo ngày trong tuần có vạch mục tiêu; độ phủ từng level; lịch sử thi; heatmap.
- AC-16 Thư viện (`/library`): kana, kanji, từ, ngữ pháp trong một màn, lọc theo level, đã học, đã lưu. URL cũ vẫn chạy.
### 41i Điều hướng + trang khách
- AC-17 Nav 5 mục: Hôm nay · Lộ trình · Luyện tập · Thư viện · Tiến độ; thanh trên có chuỗi ngày + cấp/XP (dẫn tới Tiến độ); dưới 900px là thanh tab đáy thay cho menu.
- AC-18 Trang khách: bài thử 3 câu không cần tài khoản (cách đọc một từ → Hán Việt một kanji → hỏi lại câu 1), nội dung N5 thật; "Một phiên học" 4 bước; "Kanji qua âm Hán Việt" 3 ví dụ thật; chọn trình độ mang vào `/register?level=`.
### 41j–k
- AC-19 Hiệu ứng chỉ bằng CSS/View Transitions, chỉ `transform`/`opacity`, tắt hết dưới `prefers-reduced-motion: reduce` (có test).
- AC-20 Hoạt ảnh nét ở trang kanji và thẻ kanji, nút "Xem lại"; reduced motion hiện các nét đánh số tĩnh; kanji không có `paths` chỉ hiện số nét. Ghi công KanjiVG ở `/legal`, footer, README.

## Ma trận test
| AC | Unit (Vitest) | E2E (Playwright) |
|---|---|---|
| 1–3, 9 | `session.test.ts`: thứ tự bước, cụm 3, kanji sau từ, chế độ review/more, chèn lại khi sai, parse/hỏng/ngày khác | `session.spec.ts` |
| 4–8 | `SessionApp.test.tsx`: gõ đúng/sai, Quên/Nhớ, kiểm tra nhanh, ghép câu (Kiểm tra tắt tới khi đủ), Thoát xác nhận | `session.spec.ts` + axe |
| 10–11 | `xp.test.ts`; `SessionApp.test.tsx` màn kết quả | `session.spec.ts` |
| 12 | `Today.test.tsx` nhãn nút theo trạng thái | `today.spec.ts` + axe |
| 13 | `Path.test.tsx` | `n4-path.spec.ts` |
| 14 | `reviewHub.test.ts` (mức, 7 ngày), `ReviewHub.test.tsx` (nút, ngữ pháp đến hạn, biểu đồ, ô luyện tập, một `.btn`) | `review-hub.spec.ts` + axe |
| 15–16 | test component từng trang | spec từng trang + axe |
| 17–18 | `SiteBar` | `guest.spec.ts`: khách → thử → đăng ký → Hôm nay → phiên → kết quả |
| 19 | `designSystem.test.ts` quét CSS: animation tắt dưới reduced motion | `motion.spec.ts` |
| 20 | `Strokes.test.tsx` | `kanji.spec.ts` |
