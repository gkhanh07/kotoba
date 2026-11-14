# Phase 38: Bảo mật và độ bền BE

Nguồn: `docs/plan/PLAN.md` mục Phase 38, `docs/progress/BACKLOG.md` ("A reset during a push"). Không đổi schema, không đổi dữ liệu người dùng.

## Acceptance criteria

**IP cho rate limit**
- AC-1 Given FE chạy không có `TRUST_PROXY=1`, When client gửi `x-forwarded-for` lúc đăng nhập/đăng ký, Then FE không chuyển IP đó cho BE (BE dùng IP socket, tức là một bucket chung: chặt hơn, không lách được).
- AC-2 Given `TRUST_PROXY=1` (proxy phía trước ghi đè/nối header; E2E đặt biến này), Then FE chuyển phần tử cuối của `x-forwarded-for` như trước. README ghi cách triển khai.

**Rate limit**
- AC-3 `POST /me/password` và `DELETE /me`: sai mật khẩu hiện tại 5 lần trong 15 phút (đếm chung hai route, theo user) → 429 `rate`, kể cả khi lần sau đúng mật khẩu. Kiểm tra chặn trước khi chạy scrypt.
- AC-4 `POST /auth/reset`: 10 token sai trong 15 phút từ một IP → 429 `rate`.
- AC-5 FE hiện thông báo "thử lại sau" cho `rate` ở form đổi mật khẩu, xoá tài khoản, đặt lại mật khẩu (không rơi vào error boundary).

**Token**
- AC-6 Mỗi lần tạo session, token (session hoặc reset) đã hết hạn của mọi user bị xoá.

**Đồng bộ**
- AC-7 `PUT /progress` với hơn `MAX_PUSH_CARDS` (10.000; nội dung hiện có ~4.100 mục) thẻ → 400 `cards`, không ghi gì.
- AC-8 Given đang có push, When người dùng reset một bộ không có thẻ nào ở máy, Then khi push trả về, mục `forget` mới vẫn còn trong `kotoba.sync.v1` và được gửi ở lần push sau (BACKLOG, ưu tiên 1).

**Mail**
- AC-9 Given có `SMTP_URL` (và `MAIL_FROM`), Then `Mailer.send` gửi qua SMTP (nodemailer, ADR 012). Không có thì log như cũ. Lỗi gửi không làm `/auth/forgot` trả khác 204 (không lộ email nào tồn tại) nhưng được log.

**Coverage**
- AC-10 Ngưỡng coverage BE nâng lên mức đo được sau phase (làm tròn xuống), không hạ.

## Test matrix
| AC | Test | Lớp |
|---|---|---|
| 1, 2 | `auth.test.ts` (có/không `TRUST_PROXY`) | unit |
| 3, 4 | `test/auth.e2e-spec.ts` | supertest e2e |
| 5 | form test / đọc lại mã lỗi `rate` | component |
| 6 | `test/auth.e2e-spec.ts` (token hết hạn bị xoá sau đăng nhập) | supertest e2e |
| 7 | `test/progress.e2e-spec.ts` | supertest e2e |
| 8 | `store.test.ts` (snapshot đổi khi reset bộ rỗng), `SyncStatus.test.tsx` (forget còn sau push, gửi ở push sau) | unit + component |
| 9 | `src/mailer.spec.ts` (có/không `SMTP_URL`, transport giả) | unit |
| 10 | `npm run check` BE | — |

§7.2: thời gian (cửa sổ limiter, token hết hạn) có test; đa tab: AC-8 dùng chung localStorage nên tab khác reset cũng làm snapshot đổi; offline: push lỗi giữ nguyên dữ liệu (không đổi). Dữ liệu cũ: không đổi định dạng.

## Phân công
Codex: AC-3, 4, 6, 7, 9 (`kotoba-be/src/**`, `kotoba-be/test/**`). Claude: AC-1, 2, 5, 8, 10, ADR 012, chạy test và E2E.

## Review
- Gate BE: `npm run check` xanh: 64 unit, 49 e2e, 36 content. Coverage 31.72 / 36.8 / 35.18 / 31.67 (stmt / branch / func / line), ngưỡng nâng lên 31 / 35 / 34 / 30 (AC-10).
- Gate FE: lint, typecheck, 708 test xanh, lib coverage 98.33% stmt / 96.96% branch / 98.56% line. E2E: 268/268 (chạy lại sau khi sửa, trên mã cuối cùng).
- Codex viết AC-3, 4, 6, 7, 9 rồi review read-only. Lần đầu nêu 4 điểm, lần hai (sau khi sửa): không có gì.
  - Cao: limiter bị race. `blocked()` chạy trước scrypt, `hit()` sau, nên một loạt request song song đều lọt. Sửa: mọi route `hit()` trước `await` đầu tiên, thành công thì `undo()` đúng lần hit đó. Test e2e "holds the limits against parallel attempts" (8 lần đổi mật khẩu sai song song → 5×401 + 3×429; reset và login tương tự) và "a right password does not use up the limit".
  - Cao: `resetPassword` ở FE không gửi IP, nên mọi reset dùng chung một bucket của IP server FE. Sửa: gửi `ip()` như login, có test.
  - Vừa: test AC-8 chỉ kiểm `snapshot()`. Thêm `SyncStatus.test.tsx` chạy hết luồng: push đang bay, reset, push trả về, forget còn và được gửi ở push sau. Đã thử bỏ `SYNC_KEY` khỏi `snapshot()`: test đỏ.
  - Vừa: không có form test cho AC-5. Giữ nguyên theo matrix ("đọc lại mã lỗi `rate`"): `rate` có trong `ErrorCode`, `account.ts` có câu vi/en, `auth.test.ts` kiểm cả ba action trả `rate`.
- `/auth/forgot` không `await` việc gửi mail: gửi qua SMTP chậm hơn hẳn nhánh email không tồn tại, nên chờ thì lộ email nào có tài khoản qua thời gian trả lời. Lỗi gửi vẫn được log.
- Codex `exec` treo khi stdin mở; chạy với `< /dev/null`.
- SMTP thật chưa thử: cần người dùng cấp `SMTP_URL` (không tự đăng ký dịch vụ).
