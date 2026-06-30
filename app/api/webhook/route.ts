import { NextRequest, NextResponse } from "next/server";
import { messagingApi } from "@line/bot-sdk";
import { verifySignature } from "@/lib/line";
import {
  handleFollow,
  handleMessage,
  handlePostback,
} from "@/lib/chat-handler";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  const isValid = await verifySignature(body, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as { events: messagingApi.WebhookEvent[] };

  // Process events in parallel (but don't let one failure block others)
  await Promise.allSettled(
    payload.events.map(async (event) => {
      try {
        if (event.type === "follow") {
          await handleFollow(event as messagingApi.FollowEvent);
        } else if (event.type === "message") {
          await handleMessage(event as messagingApi.MessageEvent);
        } else if (event.type === "postback") {
          await handlePostback(event as messagingApi.PostbackEvent);
        }
      } catch (err) {
        console.error(`Error handling event type=${event.type}:`, err);
      }
    })
  );

  return NextResponse.json({ ok: true });
}

// LINE needs to verify the webhook URL — GET must return 200
export async function GET() {
  return NextResponse.json({ ok: true });
}
