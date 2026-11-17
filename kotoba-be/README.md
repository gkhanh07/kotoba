# Kotoba backend

API NestJS 12 cho nội dung học JLPT, tài khoản và đồng bộ tiến độ. Dùng Prisma 7 với SQLite. API chỉ lắng nghe trên `127.0.0.1`; frontend Next.js gọi API từ server.

## Cài đặt

Cần Node.js >= 24. Từ thư mục gốc repo:

```sh
cp kotoba-be/.env.example kotoba-be/.env
cd kotoba-be
npm ci
npx prisma migrate deploy
npm run start:dev
```

Tạo `.env` trước `npm ci` vì `postinstall` chạy `prisma generate`, cần `DATABASE_URL`. Chạy migration trước `start:dev`; script này không có hook migration tự động.

Các biến trong `.env.example`:

| Biến | Giá trị mẫu | Công dụng |
|---|---|---|
| `PORT` | `4000` | Cổng API trên `127.0.0.1` |
| `DATABASE_URL` | `file:./dev.db` | Kết nối SQLite |
| `APP_URL` | `http://localhost:3000` | URL frontend dùng trong liên kết đặt lại mật khẩu |
| `SMTP_URL` | (trống) | Tùy chọn. Ví dụ `smtps://user:pass@host:465`; cùng `MAIL_FROM` thì gửi email đặt lại mật khẩu qua SMTP ([ADR 012](../docs/decisions/012-smtp-via-nodemailer.md)) |
| `MAIL_FROM` | (trống) | Tùy chọn. Địa chỉ người gửi, ví dụ `Kotoba <no-reply@example.com>` |

Thiếu `SMTP_URL` hoặc `MAIL_FROM` thì `Mailer` chỉ ghi liên kết đặt lại mật khẩu vào log. Gửi lỗi cũng chỉ ghi log; `/auth/forgot` vẫn trả 204.

Giới hạn theo IP (đăng nhập, đăng ký, đặt lại mật khẩu) dùng IP mà frontend chuyển qua. Frontend chỉ chuyển IP khi đặt `TRUST_PROXY=1` trong môi trường frontend, và chỉ nên đặt khi có reverse proxy phía trước ghi `X-Forwarded-For`. Không có proxy thì để trống: mọi người dùng chung một bucket (chặt hơn, nhưng client không giả IP được).

## Script và kiểm thử

Chạy trong `kotoba-be/`:

| Lệnh | Tác dụng |
|---|---|
| `npm run start` | Chạy Nest; hook `prestart` áp dụng migration |
| `npm run start:dev` | Chạy Nest với watch |
| `npm run start:debug` | Chạy Nest với debug và watch |
| `npm run build` | Build bằng Nest CLI |
| `npm run start:prod` | Chạy `dist/main`; hook áp dụng migration trước khi chạy |
| `npm run lint` | oxlint với kiểm tra kiểu trên `src/`, `test/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier, ghi lại các tệp TypeScript trong `src/`, `test/` |
| `npm test` | Vitest: unit và nội dung |
| `npm run test:watch` | Vitest ở chế độ watch |
| `npm run test:cov` | Vitest với coverage và ngưỡng trong cấu hình |
| `npm run test:debug` | Vitest với inspector, không chạy song song các tệp |
| `npm run test:e2e` | Vitest + Supertest, tạo lại `test.db` và áp dụng migration trước kiểm thử API |
| `npm run validate:content` | Test `content/`, rồi chạy kiểm tra JMdict |
| `npm run check` | lint → typecheck → test:cov → test:e2e → validate:content → build |
| `npm run jmdict` | Đối chiếu từ vựng/âm đọc và kiểm tra ví dụ có dùng từ |
| `npm run kanjidic` | Tạo lại kanji JSON từ KANJIDIC2, giữ các trường tự biên soạn |
| `npm run sample -- <seed> [out.md]` | Rút mẫu nội dung để duyệt; in ra terminal hoặc ghi tệp |

`package.json` cũng có `deploy` (`nest deploy`); script không chỉ định đích triển khai.

Trên Windows, cwd chạy Vitest phải dùng chữ cái ổ đĩa viết hoa (`C:\...`); xem [PROGRESS](../docs/progress/PROGRESS.md) về lỗi tải Vitest hai lần khi dùng `c:\...`.

## API

Các route được khai báo trong `src/content.controller.ts`, `src/auth.controller.ts` và `src/progress.controller.ts`. Các route cần đăng nhập dùng `Authorization: Bearer <token>`.

| Method | Path | Công dụng |
|---|---|---|
| GET | `/content/:kind` | Danh sách `kana`, `kanji`, `vocab`, `lesson`, `grammar`; lọc `lesson`, `level`, `script`, `group`, `topic`; phân trang bằng `page` |
| GET | `/content/item/:id` | Chi tiết mục; kanji kèm từ vựng chứa chữ đó |
| GET | `/search?q=...` | Tìm nội dung; tùy chọn `level` |
| GET | `/tests` | Danh sách đề, tùy chọn `level` |
| GET | `/tests/:id` | Đề đầy đủ, gồm đáp án và lời giải để tự học |
| POST | `/auth/register` | Tạo tài khoản và phiên đăng nhập |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/forgot` | Yêu cầu đặt lại mật khẩu |
| POST | `/auth/reset` | Đặt mật khẩu bằng reset token |
| POST | `/auth/logout` | Đăng xuất phiên hiện tại; cần đăng nhập |
| GET / PATCH / DELETE | `/me` | Đọc/sửa hồ sơ hoặc xóa tài khoản; cần đăng nhập |
| GET | `/me/export` | Xuất hồ sơ, thẻ và nhật ký học; cần đăng nhập |
| POST | `/me/password` | Đổi mật khẩu; cần đăng nhập |
| PUT | `/progress` | Đồng bộ thẻ, reset và nhật ký học; cần đăng nhập. Body `{}` lấy trạng thái tài khoản |

## Nội dung và seed

Nguồn nội dung là `content/*.json`. Không có script npm `seed`: `src/db.ts` tự seed khi module khởi tạo, đồng bộ các mục khác biệt trong một transaction. Xóa mục đang có thẻ học tham chiếu sẽ làm khởi động thất bại thay vì xóa tiến độ. Đề trong `content/tests.json` được controller đọc trực tiếp, không lưu trong bảng `Item`.

Sau khi sửa nội dung, chạy `npm run validate:content` và khởi động lại API để nạp dữ liệu. `jmdict` và `kanjidic` tải nguồn vào `.cache/` khi chưa có. `kanjidic` ghi lại `content/kanji.json`; `sample` không đổi cờ `reviewed`. Chỉ người dùng đặt `reviewed: true`; nghĩa, ví dụ và lời giải vẫn cần duyệt thủ công.

Nguồn dữ liệu và giấy phép được ghi trong [README gốc](../README.md#nguồn-dữ-liệu-và-giấy-phép).
