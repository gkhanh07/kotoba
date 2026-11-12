# Rà soát tiếng Việt toàn website

## Phạm vi và giả định
- Rà soát mọi chuỗi dành cho người dùng trong frontend, thông báo backend và các trường tiếng Việt của nội dung học. Chỉ sửa cách diễn đạt; giữ nguyên logic, key, dữ liệu kỹ thuật, tiếng Nhật, thông tin và layout.
- Yêu cầu trực tiếp của người dùng được ưu tiên trong phiên này; không tiếp tục viết nội dung 29b.
- Không đổi schema, id, cách chấm điểm hay trạng thái `reviewed`. Nội dung đã rõ ràng được giữ nguyên.
- Xưng hô “bạn”; dùng “chọn” cho thao tác dùng được cả chuột và cảm ứng; thống nhất “liên kết”, “thiết bị”, “xóa”, “ôn tập”, “đến hạn ôn”. Giữ các thuật ngữ học tiếng Nhật như kana, kanji, Hán Việt và trường âm.

## Tiêu chí nghiệm thu
- AC-1: Given trang chủ, bảng chữ và lỗi hệ thống, When đọc tiếng Việt, Then hướng dẫn và thông báo rõ ràng, tự nhiên, không dùng ẩn dụ thay trạng thái cần biết.
- AC-2: Given tài khoản, thư viện, bài học, ôn tập, tra cứu và thi thử, When đọc nhãn/hướng dẫn/trạng thái, Then câu chữ nhất quán, giữ đủ điều kiện và cảnh báo gốc.
- AC-3: Given backend và nội dung học, When rà soát các trường hiển thị, Then sửa tiếng Việt chưa tự nhiên mà không đổi thông tin học hay hợp đồng API; ghi rõ phần cần người duyệt.
- AC-4: Given toàn bộ thay đổi, When chạy Quality Gate và kiểm tra ở 360/768/1440px, Then chức năng và dữ liệu giữ nguyên, không tràn ngang; xem ảnh mobile/desktop.
- AC-5: Given báo cáo, When đối chiếu, Then có danh sách nguồn đã rà soát, ví dụ trước/sau, thuật ngữ chuẩn hóa và hạn chế còn lại.

## Ma trận kiểm tra
| AC | Kiểm tra | Lớp |
|---|---|---|
| 1–2 | Các assertion nhãn chính xác trong test hiện có; bổ sung regression cho thông báo cần diễn đạt rõ | Vitest / RTL |
| 3 | Đối chiếu diff chỉ đổi chuỗi hiển thị; validate:content + JMdict | Review / content |
| 4 | check ở cả hai app; toàn bộ Playwright, axe; ảnh mobile/desktop và kiểm tra 768px | Tích hợp / E2E |
| 5 | Đối chiếu báo cáo với diff và nguồn đã quét | Review |

## Nhóm tình huống §7.2
- Áp dụng: luồng chính, trạng thái rỗng/đang tải/lỗi, dữ liệu và nhãn động, cảnh báo lưu trữ, thao tác bàn phím, điều hướng, hiển thị dài ở 360/768/1440; dùng các test hiện có.
- N/A đối với test mới về biên số, migration, đồng thời, thời gian, persistence, chuyển trạng thái và hiệu năng 5.000 mục: chỉ biên tập câu chữ, không thay thuật toán hay trạng thái; các regression hiện có vẫn phải xanh.

## Các bước
1. Lập danh mục nguồn; đọc chuỗi và nơi sử dụng, thống nhất thuật ngữ.
2. Bổ sung/chỉnh assertion theo câu chữ mục tiêu và thấy test thất bại trước khi sửa chuỗi.
3. Sửa chuỗi tại nguồn; rà soát độc lập diff.
4. Chạy Quality Gate, kiểm tra hình ảnh, ghi kết quả và commit khi xanh.

## Kết quả và tự rà soát

