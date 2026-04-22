import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, email, name, team, title, time, location } = await req.json();

  const messageText = buildMessage(type, { email, name, team, title }, time, location);

  const results = await Promise.allSettled([
    sendSlack(messageText),
    sendTelegram(messageText),
  ]);

  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r) => (r as PromiseRejectedResult).reason);

  if (errors.length > 0) {
    console.error("Notification errors:", errors);
  }

  return NextResponse.json({ ok: true });
}

const LOCATION_LABELS: Record<string, string> = {
  office: "사무실",
  outside: "외부",
  remote: "재택",
};

function buildProfile(profile: {
  email: string;
  name?: string;
  team?: string;
  title?: string;
}): string {
  const displayName = profile.name || profile.email.split("@")[0];
  const parts = [profile.team, profile.title].filter(Boolean);
  if (parts.length > 0) {
    return `${displayName} (${parts.join(" / ")})`;
  }
  return displayName;
}

function buildMessage(
  type: string,
  profile: { email: string; name?: string; team?: string; title?: string },
  time: string,
  location?: string
): string {
  const timeStr = new Date(time).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const who = buildProfile(profile);
  const loc = LOCATION_LABELS[location ?? ""] || location || "";

  switch (type) {
    case "clock_in":
      return `🟢 출근  |  ${who}\n⏰ ${timeStr}${loc ? `  📍 ${loc}` : ""}`;
    case "clock_out":
      return `🔴 퇴근  |  ${who}\n⏰ ${timeStr}${loc ? `  📍 ${loc}` : ""}`;
    case "leave_request":
      return `🏖️ 휴가 신청  |  ${who}\n${location ?? ""}`;
    default:
      return `📋 ${type}  |  ${who}\n⏰ ${timeStr}`;
  }
}

async function sendSlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status}`);
  }
}

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API failed: ${res.status}`);
  }
}
