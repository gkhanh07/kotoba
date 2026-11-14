# Phase 39: Từ đồng âm

Nguồn: `docs/plan/PLAN.md` mục Phase 39, ADR 011, `docs/progress/BACKLOG.md` ("Content (phase 15)"). Không đổi id đã phát hành, không đổi dữ liệu người dùng.

## Phạm vi
- Seed (`src/db.ts`) và `scripts/jmdict-check.ts` đã dùng `d.id` và cặp (`word`/`kanji`, `reading`), không phụ thuộc dạng id: không cần sửa.
- Ngoài phạm vi: từ cùng chữ khác cách đọc (十 đọc とお, 開く đọc ひらく, 空 đọc から). Id `vocab:<word>:<kanji>` không phân biệt được chúng (cùng `word`, `kanji` trùng `word`). Ghi lại ở BACKLOG, cần quyết định riêng.

## Acceptance criteria

**Id**
- AC-1 `content.spec.ts` chấp nhận `vocab:<word>`, hoặc `vocab:<word>:<kanji>` khi từ có trường `kanji` và `vocab:<word>` đã thuộc từ khác. Dạng khác (thiếu `kanji`, hậu tố số, id dài khi id ngắn còn trống) bị từ chối.
- AC-2 Id cũ và fixture test giữ nguyên.

**Trang từ và liên kết**
- AC-3 `vocabHref` nhận id, tạo `/vocab/<phần sau vocab:>` (URL-encode). Mọi liên kết tới trang từ (bài học, kanji, tìm kiếm, mục yếu) dùng id, nên hai từ đồng âm có hai trang riêng.
- AC-4 `/vocab/<word>` cũ vẫn mở đúng từ cũ; `/vocab/<word>:<kanji>` mở từ đồng âm mới; id không có trả 404.

**Nội dung (Codex)**
- AC-5 Thêm các từ đã bỏ qua trong BACKLOG (trừ phần ngoài phạm vi và từ đã có), `reviewed: false`, đúng AGENTS.md §12 (cổng kanji, JMdict, ví dụ dùng từ).
- AC-6 `npm run validate:content` xanh; số lượng trong "holds exactly the released content" cập nhật theo số từ thêm; có mẫu duyệt `npm run sample -- <seed>`.

## Test matrix
| AC | Test | Lớp |
|---|---|---|
| 1 | `content/content.spec.ts` "accepts a homophone id only when…", "ids follow their kind" | BE unit |
| 2 | fixture không đổi; `git diff` không có id cũ nào đổi | review |
| 3 | `src/lib/library.test.ts` `vocabHref`; `src/lib/weak.test.ts` | FE unit |
| 4 | `e2e/vocab-page.spec.ts` | e2e |
| 5–6 | `npm run validate:content`, `npm run sample` | content |

## Review
- Gate BE: `npm run check` xanh: 65 unit, 49 e2e, 37 content, JMdict 3.097 từ. Gate FE: lint, typecheck, 708 test, lib coverage 98.56% line. E2E: lần chạy đủ 268/270, hai lỗi đều là số từ N5 cũ trong `home.spec.ts` (694 → 702); sửa xong chạy lại `home` + `vocab-page`: 24/24, test đồng âm mở rộng: 2/2.
- `vocabHref` test đỏ trước khi sửa; guard `ids.has` và guard kanji trong luật id đều thử bỏ đi thì test đỏ.
- Codex thêm 51 từ (N5 +8, N3 +43; danh sách BACKLOG có ~70 tên nhưng nhiều tên lặp hoặc đã có cùng chữ và cách đọc: 髪, 風, 箸, 服, 撮る, 着る, 暑い, 引く, 濃い, 意外). Không mục cũ nào đổi; dòng mới được chuẩn lại theo định dạng của file. Từ có kanji trong cấp dùng id ngắn khi id ngắn còn trống (`vocab:留める`, `vocab:低下`, `vocab:し` cho 詩...).
- Mẫu duyệt: 51 từ mới là 51 mục cuối `vocab.json` (sau `vocab:仕組み`), ít hơn hai mẫu 30, nên duyệt hết thay vì rút mẫu. `npm run sample -- <seed>` vẫn chạy được, nhưng rút theo cấp, không theo lô.
- Codex review read-only, 3 điểm:
  - Luật id chấp nhận một bản sao như `vocab:かみ:髪` khi `vocab:かみ` đã là 髪. Sửa: chủ id ngắn phải có kanji khác; có test.
  - Thiếu mẫu duyệt: xử lý như mục trên.
  - E2E chỉ kiểm liên kết đồng âm từ trang bài học. Thêm kiểm tra cho trang tìm kiếm và trang kanji 紙.
