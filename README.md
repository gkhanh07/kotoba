# Kotoba

Kotoba là ứng dụng tự học JLPT N5–N3 dành cho người Việt, với giao diện tiếng Việt mặc định và tùy chọn tiếng Anh. Nội dung gồm kana, kanji kèm âm Hán Việt, từ vựng, ngữ pháp, ôn tập Leitner SRS và đề thi thử. Khách lưu tiến độ trong trình duyệt; tài khoản hỗ trợ đồng bộ tiến độ. Đề thi thử không có phần nghe và không phải đề JLPT chính thức.

## Cấu trúc repo

- `kotoba-be/`: API NestJS 12, Prisma 7 và SQLite.
- `kotoba-fe/`: Next.js 16 App Router, React 19.
- `kotoba-be/content/`: JSON cho kana, kanji, từ vựng, ngữ pháp, bài học và đề thi.
- `docs/`: kế hoạch, tiến độ và các quyết định kỹ thuật.

## Cài đặt và chạy cục bộ

Cần Node.js >= 24 và npm. Chạy từ thư mục gốc repo:

```sh
cp kotoba-be/.env.example kotoba-be/.env
cp kotoba-fe/.env.example kotoba-fe/.env.local
cd kotoba-be
npm ci
npx prisma migrate deploy
npm run start:dev
```

Phải tạo `.env` backend trước `npm ci`: `postinstall` chạy `prisma generate`, cần `DATABASE_URL`. Backend lắng nghe tại `127.0.0.1:4000`. Xem [README backend](kotoba-be/README.md) để biết biến môi trường và API.

Trong terminal khác, từ gốc repo:

```sh
cd kotoba-fe
npm ci
npm run dev
```

Mở `http://localhost:3000`. Các biến frontend đều tùy chọn trong `.env.local`: `API_URL` là địa chỉ backend dùng phía server (mặc định `http://127.0.0.1:4000`); `ALLOWED_DEV_ORIGINS` là danh sách hostname bổ sung cho dev server, phân cách bằng dấu phẩy, không gồm scheme hoặc cổng; `TRUST_PROXY=1` chỉ đặt khi có reverse proxy phía trước ghi `X-Forwarded-For` (xem [README backend](kotoba-be/README.md)).

## Script và kiểm thử

Repo không có `package.json` ở gốc. Chạy lệnh trong từng ứng dụng.

| Lệnh | `kotoba-be` | `kotoba-fe` |
|---|---|---|
| `npm run check` | lint, typecheck, coverage, API E2E, kiểm tra nội dung, build | lint, typecheck, coverage, build |
| `npm test` | Vitest: logic backend và nội dung | Vitest: logic và component |
| `npm run test:cov` | Vitest với coverage | — |
| `npm run test:coverage` | — | Vitest với coverage |
| `npm run test:e2e` | Vitest + Supertest, dùng `test.db` | Playwright trên mobile và desktop, kèm kiểm tra axe |
| `npm run build` | `nest build` | `next build` |

Quality Gate đầy đủ: chạy `npm run check` ở cả hai ứng dụng, rồi `npm run test:e2e` trong frontend. Playwright tự khởi động hai ứng dụng, dùng `e2e.db` riêng cho backend; cần cổng 3000 và 4000 trống. Cấu hình Playwright hiện dùng lệnh shell `rm`, nên môi trường chạy E2E cần hỗ trợ lệnh này.

Ảnh chụp mọi trang ở 360/768/1440 (phase 42, không commit): trong `kotoba-fe/` chạy `SCREENS=1 npx playwright test e2e/screens.spec.ts --project=desktop`, ảnh nằm ở `docs/screenshots/<rộng>/`. Không có `SCREENS` thì spec này vẫn chạy trong bộ E2E: mọi trang qua axe và không cuộn ngang ở cả ba bề rộng.

Trên Windows, chạy Vitest từ cwd có chữ cái ổ đĩa viết hoa, ví dụ `C:\Users\Administrator\Desktop\kotoba\kotoba-fe`. Theo [PROGRESS](docs/progress/PROGRESS.md), cwd bắt đầu bằng `c:\` có thể tải Vitest hai lần và gây lỗi “Vitest failed to find the current suite”.

Các công cụ nội dung chạy trong `kotoba-be/`:

| Lệnh | Tác dụng |
|---|---|
| `npm run validate:content` | Chạy test nội dung, rồi kiểm tra JMdict |
| `npm run jmdict` | Đối chiếu cách viết/âm đọc từ vựng với JMdict và kiểm tra ví dụ có dùng từ |
| `npm run kanjidic` | Tạo lại `content/kanji.json` từ KANJIDIC2, giữ các trường tự biên soạn |
| `npm run sample -- <seed> [out.md]` | Rút mẫu duyệt với seed; bỏ đối số đường dẫn để in ra terminal |

Ví dụ: `npm run sample -- 20261114`. JMdict và KANJIDIC2 được tải vào `.cache/` nếu chưa có, nên lần đầu cần mạng. Kiểm tra tự động không thay thế việc duyệt nghĩa, ví dụ và lời giải. Chỉ người dùng quyết định `reviewed: true`.

Không có script npm `seed`. Khi backend khởi động, `Db.onModuleInit()` đồng bộ bảng `Item` từ JSON, chỉ ghi các dòng thay đổi. Đề thi trong `content/tests.json` được đọc trực tiếp, không seed vào `Item`.

## Nguồn dữ liệu và giấy phép

Kotoba sử dụng **JMdict** và **KANJIDIC2** của **Electronic Dictionary Research and Development Group (EDRDG)**. Âm đọc từ vựng được đối chiếu với JMdict; dữ liệu kanji như âm On/Kun, số nét và cấp JLPT cũ lấy từ KANJIDIC2. Xin ghi nhận EDRDG là đơn vị cung cấp các bộ dữ liệu này. Dữ liệu dẫn xuất được chia sẻ theo [Creative Commons BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), theo [giấy phép EDRDG](https://www.edrdg.org/edrdg/licence.html). Giấy phép này áp dụng cho dữ liệu dẫn xuất; repo không tuyên bố đây là giấy phép cho toàn bộ mã nguồn Kotoba.

Âm Hán Việt được đối chiếu với [hanviet-pinyin-wordlist](https://github.com/ph0ngp/hanviet-pinyin-wordlist), **Copyright (c) 2024 Phong Phan**, giấy phép **MIT**. Một số âm giữ theo KANJIDIC2 được ghi rõ trong [ADR 009](docs/decisions/009-han-viet-source.md).

Thứ tự và hình nét kanji lấy từ [KanjiVG](https://kanjivg.tagaini.net), **Copyright (C) 2009–2025 Ulrich Apel**, giấy phép [Creative Commons BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Danh sách kanji N3 dựa trên danh sách JLPT của **Jonathan Waller / tanos.co.uk**, giấy phép **Creative Commons BY (CC BY)**: [danh sách N3 lưu trữ](https://web.archive.org/web/2023id_/https://www.tanos.co.uk/jlpt/jlpt3/kanji/) và [trang cấp phép “Use my data!”](https://web.archive.org/web/20231128200421/https://www.tanos.co.uk/jlpt/sharing/). Đây là danh sách không chính thức; kanji đã dạy ở N5/N4 giữ nguyên cấp. Xem [ADR 006](docs/decisions/006-n3-n2-kanji-levels.md) và trang `/legal` trong ứng dụng.
