# Phase 40: Tính năng học mới

Nguồn: `docs/plan/PLAN.md` mục Phase 40. Dùng lại `useDeck`/`review()` (`lib/store.ts`, `lib/srs.ts`), `choicesFor`, `Sync.tsx`, guard ở `kotoba-be/src/validate.ts` và `progress.ts`. ADR 002: trường mới tuỳ chọn, không bump `kotoba.srs.v1`; mỗi trường mới có test với fixture cũ thiếu trường đó.

Chín mục, mỗi bước một commit xanh, theo thứ tự dưới đây. Nội dung do Codex viết (`topic`, đoạn đọc mới) là `reviewed: false` về mặt nhãn chủ đề/đoạn văn và được ghi ở PROGRESS.

| Bước | Mục PLAN | Ai viết |
|---|---|---|
| 40a | 1 Yêu thích | Claude |
| 40b | 5 Từ vựng theo chủ đề | Codex gán `topic` (chạy song song với 40a), Claude làm trang |
| 40c | 4 Bật/tắt furigana, romaji | Claude |
| 40d | 2 Gõ đáp án | Claude |
| 40e | 3 Luyện ngữ pháp + SRS | Claude |
| 40f | 6 Luyện đọc | Codex viết đoạn mới, Claude làm trang |
| 40g | 8 Lịch sử thi trên server | Claude (Prisma, không giao Codex) |
| 40h | 7 Kiểm tra trình độ | Claude |
| 40i | 9 Quản lý nội dung đã học + lộ trình ngày | Claude |

## 40a Yêu thích
Quyết định: "đã lưu" là trường `saved?: true` trên Card. Lưu một mục chưa học sẽ tạo thẻ hộp 0, đến hạn hôm nay, nên mục đó vào hàng ôn như thẻ mới. Đây là chủ ý: lưu để học. Một đường đồng bộ duy nhất, xung đột vẫn theo `at`. Bỏ lưu chỉ xoá cờ, lịch ôn giữ nguyên.
- AC-1 FE `Card.saved?: true`; `toggleSaved(id)` đặt hoặc xoá cờ, cập nhật `at`, không đổi `box`/`due`/`lapses` của thẻ đã có; trả lời đúng/sai (`apply`) giữ cờ. Fixture thẻ cũ không có `saved` vẫn đọc được.
- AC-2 BE: cột `saved Boolean @default(false)` (migration cộng thêm); `isCard` nhận `saved` thiếu hoặc boolean; `/progress` và export trả `saved: true` chỉ khi có cờ.
- AC-3 Nút sao ở trang từ và trang kanji: nút bật/tắt, tên luôn là "Lưu", trạng thái nằm ở `aria-pressed`. (Không đổi tên thành "Bỏ lưu": đổi cả tên lẫn `aria-pressed` khiến trình đọc màn hình đọc sai trạng thái.)
- AC-4 Bộ lọc "Đã lưu" ở danh sách kanji (`?filter=saved`). Danh sách từ vựng chia theo bộ thẻ, không có bộ lọc, nên ở đó là liên kết "Ôn n từ đã lưu" (`/review?saved=1&kind=vocab&level=…`). Trang ôn tập có liên kết "Đã lưu: n mục" (`/review?saved=1`), chỉ hiện khi có mục đã lưu; hàng ôn đã lưu không tính là phiên ôn hằng ngày.

## 40b Từ vựng theo chủ đề
- AC-5 `topic` tuỳ chọn trên từ vựng, giá trị thuộc danh sách cố định 19 chủ đề (`TOPICS` trong `content.spec.ts`, nhãn ở FE): people, body, health, food, home, clothes, school, work, time, numbers, weather, nature, animals, places, transport, shopping, hobbies, feelings, communication. Từ không hợp rõ ràng chủ đề nào thì không gán (động từ, tính từ chung...).
- AC-6 (Codex) chỉ thêm trường `topic`; `git diff` không đổi trường nào khác, định dạng dòng giữ nguyên.
- AC-7 Trang `/vocab/topics` liệt kê chủ đề kèm số từ; `/vocab/topics/<topic>` liệt kê từ theo level; chủ đề lạ là 404.

## 40c Furigana và romaji
- AC-8 Hai thiết lập hiển thị (furigana, romaji), lưu cục bộ (`kotoba.display.v1`) và vào hồ sơ khi đăng nhập; mặc định bật cả hai. Tắt romaji ẩn dòng romaji ở thẻ học và trang từ; tắt furigana ẩn cách đọc trên kanji ở câu ví dụ.

