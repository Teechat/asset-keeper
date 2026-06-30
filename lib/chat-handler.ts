import { messagingApi } from "@line/bot-sdk";
import { supabaseAdmin } from "./supabase";
import { lineClient, pushText, buildWelcomeMessage, pushReminders } from "./line";
import { calcNextDueDate, getDaysUntilDue, formatDueDate } from "./reminder-scheduler";
import { format, addDays } from "date-fns";
import type { AssetWithReminder } from "./database.types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Commands accepted in both Thai and English
const COMMANDS: Record<string, string> = {
  "/add": "add",
  "/เพิ่ม": "add",
  "/list": "list",
  "/รายการ": "list",
  "/today": "today",
  "/วันนี้": "today",
  "/done": "done",
  "/เสร็จ": "done",
  "/delete": "delete",
  "/ลบ": "delete",
  "/dashboard": "dashboard",
  "/แดชบอร์ด": "dashboard",
  "/help": "help",
  "/ช่วยเหลือ": "help",
};

// Ensure a user exists in the DB; return their UUID
async function ensureUser(
  lineUserId: string,
  displayName: string,
  pictureUrl?: string
): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({ line_user_id: lineUserId, display_name: displayName, picture_url: pictureUrl ?? null })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create user: " + error?.message);
  return created.id;
}

// Handle a LINE Follow event (user adds the OA)
export async function handleFollow(event: messagingApi.FollowEvent) {
  const lineUserId = event.source.userId!;
  const profile = await lineClient.getProfile(lineUserId);

  await ensureUser(lineUserId, profile.displayName, profile.pictureUrl);

  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [buildWelcomeMessage(profile.displayName)],
  });
}

// Handle incoming text messages
export async function handleMessage(event: messagingApi.MessageEvent) {
  if (event.message.type !== "text") return;

  const lineUserId = event.source.userId!;
  const text = event.message.text.trim();
  const lower = text.toLowerCase();

  // Get first word to identify command
  const firstWord = lower.split(/\s+/)[0];
  const command = COMMANDS[firstWord];

  // Ensure user exists
  const profile = await lineClient.getProfile(lineUserId);
  await ensureUser(lineUserId, profile.displayName, profile.pictureUrl);

  switch (command) {
    case "add":
      await handleAdd(event);
      break;
    case "list":
      await handleList(event, lineUserId);
      break;
    case "today":
      await handleToday(event, lineUserId);
      break;
    case "dashboard":
      await handleDashboard(event);
      break;
    case "help":
      await handleHelp(event);
      break;
    default:
      // Not a command — send hint
      await lineClient.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text:
              "I didn't understand that. ไม่เข้าใจครับ\n\n" +
              "Try: /add, /list, /today, /dashboard, /help\n" +
              "ลอง: /เพิ่ม, /รายการ, /วันนี้, /แดชบอร์ด, /ช่วยเหลือ",
            quickReply: {
              items: [
                { type: "action", action: { type: "message", label: "➕ Add", text: "/add" } },
                { type: "action", action: { type: "message", label: "📋 List", text: "/list" } },
                {
                  type: "action",
                  action: { type: "uri", label: "📊 Dashboard", uri: `${APP_URL}/dashboard?uid=${lineUserId}` },
                },
              ],
            },
          },
        ],
      });
  }
}

// /add command — send the LIFF add form link
async function handleAdd(event: messagingApi.MessageEvent) {
  const lineUserId = event.source.userId!;
  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text:
          "➕ Add a new asset maintenance reminder:\n\n" +
          "เพิ่มรายการบำรุงรักษาใหม่:\n\n" +
          "Tap the button below to open the form 👇",
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "uri",
                label: "📋 Open Add Form",
                uri: `${APP_URL}/dashboard?uid=${lineUserId}&action=add`,
              },
            },
          ],
        },
      },
    ],
  });
}

// /list command — show next 10 upcoming reminders
async function handleList(event: messagingApi.MessageEvent, lineUserId: string) {
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (!userRow) {
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: "Please type /add first to add your first asset." }],
    });
    return;
  }

  const { data: assets } = await supabaseAdmin
    .from("assets")
    .select("*, reminders(*)")
    .eq("user_id", userRow.id)
    .eq("reminders.is_completed", false)
    .order("reminders.due_date", { foreignTable: "reminders", ascending: true })
    .limit(10);

  if (!assets || assets.length === 0) {
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text:
            "No upcoming reminders! ยังไม่มีรายการ 🎉\n\nType /add to add your first asset.",
          quickReply: {
            items: [
              {
                type: "action",
                action: { type: "uri", label: "➕ Add Asset", uri: `${APP_URL}/dashboard?action=add` },
              },
            ],
          },
        },
      ],
    });
    return;
  }

  // Build text list
  const lines: string[] = ["📋 Upcoming Reminders / รายการที่จะถึง:\n"];
  for (const asset of assets as unknown as AssetWithReminder[]) {
    if (!asset.reminders?.length) continue;
    const r = asset.reminders[0];
    const days = getDaysUntilDue(r.due_date);
    const label =
      days < 0
        ? `⚠️ ${Math.abs(days)}d overdue`
        : days === 0
          ? "⚠️ DUE TODAY"
          : `in ${days}d`;
    lines.push(`• ${asset.name} [${asset.category}]\n  📅 ${formatDueDate(r.due_date)} (${label})`);
  }
  lines.push("\nType /dashboard to see all assets");

  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: "text", text: lines.join("\n") }],
  });
}

