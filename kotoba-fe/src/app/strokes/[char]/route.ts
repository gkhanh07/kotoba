// Phase 41k: one kanji's KanjiVG stroke paths for the session card, through the Next server (the browser never calls kotoba-be).
import { getKanjiDetail } from "@/lib/content";

export async function GET(_: Request, ctx: RouteContext<"/strokes/[char]">) {
  const { char } = await ctx.params;
  const k = await getKanjiDetail(decodeURIComponent(char));
  return Response.json(k?.paths ?? [], { headers: { "cache-control": "public, max-age=86400" } });
}