## 40d Gõ đáp án
- AC-9 Ở luyện kana và từ vựng có thể chuyển giữa trắc nghiệm và gõ. Gõ chấp nhận kana hoặc romaji (romaji đổi sang kana trước khi so), bỏ khoảng trắng hai đầu; sai thì hiện đáp án đúng. Kết quả đi qua `review()` như trắc nghiệm.

## 40e Luyện ngữ pháp
- AC-10 Bài điền chỗ trống sinh từ `examples` của điểm ngữ pháp (chỗ trống là phần mẫu xuất hiện trong câu); điểm không sinh được câu hỏi thì bỏ qua, có test.
- AC-11 Ngữ pháp vào SRS với id `grammar:<slug>` (BE đã có mục `grammar:`; `progress` nhận vì là mục đã biết).

## 40f Luyện đọc
- AC-12 Trang `/reading` liệt kê các đoạn văn có trong đề thi theo level, mở từng đoạn với câu hỏi. Đoạn mới (Codex) nằm trong file nội dung riêng, `reviewed: false`, qua `validate:content`.

## 40g Lịch sử thi trên server
- AC-13 Bảng `TestResult` (userId, testId, score, total, at), đồng bộ từ `kotoba.tests.v1` qua `/progress`; trùng (testId, at) không ghi hai lần; hiện ở dashboard và có trong export.

## 40h Kiểm tra trình độ
- AC-14 Bài ngắn lấy câu từ ngân hàng đề các level, chấm ra level gợi ý và bài bắt đầu; mở từ onboarding, bỏ qua được.

## 40i Quản lý nội dung đã học
- AC-15 Trang liệt kê mục theo trạng thái (mới, đang học, đã thuộc), đặt lại từng mục hoặc cả bộ (`resetDeck`) có xác nhận.
- AC-16 Lộ trình ngày theo mục tiêu và ngày thi (`lib/daily.ts` `continueTarget`): số mục mới mỗi ngày để kịp ngày thi.

## Test matrix
| AC | Test | Lớp |
|---|---|---|
| 1 | `src/lib/srs.test.ts`, `src/lib/store.test.ts` | FE unit |
| 2 | `src/progress.spec.ts`, `test/progress.e2e-spec.ts` | BE unit + e2e |
| 3–4 | `e2e/saved.spec.ts` | e2e |
| 5–6 | `content/content.spec.ts`, diff | content |
| 7 | `e2e/topics.spec.ts` | e2e |
| 8–16 | ghi khi làm từng bước | |

## Review
- 40a: FE unit 713 pass, BE check pass (e2e BE 51/51), Playwright 274/274 (có `e2e/saved.spec.ts`). Bộ lọc kanji "Đã lưu" lọc theo trang hiện tại, cùng giới hạn với bộ lọc "Đã học". Codex review: `ReviewApp` giữ hàng ôn cũ khi bấm "Ôn tất cả" từ một hàng có phạm vi (lỗi có từ trước, hàng đã lưu làm lộ ra); sửa bằng `key` theo phạm vi (kind, bài, level, weak, saved), e2e kiểm và đã thấy fail khi bỏ `key`.
- 40b: FE check pass, BE check pass, Playwright 280/280 (có `e2e/topics.spec.ts`, thấy fail trước khi có trang). Tag `topic` do Codex viết (1.308 từ), diff chỉ thêm `topic`; 1.789 từ chưa có chủ đề nên không hiện ở trang chủ đề. Codex review: không có lỗi.
- 40c: chỉ làm romaji. Hai quyết định của người dùng (2026-11-15) thay AC-8: hoãn furigana (câu ví dụ chưa có dữ liệu cách đọc), và lưu bằng cookie `kotoba.romaji` qua server action như ngôn ngữ, không dùng localStorage + hồ sơ. Nút "Romaji" (`aria-pressed`) ở trang từ và thanh công cụ thẻ học; tắt thì ẩn romaji ở trang từ, mặt sau thẻ học và thẻ từ vựng ở `/review` (thẻ kana giữ romaji vì đó là đáp án). FE check pass (714 unit), Playwright 284/284, `e2e/romaji.spec.ts` thấy fail trước khi có code. Codex review: `/review` chưa đọc cookie (đã sửa, e2e fail khi bỏ sửa); e2e thêm lật thẻ và tên nút chính xác.
