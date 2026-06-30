import { NextRequest, NextResponse } from "next/server";
import { runReminderCheck, runMonthlySummary } from "@/lib/reminder-scheduler";

// This endpoint is called by cron-job.org:
// - mode=monthly  → 1st of each month at 08:00 (full month overview)
// - mode=check    → daily at 08:00 (7-day and 1-day advance notices only)

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode = req.nextUrl.searchParams.get("mode") ?? "check";

  try {
    if (mode === "monthly") {
      await runMonthlySummary();
      return NextResponse.json({ ok: true, mode: "monthly" });
    } else {
      const result = await runReminderCheck();
      return NextResponse.json({ ok: true, mode: "check", ...result });
    }
  } catch (err) {
    console.error("Reminder check error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
