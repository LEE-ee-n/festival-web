import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  getTicketUrlAlerts,
  type TicketUrlAlert,
  type TicketUrlAlertFestival,
  type TicketUrlAlertRound,
} from "@/lib/festivals/ticketUrlAlert";
import type { Database } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character] ?? character;
  });
}

function formatOpenAt(openAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(openAt));
}

function toKstDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(now);
}

function buildEmailHtml(alerts: TicketUrlAlert[]) {
  const rows = alerts
    .map(
      (alert) => `
        <li style="margin: 0 0 18px;">
          <strong>${escapeHtml(alert.festival_name)}</strong><br />
          ${escapeHtml(alert.round_name)} · ${escapeHtml(formatOpenAt(alert.open_at ?? ""))}<br />
          판매처: ${escapeHtml(alert.ticket_platform ?? "미정")}<br />
          <a href="https://festibom.com/admin/festivals/${alert.festival_id}/lineup">관리 화면 열기</a>
        </li>`,
    )
    .join("");

  return `<h2>티켓 URL 확인 필요 ${alerts.length}건</h2><p>오픈 예정이지만 예매 URL이 비어 있는 유료 티켓입니다.</p><ul>${rows}</ul>`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  const recipientEmail = process.env.TICKET_ALERT_RECIPIENT_EMAIL;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !resendApiKey ||
    !resendFromEmail ||
    !recipientEmail
  ) {
    return NextResponse.json({ error: "Ticket alert configuration is missing." }, { status: 500 });
  }

  const now = new Date();
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data: ticketRounds, error: ticketRoundsError } = await supabase
    .from("festival_ticket_rounds")
    .select("id, festival_id, round_name, open_at, ticket_platform, ticket_url")
    .gt("open_at", now.toISOString());

  if (ticketRoundsError) {
    return NextResponse.json({ error: ticketRoundsError.message }, { status: 500 });
  }

  const festivalIds = [...new Set((ticketRounds ?? []).map((ticketRound) => ticketRound.festival_id))];

  if (festivalIds.length === 0) {
    return NextResponse.json({ sent: false, alerts: 0 });
  }

  const { data: festivals, error: festivalsError } = await supabase
    .from("festivals")
    .select("id, name, end_date, price_type")
    .in("id", festivalIds);

  if (festivalsError) {
    return NextResponse.json({ error: festivalsError.message }, { status: 500 });
  }

  const alerts = getTicketUrlAlerts({
    festivals: (festivals ?? []) as TicketUrlAlertFestival[],
    now,
    ticketRounds: (ticketRounds ?? []) as TicketUrlAlertRound[],
    today: toKstDate(now),
  });

  if (alerts.length === 0) {
    return NextResponse.json({ sent: false, alerts: 0 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: resendFromEmail,
      html: buildEmailHtml(alerts),
      subject: `[페스티봄] 티켓 URL 확인 필요 ${alerts.length}건`,
      to: [recipientEmail],
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Ticket alert email delivery failed." }, { status: 502 });
  }

  return NextResponse.json({ sent: true, alerts: alerts.length });
}
