# Phase 42: Hoàn thiện thiết kế — token, sàn chữ, a11y, ảnh chụp mọi trang

Nguồn: `docs/plan/PLAN.md` mục Phase 42 và BACKLOG "Unfinished design work". Phase cuối của đợt hoàn thiện N5–N3.

## AC
- AC-1 Không còn `rgba()` thô trong CSS: màu trong suốt là `color-mix(in srgb, var(--token) N%, transparent)`. Ngoại lệ duy nhất là stencil mask đen trên biển hiệu hero (`page.module.css`, không phải màu hiển thị). `designSystem.test.ts` quét mọi `.css`.
- AC-2 Mọi `font-size` trong mọi stylesheet ≥ 13px (`--fs-meta`). Ngoại lệ là đơn vị viewBox SVG hiển thị lớn hơn (vòng phút dashboard ≈ 16,3px; số nét 8/109 ở khung 11,25rem ≈ 13,2px) và `em` theo cỡ cha (`kbd` trang chủ 0.88em ≈ 14px), liệt kê trong test kèm phép tính.
- AC-3 Lighthouse Accessibility ≥ 95 trên mọi route.
- AC-4 32 route ở 360/768/1440: axe sạch, không cuộn ngang (`e2e/screens.spec.ts`); `SCREENS=1` ghi ảnh toàn trang vào `docs/screenshots/<rộng>/` (gitignore, ~20 MB).
- AC-5 Phần còn lại của bản critique `/` được xử lý hoặc ghi lý do.
- AC-6 `DESIGN.md` khớp bản đã ship (điều hướng 5 tab, thanh chỉ số, hiệu ứng, thứ tự nét, quy tắc color-mix và sàn chữ).

## Kết quả
- AC-1: `globals.css` và `page.module.css` đổi hết sang `color-mix`, tông pha dùng `color-mix` lồng. Ảnh hero 1440 trước/sau giống nhau.
- AC-2: sửa `0.8rem` (thanh chỉ số, trạng thái đồng bộ, `kbd` ngữ pháp, kana), `.65rem` (nhãn heatmap), `.75rem` (Hán Việt kanji) sang `var(--fs-meta)`.
- AC-3: Accessibility 100 trên cả 32 route (3 route qua DevTools MCP, 29 qua Lighthouse CLI, giả lập mobile). Best Practices và SEO 100 trên các route đo bằng MCP.
- AC-4: 32/32 xanh, ảnh chụp lại sau khi sửa. `/onboarding` và `/settings` đăng ký trước rồi mới chụp; mọi route trừ `/login` bị fail nếu rơi về `/login`.

## Bản critique `/` — xử lý
| Mục | Kết quả |
|---|---|
| Câu chữ "đã thuộc" trung thực, mẫu số, dashboard, "Sắp có" ở Kanji, footer | Đã xong ở các phase trước |
| Brand 34px, VI/EN 32px nhỏ hơn 44px | Không đổi: đạt WCAG 2.5.8 AA (24px) và Lighthouse target-size |
| Nút amber thứ hai ở cuối trang khách | Không đổi: CTA cuối nằm ở khung nhìn khác CTA hero, mỗi khung nhìn vẫn một hành động amber |
| `h1` hero nằm ngoài `<main>` | Để BACKLOG: `section.hero` chứa thanh điều hướng; bọc `main` sẽ đưa nav vào main, tách bar ra làm hỏng lớp trời. axe và Lighthouse vẫn đạt |
| DESIGN.md: luật "không streak/XP" mâu thuẫn thanh chỉ số 41i | Sửa luật: streak/XP chỉ ở thanh chỉ số và /progress |
| BACKLOG: "hai heading Glossary" | Không còn, file chỉ một `## Glossary` |

## Review Codex — xử lý
| Mục | Kết quả |
|---|---|
| P2 `screens.spec` chụp `/login` thay cho `/onboarding`, `/settings` | Sửa: đăng ký trong test, chặn redirect về `/login` |
| P2 Số nét chỉ ≈ 9,3px (khung 8rem), ngoại lệ trong test che lỗi | Sửa: khung nét 8rem → 11,25rem, số nét ≈ 13,2px; chú thích test ghi phép tính |
| P2 `em` quy về 16px gây lọt | Sửa: mọi `em` < 1 phải có trong danh sách đã kiểm tay |
| P3 Regex `rgba`/`font-size` bỏ lọt chữ hoa, `font-size :` | Sửa: cờ `i`, `\s*:` |
| P3 Quầng sáng tiêu đề, `--sky-glow`, halo bạc, điểm sáng mặt đường lệch RGB | Chấp nhận, xem Lệch |

## Lệch
- Đổi `rgba()` sang `color-mix` từ token làm vài màu khí quyển dịch về token gần nhất: quầng 60px của tiêu đề (60,110,255) → `--cool` (92,184,255), quầng amber (255,140,20) → `--amber`, `--sky-glow`, halo bạc và điểm sáng mặt đường bớt sắc lam. Giữ nguyên alpha. Cố ý theo luật One Palette (không màu ngoài token); ảnh hero 1440 trước/sau gần như không phân biệt. Muốn lấy lại sắc lam đậm thì thêm token mới, không quay lại `rgba`.

## Gate
FE `npm run check`: 830 unit, build ✓. e2e toàn bộ: 360 passed, 4 lỗi ở 2 spec cũ từ 41g/41i (`export` đối chiếu số kana trên Today đã bỏ → chuyển sang `/progress`; `grammar-practice` trùng link "Luyện tập" với tab nav → giới hạn trong `main`), sửa xong chạy lại 48/48. BE: 76 unit, 55 e2e, 44 content ✓.