// /today command — tasks due within 7 days
async function handleToday(event: messagingApi.MessageEvent, lineUserId: string) {
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (!userRow) {
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: "No assets yet. Type /add to get started." }],
    });
    return;
  }

  const { data: reminders } = await supabaseAdmin
    .from("reminders")
    .select("*, assets!inner(*)")
    .eq("assets.user_id", userRow.id)
    .eq("is_completed", false)
    .lte("due_date", format(addDays(new Date(), 7), "yyyy-MM-dd"))
    .order("due_date");

  if (!reminders || reminders.length === 0) {
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: "✅ No tasks due in the next 7 days. ไม่มีรายการในสัปดาห์นี้" }],
    });
    return;
  }

  const lines = reminders.map((r) => {
    const asset = r.assets as unknown as { name: string; category: string };
    const days = getDaysUntilDue(r.due_date);
    const label =
      days <= 0 ? "⚠️ OVERDUE" : days === 1 ? "tomorrow" : `in ${days} days`;
    return `• ${asset.name} — ${formatDueDate(r.due_date)} (${label})`;
  });

  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: `📅 Next 7 days / 7 วันข้างหน้า:\n\n${lines.join("\n")}`,
      },
    ],
  });
}

// /dashboard command — send LIFF link
async function handleDashboard(event: messagingApi.MessageEvent) {
  const lineUserId = event.source.userId!;
  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: "📊 Open your dashboard: / เปิดแดชบอร์ด:",
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "uri",
                label: "Open Dashboard",
                uri: `${APP_URL}/dashboard?uid=${lineUserId}`,
              },
            },
          ],
        },
      },
    ],
  });
}

// /help command
async function handleHelp(event: messagingApi.MessageEvent) {
  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text:
          "🔧 AssetKeeper Commands:\n\n" +
          "/add • /เพิ่ม — Add new asset\n" +
          "/list • /รายการ — Upcoming reminders\n" +
          "/today • /วันนี้ — Due in 7 days\n" +
          "/dashboard • /แดชบอร์ด — Open full dashboard\n" +
          "/help • /ช่วยเหลือ — Show this help\n\n" +
          "You'll get:\n" +
          "• 📅 Monthly overview on the 1st — full picture of the month\n" +
          "• ⏰ 7 days before due — advance reminder\n" +
          "• 🔔 1 day before due — final reminder",
      },
    ],
  });
}

// Handle postback events (e.g., "Done" button taps)
export async function handlePostback(event: messagingApi.PostbackEvent) {
  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");
  const reminderId = params.get("reminderId");
  const assetId = params.get("assetId");

  if (action === "done" && reminderId && assetId) {
    // Get the reminder
    const { data: reminder } = await supabaseAdmin
      .from("reminders")
      .select("*")
      .eq("id", reminderId)
      .single();

    if (!reminder) {
      await lineClient.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: "Reminder not found." }],
      });
      return;
    }

    // Mark as completed
    await supabaseAdmin
      .from("reminders")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", reminderId);

    // Schedule next occurrence if recurrence is set
    if (reminder.recurrence !== "none") {
      const nextDue = calcNextDueDate(
        reminder.due_date,
        reminder.recurrence,
        reminder.recurrence_value,
        reminder.recurrence_unit
      );

      if (nextDue) {
        await supabaseAdmin.from("reminders").insert({
          asset_id: assetId,
          due_date: nextDue,
          recurrence: reminder.recurrence,
          recurrence_value: reminder.recurrence_value,
          recurrence_unit: reminder.recurrence_unit,
          advance_notice_days: reminder.advance_notice_days,
          is_completed: false,
        });
      }

      const { data: asset } = await supabaseAdmin
        .from("assets")
        .select("name")
        .eq("id", assetId)
        .single();

      await lineClient.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text:
              `✅ "${asset?.name}" marked as done!\n\n` +
              (nextDue
                ? `Next reminder scheduled for ${formatDueDate(nextDue)}.`
                : "No recurring schedule — task removed."),
          },
        ],
      });
    }
  }
}
