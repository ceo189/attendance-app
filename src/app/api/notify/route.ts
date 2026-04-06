import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { type, email, time, location } = await req.json();

  const messageText = buildMessage(type, email, time, location);

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

function buildMessage(
  type: string,
  email: string,
  time: string,
  location?: string
): string {
  const timeStr = new Date(time).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  switch (type) {
    case "clock_in":
      return `[근태] 출근 - ${email}\n시간: ${timeStr}${location ? `\n장소: ${location}` : ""}`;
    case "clock_out":
      return `[근태] 퇴근 - ${email}\n시간: ${timeStr}${location ? `\n장소: ${location}` : ""}`;
    case "leave_request":
      return `[휴가] 휴가 신청 - ${email}\n${location ?? ""}\n시간: ${timeStr}`;
    default:
      return `[근태] ${type} - ${email}\n시간: ${timeStr}`;
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
