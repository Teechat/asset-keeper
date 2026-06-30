import {
  messagingApi,
  webhook,
  FlexMessage,
  FlexBubble,
  FlexComponent,
} from "@line/bot-sdk";
import type { AssetWithReminder } from "./database.types";
import { formatDueDate, getDaysUntilDue } from "./reminder-scheduler";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

// Verify webhook signature
export async function verifySignature(
  body: string,
  signature: string
): Promise<boolean> {
  const crypto = await import("crypto");
  const hmac = crypto.createHmac("SHA256", channelSecret);
  hmac.update(body);
  const digest = hmac.digest("base64");
  return digest === signature;
}

// Send a text message to a user
export async function pushText(lineUserId: string, text: string) {
  return lineClient.pushMessage({
    to: lineUserId,
    messages: [{ type: "text", text }],
  });
}

// Category emoji map
export const CATEGORY_EMOJI: Record<string, string> = {
  car: "🚗",
  home: "🏠",
  health: "💊",
  finance: "💰",
  insurance: "🛡️",
  other: "📦",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "📦";
}

// Build a Flex Message card for a single asset reminder
function buildAssetBubble(
  asset: AssetWithReminder,
  reminder: AssetWithReminder["reminders"][0],
  lineUserId: string
): FlexBubble {
  const daysUntil = getDaysUntilDue(reminder.due_date);
  const urgencyColor =
    daysUntil <= 7 ? "#D32F2F" : daysUntil <= 30 ? "#F57C00" : "#388E3C";
  const urgencyLabel =
    daysUntil <= 0
      ? "⚠️ OVERDUE"
      : daysUntil === 1
        ? "Due tomorrow!"
        : daysUntil <= 7
          ? `${daysUntil} days left`
          : `${daysUntil} days`;

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: `${getCategoryEmoji(asset.category)} ${asset.category}`,
          size: "xs",
          color: "#888888",
          flex: 1,
        },
        {
          type: "text",
          text: urgencyLabel,
          size: "xs",
          color: urgencyColor,
          weight: "bold",
          align: "end",
        },
      ],
      paddingBottom: "none",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: asset.name,
          weight: "bold",
          size: "md",
          wrap: true,
        },
        {
          type: "text",
          text: `📅 ${formatDueDate(reminder.due_date)}`,
          size: "sm",
          color: "#555555",
          margin: "sm",
        },
        ...(asset.notes
          ? [
              {
                type: "text" as const,
                text: asset.notes,
                size: "xs" as const,
                color: "#888888",
                wrap: true,
                margin: "sm" as const,
              } as FlexComponent,
            ]
          : []),
      ],
      paddingAll: "md",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "✅ Done",
            data: `action=done&reminderId=${reminder.id}&assetId=${asset.id}`,
            displayText: `Mark done: ${asset.name}`,
          },
          style: "primary",
          color: "#06C755",
          height: "sm",
          flex: 1,
        },
        {
          type: "button",
          action: {
            type: "uri",
            label: "✏️ Edit",
            uri: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?uid=${lineUserId}&edit=${asset.id}`,
          },
          style: "secondary",
          height: "sm",
          flex: 1,
          margin: "sm",
        },
      ],
      paddingAll: "md",
    },
  };
}

// Send a reminder carousel for multiple assets
export async function pushReminders(
  lineUserId: string,
  assets: AssetWithReminder[]
) {
  const bubbles: FlexBubble[] = [];

  for (const asset of assets) {
    for (const reminder of asset.reminders) {
      if (!reminder.is_completed) {
        bubbles.push(buildAssetBubble(asset, reminder, lineUserId));
      }
    }
  }

  if (bubbles.length === 0) return;

  // LINE allows max 12 bubbles in a carousel
  const chunks = chunkArray(bubbles, 12);

  for (const chunk of chunks) {
    const message: FlexMessage =
      chunk.length === 1
        ? { type: "flex", altText: "Maintenance Reminder", contents: chunk[0] }
        : {
            type: "flex",
            altText: `${chunk.length} Maintenance Reminders`,
            contents: { type: "carousel", contents: chunk },
          };

    await lineClient.pushMessage({ to: lineUserId, messages: [message] });
  }
}

// Build the welcome message for new followers
export function buildWelcomeMessage(displayName: string): FlexMessage {
  return {
    type: "flex",
    altText: `Welcome to AssetKeeper, ${displayName}!`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🔧 AssetKeeper",
            weight: "bold",
            size: "xl",
            color: "#06C755",
          },
          {
            type: "text",
            text: `สวัสดี ${displayName}! / Hi ${displayName}!`,
            margin: "md",
            wrap: true,
          },
          {
            type: "text",
            text: "Track all your personal asset maintenance in one place — car, insurance, home, health, and more.",
            margin: "sm",
            size: "sm",
            color: "#555555",
            wrap: true,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "Commands / คำสั่ง",
            weight: "bold",
            margin: "lg",
          },
          {
            type: "text",
            text:
              "/add — Add new asset\n" +
              "/list — Show upcoming reminders\n" +
              "/today — Tasks due in 7 days\n" +
              "/done — Mark task complete\n" +
              "/dashboard — Open dashboard\n\n" +
              "Auto reminders:\n" +
              "• 1st of month — full monthly overview\n" +
              "• 7 days before — advance notice\n" +
              "• 1 day before — final reminder",
            size: "sm",
            margin: "sm",
            wrap: true,
            color: "#333333",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "📋 Open Dashboard",
              uri: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            },
            style: "primary",
            color: "#06C755",
          },
        ],
      },
    },
  };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export type { FlexMessage };