### Nguồn đã rà soát
- `kotoba-fe/src/lib/{i18n,account,library,flashcards,testText}.ts`: trang chủ, điều hướng, kana, kanji, từ vựng, ngữ pháp, bài học, ôn tập, tra cứu, thi thử, tài khoản và mọi trạng thái của các nhóm này.
- Quét toàn bộ `kotoba-fe/src/app/**/*.{ts,tsx}` ngoài test để tìm chuỗi hiển thị nằm ngoài dictionary; biên tập `Dashboard.tsx` và `legal/page.tsx`. `Heatmap.tsx` và nhãn ngôn ngữ đã rõ nghĩa nên giữ nguyên. Đã đọc route xuất dữ liệu và error boundaries.
- `kotoba-be/src`: thông báo lỗi là mã kỹ thuật được frontend dịch; sửa nội dung email đặt lại mật khẩu trong `auth.controller.ts`, không sửa mã lỗi.
- Toàn bộ content: 224 kana, 625 kanji, 81 bài học, 110 điểm ngữ pháp, 3.046 từ vựng và 2 đề thi/103 câu. Sửa 49 trường tiếng Việt thuộc 44 mục (28 từ vựng, 14 ngữ pháp, 2 giải thích câu thi); giữ nguyên nội dung đã rõ ràng.

### Trước và sau
| Vị trí | Trước | Sau |
|---|---|---|
| Lỗi kết nối | Mất điện một lúc | Không thể kết nối máy chủ |
| Đang tải kana | Đang bật đèn bảng chữ… | Đang tải bảng chữ… |
| Thi thử | Làm cả đề trong thời gian thật | Làm trọn đề trong thời gian quy định |
| Xác nhận nộp bài | Nộp rồi thì không sửa được nữa. | Bạn không thể sửa đáp án sau khi nộp bài. |
| Hướng dẫn ôn | tự chấm thật lòng | tự đánh giá mức độ ghi nhớ |
| Từ vựng 楽しみ | Tôi rất mong chuyến du lịch kỳ nghỉ hè. | Tôi rất mong chờ chuyến du lịch trong kỳ nghỉ hè. |
| Ngữ pháp お〜になる | nâng người đó lên | nhằm thể hiện sự tôn kính |
| Email đặt lại mật khẩu | Mở link sau trong 30 phút | Mở liên kết dưới đây trong vòng 30 phút |

Thuật ngữ được ghi trong `kotoba-fe/DESIGN.md`: bạn, chọn, liên kết, thiết bị, xóa, khóa học, bộ thẻ, danh sách ôn tập, mức độ ghi nhớ, đến hạn ôn. Giữ riêng hai trạng thái “Đã học” và “Đã thuộc” theo ADR 007.

### Giới hạn và phần cần duyệt
- Mô tả danh sách bài học và metadata thi thử còn đề cập N5, trong khi danh mục có N4/N3. Giữ thông tin gốc theo yêu cầu chỉ sửa cách diễn đạt; đã ghi BACKLOG để chỉnh riêng phạm vi nội dung.
- Lỗi 503 của `/settings/export` là tiếng Anh. Việc thêm lựa chọn ngôn ngữ cần thay handler/test nên đã ghi BACKLOG, giữ chức năng gốc.
- Nội dung học vẫn `reviewed: false`. Mẫu 30 mục, seed `20261112`, cùng toàn bộ thay đổi trước/sau ở [vietnamese-copy-content-sample.md](vietnamese-copy-content-sample.md). Cần người dùng duyệt; không dùng kết quả JMdict để khẳng định nghĩa và ví dụ đã được con người kiểm chứng.
- Không có quyết định kiến trúc, schema hay hành vi mới nên không tạo ADR mới.

