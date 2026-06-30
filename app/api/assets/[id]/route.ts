import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calcNextDueDate } from "@/lib/reminder-scheduler";

// PATCH /api/assets/[id]
// Body: { name, category, notes }  → update asset fields
// Body: { action: "done", reminderId }  → mark reminder complete + reschedule
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "done" && body.reminderId) {
    const { data: reminder, error: fetchErr } = await supabaseAdmin
      .from("reminders")
      .select("*")
      .eq("id", body.reminderId)
      .single();

    if (fetchErr || !reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    // Mark current reminder as done
    await supabaseAdmin
      .from("reminders")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", body.reminderId);

    // Auto-create next occurrence
    if (reminder.recurrence !== "none") {
      const nextDue = calcNextDueDate(
        reminder.due_date,
        reminder.recurrence,
        reminder.recurrence_value,
        reminder.recurrence_unit
      );

      if (nextDue) {
        await supabaseAdmin.from("reminders").insert({
          asset_id: id,
          due_date: nextDue,
          recurrence: reminder.recurrence,
          recurrence_value: reminder.recurrence_value,
          recurrence_unit: reminder.recurrence_unit,
          advance_notice_days: reminder.advance_notice_days,
          is_completed: false,
        });
      }

      return NextResponse.json({ ok: true, nextDue });
    }

    return NextResponse.json({ ok: true });
  }

  // Default: update asset fields
  const { name, category, item_name, subcategory, notes } = body;
  const { data, error } = await supabaseAdmin
    .from("assets")
    .update({ name, category, item_name: item_name ?? null, subcategory: subcategory ?? null, notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data });
}

// DELETE /api/assets/[id] — cascade deletes reminders via FK
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("assets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
