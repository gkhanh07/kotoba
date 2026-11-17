// Download of everything the account holds about the learner's study (phase 21). The Next server
// fetches it from kotoba-be with the session cookie's token, so the browser never calls kotoba-be.
import { redirect } from "next/navigation";
import { exportProgress } from "@/lib/auth";

const FILENAME = "kotoba-export.json";

export async function GET() {
  let data: unknown;
  try {
    data = await exportProgress();
  } catch (e) {
    // kotoba-be down or failing: a plain error, never a broken or empty file saved as the export.
    console.error("export failed", e);
    return new Response("Export unavailable, try again later.", { status: 503, headers: { "cache-control": "no-store" } });
  }
  if (data === null) redirect("/login?next=/settings");
  return new Response(JSON.stringify(data, null, 1), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${FILENAME}"`,
      "cache-control": "no-store",
    },
  });
}