### Test và review
- 7 regression FE đã thấy thất bại đúng lý do trước khi sửa (7 failed/23 passed); sau sửa test dictionary 30/30, toàn bộ FE 665/665. Assertion email cũng đã thấy thất bại do nội dung cũ (1 failed/5 passed), sau sửa toàn bộ BE E2E 41/41.
- FE `npm run check`: lint/typecheck/build xanh; 665 test, coverage lines 98,49%, branches 96,98% (ngưỡng logic đạt). Warning cấu hình ESM/CJS của Vite đã có từ lần RED đầu.
- BE `npm run check` với `RUST_LOG=info`: lint/typecheck/build xanh; 57 unit, coverage lines 30,06%, branches 35,59%; 41 E2E; 35 content; JMdict 3.046 từ. Sau hai sửa explain cuối, chạy lại `validate:content`: 35/35 và JMdict xanh.
- Prisma ban đầu lỗi tạo SQLite trong môi trường Windows; chạy chẩn đoán với đường dẫn tuyệt đối, sau đó chạy lại gate với `RUST_LOG=info` thành công. Không sửa cấu hình ứng dụng. Playwright lần đầu bị chặn bởi các Nest dev server cũ; đã xác minh command line thuộc đúng repo rồi dừng các server đó để dùng DB e2e riêng.
- Reviewer độc lập: PASS; không có finding High/Critical, không đổi logic/key/API/JA/EN/schema/reviewed; không giảm assertion.
- Đối chiếu AST 8 tệp mã sản phẩm với HEAD: chỉ literal/template/JSX text thay đổi. Đối chiếu JSON của 3 tệp content sau khi bỏ các trường tiếng Việt: mọi key, cấu trúc và dữ liệu khác đều khớp HEAD. Đây là kiểm tra bổ sung bằng script trong phiên, không phải test mới được lưu trong repo.
- Tự rà soát đã sửa: giữ độ chính xác “một ngày trước” của 前日; rút gọn câu よゆう còn gượng; đồng bộ cả mẫu duyệt với nguồn sau sửa.
- Đã mở và xem ảnh 360×740, 768px và 1440×900: trang chủ, dashboard, ôn tập; thêm ảnh mobile cài đặt, bài học và trang bắt đầu/kết quả thi. Câu chữ vẫn trong vùng hiển thị, không thấy chồng lấn hay cắt chữ do thay đổi này. Ảnh nằm trong `kotoba-fe/test-results/` (gitignored).
- Lần chạy Playwright toàn bộ phát hiện một expectation cũ tại `vocab-page.spec.ts` (“Chữ do Nhật tạo…”); error-context xác nhận trang hiển thị đúng câu mới. Đã sửa expectation chính xác, không đổi logic hay giảm assertion. Rà AST thêm 113 chuỗi/mảnh template thay đổi với 46 file test không thấy expectation cũ nào khác.
- Lần full Playwright: 238/240 qua; 2 ca lỗi là cùng expectation cũ ở mobile/desktop (worker đã nạp bản test trước khi sửa). Chạy lại toàn bộ `e2e/vocab-page.spec.ts` với nguồn test mới: **14/14 qua**, gồm cả hai ca từng lỗi; xác nhận đủ 240 ca riêng biệt qua. Không đổi mã sản phẩm sau lần full. Axe không có serious/critical; không có lỗi console ngoài các lỗi 404/500 cố ý được fixture đối chiếu chính xác. Sau sửa test, chạy lại FE lint/typecheck: xanh.
- Log môi trường: Playwright cảnh báo `NO_COLOR`/`FORCE_COLOR`; lỗi kết nối ở ca cố ý tắt backend được fixture kiểm tra chính xác. Có log server `The destination stream closed early` khi chuyển trang, không kèm ca lỗi hay browser console error tương ứng; không sửa framework trong task biên tập.

### Kết luận
- AC-1–5: 5/5 đạt trong phạm vi biên tập; các giới hạn được ghi rõ ở trên.
- Checklist §9: đúng phạm vi, không đổi dữ liệu/logic, giữ đủ cảnh báo và trạng thái; không thêm dependency/timer/effect; test deterministic và đã thấy RED; đã xem ảnh mobile/desktop và 768px; tài liệu và glossary cập nhật. Không phát hiện bug chức năng mới.
- Test mới: +7 unit dictionary, +0 component, +0 E2E; thêm assertion nội dung email vào test BE E2E hiện có. Không đổi hay hạ ngưỡng coverage.
- Quality Gate: lint ✓ typecheck ✓ test ✓ E2E ✓ content/JMdict ✓ build ✓; reviewer PASS. E2E gồm lần full và lần chạy lại nhóm đã cập nhật expectation, không phải một lần full 240/240 xanh.
- DONE; commit `style(copy): refine Vietnamese wording across the site`. Không push trong phiên local.
