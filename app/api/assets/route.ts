import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/assets?lineUserId=xxx — list assets for a user
export async function GET(req: NextRequest) {
  const lineUserId = req.nextUrl.searchParams.get("lineUserId");
  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (!user) {
    return NextResponse.json({ assets: [] });
  }

  const { data: assets, error } = await supabaseAdmin
    .from("assets")
    .select("*, reminders(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: assets ?? [] });
}

// POST /api/assets — create a new asset + reminder
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    lineUserId,
    name,
    category,
    item_name,
    subcategory,
    notes,
    dueDate,
    recurrence = "none",
    recurrenceValue = 1,
    recurrenceUnit = "years",
    advanceNoticeDays = [7, 1],
  } = body;

  if (!lineUserId || !name || !category || !dueDate) {
    return NextResponse.json(
      { error: "lineUserId, name, category, dueDate are required" },
      { status: 400 }
    );
  }

  // Ensure user exists
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found. Please chat /start first." }, { status: 404 });
  }

  // Create asset
  const { data: asset, error: assetError } = await supabaseAdmin
    .from("assets")
    .insert({ user_id: user.id, name, category, item_name: item_name ?? null, subcategory: subcategory ?? null, notes: notes ?? null })
    .select()
    .single();

  if (assetError || !asset) {
    return NextResponse.json({ error: assetError?.message }, { status: 500 });
  }

  // Create reminder
  const { data: reminder, error: reminderError } = await supabaseAdmin
    .from("reminders")
    .insert({
      asset_id: asset.id,
      due_date: dueDate,
      recurrence,
      recurrence_value: recurrenceValue,
      recurrence_unit: recurrenceUnit,
      advance_notice_days: advanceNoticeDays,
      is_completed: false,
    })
    .select()
    .single();

  if (reminderError) {
    return NextResponse.json({ error: reminderError.message }, { status: 500 });
  }

  return NextResponse.json({ asset, reminder }, { status: 201 });
}
