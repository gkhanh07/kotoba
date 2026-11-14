# Phase 37: Việc dở và lỗi hiển thị (BACKLOG)

Nguồn: `docs/plan/PLAN.md` mục Phase 37, `docs/progress/BACKLOG.md`. Không đổi dữ liệu người dùng; không đổi schema.

Phạm vi bỏ ra, có lý do:
- "Bài học: dạy trước, hỏi sau" được Phase 41.8 ("Chia nhỏ: cứ 3 mục mới thì kiểm tra nhanh 3 mục") thay thế (PLAN dòng 115), nên không làm ở đây để khỏi làm hai lần.
- Thanh giai đoạn trên Dashboard: Phase 41.2 viết lại Dashboard; ở đây chỉ sửa cho đúng số liệu, không đổi bố cục.

## Acceptance criteria

**Level**
- AC-1 Given app chỉ có nội dung N5–N3, When mở tab level (`/kanji`, `/vocab`, `/grammar`, `/lessons`) hoặc gọi `GET /levels`, Then chỉ có N5, N4, N3; không có N2.
- AC-2 Given người dùng đã lưu mục tiêu N2 hoặc N1, When mở hồ sơ, Then giá trị vẫn đọc được (không mất, không lỗi); danh sách mục tiêu chào chọn chỉ có N5–N3 (cùng "chưa chọn" nếu đang có).

**Auth / Dashboard**
- AC-3 Given trang đăng nhập/đăng ký, Then không còn nút Google bị vô hiệu.
- AC-4 Given người dùng đã học hết kana trong phạm vi, When mở Dashboard, Then thanh giai đoạn nói giai đoạn thật (Kana → Kanji → Từ vựng theo thứ tự phần đầu tiên chưa xong) với số đúng của giai đoạn đó, không ghi cứng "Kana".
- AC-5 Given srs có thẻ của id không còn trong nội dung, When Dashboard đếm số đến hạn, Then thẻ đó không được đếm.

**Copy**
- AC-6 Given đề N4/N3, Then văn bản giới thiệu đề ghi đúng cấp của đề, không ghi "JLPT N5".
- AC-7 Mô tả danh sách bài học không nói bài học dừng ở N5.
- AC-8 `/legal` chỉ nêu nguồn Waller cho N3 (không nói N2); footer ghi nguồn Hán Việt (hanviet-pinyin-wordlist).

**Đề thi**
- AC-9 Given `passage` có `\n`, When hiện câu hỏi, Then mỗi đoạn là một `<p>`.
- AC-10 Given con trỏ đang trong vùng cuộn ngang (bảng/đoạn văn tràn), When nhấn ←/→, Then không bị `preventDefault` (phím chuyển câu chỉ chạy khi focus không ở phần tử cuộn được hoặc ô nhập).

**Kanji**
- AC-11 Given kanji không có âm Hán Việt (vd 込), Then không render span `hv` rỗng ở trang kanji, trang từ, lưới kanji, trang bài học.
- AC-12 Given kanji không có âm On, Then không có hàng "Âm On" rỗng.
- AC-13 Given kanji có nhiều âm, Then âm hiếm (ngoài số đầu hiển thị) gập vào `<details>`.

**Ngữ pháp / romaji**
- AC-14 Trang ngữ pháp có chú giải ký hiệu N/V/A dùng trong `pattern`.
- AC-15 Romaji hiển thị một kiểu chữ thường (không `text-transform: uppercase`).

**Đến hạn / phạm vi**
- AC-16 Số đến hạn ở `/vocab` và số thẻ trong `/review?kind=vocab` tính trên cùng phạm vi level.
- AC-17 `/flashcards` mặc định xếp theo thứ tự bài.
- AC-18 `/review` chỉ gửi xuống client mục trong phạm vi (giảm kích thước HTML; ghi số đo trước/sau).
- AC-19 Mỗi route có dữ liệu bất đồng bộ có `loading.tsx`.

**Onboarding**
- AC-20 Given người dùng đã chọn mục tiêu lúc đăng ký, When vào onboarding, Then không hỏi lại mục tiêu.

**Docs / config**
- AC-21 README gốc (setup, script, test, nguồn và giấy phép EDRDG/JMdict/KANJIDIC2, hanviet-pinyin-wordlist, Waller CC BY); `kotoba-be/README.md` thay bản mẫu Nest; `PRODUCT.md` có non-goals (luyện nghe, AI, CMS, PWA, N2/N1); `DESIGN.md` một mục Glossary.
- AC-22 `INTERVALS`, `KNOWN_AT` nằm ở `kotoba-fe/src/config/`; hành vi SRS không đổi (test cũ pass nguyên).

