import { supabaseAdmin } from "./supabase";
import { pushReminders, pushText } from "./line";
import type { AssetWithReminder, Recurrence } from "./database.types";
import { addDays, addWeeks, addMonths, addYears, endOfMonth, format, parseISO, differenceInDays } from "date-fns";

export function getDaysUntilDue(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(dueDateStr);
  return differenceInDays(due, today);
}

export function formatDueDate(dueDateStr: string): string {
  const due = parseISO(dueDateStr);
  return format(due, "d MMM yyyy");
}

// Calculate the next due date after completing a reminder
export function calcNextDueDate(
  currentDue: string,
  recurrence: Recurrence,
  recurrenceValue: number,
  recurrenceUnit: "days" | "weeks" | "months" | "years"
): string | null {
  if (recurrence === "none") return null;

  const current = parseISO(currentDue);
  let next: Date;

  if (recurrence === "daily") {
    next = addDays(current, 1);
  } else if (recurrence === "weekly") {
    next = addWeeks(current, 1);
  } else if (recurrence === "monthly") {
    next = addMonths(current, 1);
  } else if (recurrence === "yearly") {
    next = addYears(current, 1);
  } else {
    // custom
    if (recurrenceUnit === "days") next = addDays(current, recurrenceValue);
    else if (recurrenceUnit === "weeks") next = addWeeks(current, recurrenceValue);
    else if (recurrenceUnit === "months") next = addMonths(current, recurrenceValue);
    else next = addYears(current, recurrenceValue);
  }

  return format(next, "yyyy-MM-dd");
}

// Main scheduler function — called by the /api/reminders cron endpoint
export async function runReminderCheck() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all active (non-completed) reminders with their assets and users
  const { data: reminders, error } = await supabaseAdmin
    .from("reminders")
    .select(
      `
      *,
      assets (
        *,
        users ( line_user_id, display_name )
      )
    `
    )
    .eq("is_completed", false)
    .order("due_date", { ascending: true });

  if (error) throw new Error(`Failed to fetch reminders: ${error.message}`);
  if (!reminders || reminders.length === 0) return { sent: 0 };

  // Group reminders by user
  const byUser: Record<
    string,
    { lineUserId: string; assets: AssetWithReminder[] }
  > = {};

  for (const reminder of reminders) {
    const asset = reminder.assets as unknown as AssetWithReminder & {
      users: { line_user_id: string; display_name: string };
    };
    if (!asset?.users?.line_user_id) continue;

    const lineUserId = asset.users.line_user_id;
    const daysUntil = getDaysUntilDue(reminder.due_date);

    // Send if due date falls within an advance notice window
    const shouldSend = reminder.advance_notice_days.some(
      (notice: number) => daysUntil === notice || daysUntil === 0 || daysUntil < 0
    );

    if (!shouldSend) continue;

    if (!byUser[lineUserId]) {
      byUser[lineUserId] = { lineUserId, assets: [] };
    }

    // Find or create the asset entry in byUser
    let assetEntry = byUser[lineUserId].assets.find((a) => a.id === asset.id);
    if (!assetEntry) {
      assetEntry = { ...asset, reminders: [] };
      byUser[lineUserId].assets.push(assetEntry);
    }
    assetEntry.reminders.push({ ...reminder });
  }

  let sent = 0;
  for (const { lineUserId, assets } of Object.values(byUser)) {
    if (assets.length === 0) continue;
    await pushReminders(lineUserId, assets);
    sent++;
  }

  return { sent };
}

// Monthly summary — sent on the 1st of each month
// Shows the complete picture of everything due during the new month
export async function runMonthlySummary() {
  const today = new Date();
  const monthStart = format(today, "yyyy-MM-01");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const monthLabel = format(today, "MMMM yyyy");

  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("id, line_user_id");

  if (error || !users) return;

  for (const user of users) {
    // Tasks due this month
    const { data: thisMonth } = await supabaseAdmin
      .from("reminders")
      .select("*, assets!inner(*)")
      .eq("assets.user_id", user.id)
      .eq("is_completed", false)
      .gte("due_date", monthStart)
      .lte("due_date", monthEnd)
      .order("due_date");

    // Overdue tasks (due before today, still not done)
    const { data: overdue } = await supabaseAdmin
      .from("reminders")
      .select("*, assets!inner(*)")
      .eq("assets.user_id", user.id)
      .eq("is_completed", false)
      .lt("due_date", monthStart)
      .order("due_date");

    // Skip users with nothing to show
    if (
      (!thisMonth || thisMonth.length === 0) &&
      (!overdue || overdue.length === 0)
    ) continue;

    const lines: string[] = [`📅 Monthly Summary — ${monthLabel}\n`];

    if (overdue && overdue.length > 0) {
      lines.push("⚠️ OVERDUE (from previous months):");
      for (const r of overdue) {
        const asset = r.assets as unknown as { name: string; category: string };
        const days = Math.abs(getDaysUntilDue(r.due_date));
        lines.push(`  • ${asset.name} — was due ${formatDueDate(r.due_date)} (${days}d ago)`);
      }
      lines.push("");
    }

    if (thisMonth && thisMonth.length > 0) {
      lines.push(`📋 Due this month (${thisMonth.length} task${thisMonth.length !== 1 ? "s" : ""}):`);
      for (const r of thisMonth) {
        const asset = r.assets as unknown as { name: string; category: string };
        const days = getDaysUntilDue(r.due_date);
        const dayLabel = days === 0 ? "today" : days === 1 ? "tomorrow" : `${days}d`;
        lines.push(`  • ${asset.name} — ${formatDueDate(r.due_date)} (${dayLabel})`);
      }
    }

    lines.push("\nType /list to check anytime • /dashboard for full view");

    await pushText(user.line_user_id, lines.join("\n"));
  }
}
