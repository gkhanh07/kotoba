<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Màu: không bao giờ viết hex thẳng vào component

Mọi màu của Kotoba nằm trong `:root` ở `src/app/globals.css`. Component chỉ
được dùng `var(--...)`. Cần một sắc độ mới → dùng `color-mix(in srgb, var(--x)
N%, var(--night))` chứ đừng đẻ hex mới.

Bảng màu, dùng đúng nấc gần nhất — đừng thêm nấc:

- Nền, tối dần: `--night` `--asphalt` `--wet`
- Trời hero, xanh giờ vàng đổ xuống đêm: `--sky-1` `--sky-2` `--sky-3`
- Đường kẻ / viền, 3 nấc: `--rule-dim` `--rule` `--rule-strong`
- Chữ, 4 nấc sáng xuống mờ: `--chalk` `--silver` `--silver-dim` `--silver-mute`
- Đèn neon: mỗi tông là **màu ống + lõi nóng** — `--amber`/`--amber-core`,
  `--neon`/`--neon-soft`/`--neon-core`, `--cool`/`--cool-core`.
  Quầng sáng đi kèm: `--glow-amber` `--glow-neon` `--glow-cool`.

Trước khi thêm biến mới: mở `globals.css`, tìm nấc gần nhất. Chênh dưới ~10%
mỗi kênh thì đó là màu cũ viết khác đi, không phải màu mới. Trang này từng có
49 hex rời rạc cho ~8 màu thật.

Không còn ngoại lệ nào. `Skyline()` trong `src/app/page.tsx` từng giữ hex thẳng
trong SVG; nay tô bằng class CSS trỏ về token, vì thuộc tính SVG không nhận
`var(--…)`. Bốn hex cuối hoá ra đều là màu cũ viết khác đi, không phải màu mới.

Nhờ vậy light mode sau này chỉ là một block `[data-theme="light"]` định nghĩa
lại các biến trên, không phải sửa từng file.