## Test matrix
| AC | Test | Lớp |
|---|---|---|
| 1 | `library.test.ts` LEVELS/labels; `LevelTabs.test.tsx`; BE `levels` e2e; `e2e/levels.spec.ts` | unit, component, e2e |
| 2 | `account.test.ts` goal options vs stored N2 | unit |
| 3 | forms test (không có nút Google) | component |
| 4, 5 | `dashboard` helper unit (stage, due chỉ đếm id trong nội dung) | unit |
| 6 | `testText` unit theo level | unit |
| 7, 8 | text test trong `i18n`/legal component | component |
| 9, 10 | `TestApp` component | component |
| 11–13 | component kanji | component |
| 14, 15 | component grammar; CSS grep | component |
| 16–18 | unit scope helper; e2e review | unit, e2e |
| 19 | đếm file (đọc lại) | — |
| 20 | onboarding component | component |
| 21 | đọc lại | — |
| 22 | test SRS hiện có không sửa | unit |

§7.2: thời gian, đa tab, offline: N/A (không đổi luồng dữ liệu). Dữ liệu cũ: AC-2, AC-5. Responsive: ảnh 360/1440 cho trang kanji, đề thi.

## Phân công
Codex: AC-21 trừ `DESIGN.md` (README gốc, `kotoba-be/README.md`, `kotoba-fe/PRODUCT.md`). Còn lại: Claude.

## Review
Self-review + Codex read-only (2026-11-14).

- **Codex viết:** README gốc, `kotoba-be/README.md`, `kotoba-fe/PRODUCT.md` (AC-21). `DESIGN.md` đã có mục Glossary từ trước (dòng 445), không sửa.
- **AC-14:** chú giải gồm N, V, V-て, N1/N2, `A-い, A-な, adj` (tính từ) và `A, B` (hai người/vật trong `A は B に…`). Bản đầu bỏ "A" vì tưởng không dùng; Codex chỉ ra 51 cấu trúc dùng `A-い/A-な` và 13 dùng `adj` → đã thêm. Nội dung còn lẫn `adj` và `A-` cho cùng một nghĩa: thống nhất là việc nội dung, ghi BACKLOG.
- **AC-8:** footer riêng của trang chủ khách cũng ghi nguồn Hán Việt (Codex phát hiện; `e2e/home.spec.ts` đã chờ chuỗi này).
- **AC-16/17:** `/review` nhận `?level=`; `/vocab` truyền level của tab nên số đến hạn và hàng đợi khớp nhau. Không có `?level=` thì theo phạm vi mục tiêu (`reviewScope`). Liên kết bài học tự mang level của bài nên bài vượt mục tiêu vẫn mở được. Dashboard dùng cùng phạm vi cho cả số đến hạn lẫn "N mục mới" (Codex phát hiện `stops` chưa lọc theo mục tiêu → báo mục mới N4 mà phiên học trống).
- **AC-18, số đo** (`next start` bản build, HTML byte): `/review?kind=vocab` không level, không mục tiêu = 1.828.447 (bằng trước phase); `&level=5` = 420.717 (−77%); `&level=4` = 375.021; `&level=3` = 1.071.681; `/review?start=1&level=5` = 420.597. **Chưa giải quyết:** khách chưa đăng nhập hoặc chưa đặt mục tiêu vẫn nhận 1,8 MB. Codex đề nghị lọc thêm theo bài/kind ở server: không làm, vì `nextLesson` trong `ReviewApp` cần cả phạm vi để chỉ bài kế tiếp.
- **AC-19: không làm.** Bản đầu có một `app/loading.tsx` ở gốc. E2E cho thấy boundary này làm Next stream trước khi `notFound()` chạy, nên trang 404 trả 200 (layout, levels, test, vocab-page) và trang mất kết nối mất title (BUG-017). `loading.tsx` theo từng route cũng gây lỗi này ở route có `notFound()`. Đã xoá; giữ status code đúng quan trọng hơn màn chờ. `/kana` vẫn giữ boundary riêng như trước. Ghi BACKLOG.
- **Đổi test e2e theo hành vi mới:** `redesign.spec.ts` chờ link `/review?kind=vocab&level=5` (AC-16). `n4-path.spec.ts` đăng ký với mục tiêu N4: Dashboard giờ chỉ tính trong phạm vi mục tiêu, nên người đặt mục tiêu N5 đã học hết N5 thấy 0 mục mới. Phase 41.2 cần gợi ý nâng mục tiêu (ghi BACKLOG).
- **E2E chạy cạnh dev server:** `E2E_BE_PORT` (mặc định 4000) trong `e2e/backend.ts`, nên E2E chạy được trên cổng 4100 khi `start:dev` đang giữ 4000. Codex review: không có phát hiện.
- **AC-22:** `INTERVALS`, `KNOWN_AT` ở `config/srs.ts`; `lib/srs.ts` re-export nên mọi import cũ và test SRS giữ nguyên.
- Mở: phiên bản CC BY của dữ liệu Waller cần người dùng xác nhận.

Gate: BE `npm run check` xanh (36 content, JMdict 3.046 từ, build). FE `npm run check` xanh (703 Vitest, build). E2E (`E2E_BE_PORT=4100`): lần đầu 246 pass, 22 fail; sửa (bỏ `loading.tsx` gốc, đổi 2 kỳ vọng); chạy lại 6 file bị lỗi: 204/204 pass.
