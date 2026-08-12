import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.2";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue | undefined };

type NotificationEvent = {
  id: number;
  eventType: "artist_appearance" | "festival_update" | "ticket_day_before" | "ticket_ten_minutes_before";
  festivalId: number;
  artistId: number | null;
};

type PushDevice = {
  id: number;
  userId: string;
  token: string;
};

type Delivery = {
  id: number;
  deviceId: number;
  userId: string;
};

type ExpoTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; errorCode: string | null };

const EXPO_SEND_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const PERMANENT_DEVICE_ERROR = "DeviceNotRegistered";

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(value: string): JsonValue {
  return JSON.parse(value) as JsonValue;
}

function readString(value: JsonValue | undefined) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseEvent(value: JsonValue): NotificationEvent | null {
  if (!isObject(value)) return null;
  const id = readNumber(value.id);
  const festivalId = readNumber(value.festival_id);
  const eventType = readString(value.event_type);
  const artistId = value.artist_id === null ? null : readNumber(value.artist_id);
  if (
    id === null ||
    festivalId === null ||
    artistId === undefined ||
    !["artist_appearance", "festival_update", "ticket_day_before", "ticket_ten_minutes_before"].includes(eventType ?? "")
  ) return null;

  return {
    id,
    festivalId,
    artistId,
    eventType: eventType as NotificationEvent["eventType"],
  };
}

function parseExpoTickets(value: JsonValue): ExpoTicket[] {
  if (!isObject(value) || !Array.isArray(value.data)) return [];
  const tickets: ExpoTicket[] = [];
  for (const ticket of value.data) {
    if (!isObject(ticket)) continue;
    const status = readString(ticket.status);
    if (status === "ok") {
      const id = readString(ticket.id);
      if (id) tickets.push({ status, id });
      continue;
    }
    if (status === "error") {
      const details = isObject(ticket.details) ? ticket.details : null;
      tickets.push({
        status,
        message: readString(ticket.message) ?? "Expo Push 발송 실패",
        errorCode: details ? readString(details.error) : null,
      });
    }
  }
  return tickets;
}

function preferenceColumn(eventType: NotificationEvent["eventType"]) {
  if (eventType === "artist_appearance") return "favorite_artist_appearance" as const;
  if (eventType === "festival_update") return "followed_festival_update" as const;
  if (eventType === "ticket_day_before") return "ticket_day_before" as const;
  return "ticket_ten_minutes_before" as const;
}

function notificationText(
  event: NotificationEvent,
  festivalName: string,
  artistName: string | null,
) {
  if (event.eventType === "artist_appearance") {
    return {
      title: `${artistName ?? "좋아하는 아티스트"} 출연 소식`,
      body: `${festivalName} 라인업에 새로 추가됐어요.`,
    };
  }
  if (event.eventType === "festival_update") {
    return { title: `${festivalName} 정보 변경`, body: "라인업 또는 시간표가 변경됐어요." };
  }
  if (event.eventType === "ticket_day_before") {
    return { title: `${festivalName} 티켓 오픈 하루 전`, body: "관심 축제의 티켓 오픈이 내일이에요." };
  }
  return { title: `${festivalName} 티켓 오픈 10분 전`, body: "잠시 후 티켓 예매가 시작돼요." };
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

Deno.serve(async (request: Request) => {
  const cronSecret = Deno.env.get("MOBILE_NOTIFICATION_CRON_SECRET");
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Server configuration missing", { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function disableDevice(deviceId: number) {
    await supabase
      .from("user_push_devices")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", deviceId);
  }

  async function checkReceipts() {
    const { data: pending } = await supabase
      .from("notification_deliveries")
      .select("id, device_id, expo_ticket_id")
      .eq("status", "sent")
      .is("receipt_checked_at", null)
      .not("expo_ticket_id", "is", null)
      .order("created_at")
      .limit(100);

    if (!pending?.length) return 0;
    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: pending.map((item) => item.expo_ticket_id) }),
    });
    if (!response.ok) return 0;
    const parsed = readJson(await response.text());
    if (!isObject(parsed) || !isObject(parsed.data)) return 0;

    let checked = 0;
    for (const delivery of pending) {
      const ticketId = delivery.expo_ticket_id;
      if (!ticketId) continue;
      const receipt = parsed.data[ticketId];
      if (!isObject(receipt)) continue;
      const status = readString(receipt.status);
      const details = isObject(receipt.details) ? receipt.details : null;
      const errorCode = details ? readString(details.error) : null;
      const now = new Date().toISOString();

      if (status === "ok") {
        await supabase.from("notification_deliveries").update({ receipt_checked_at: now }).eq("id", delivery.id);
      } else if (status === "error") {
        await supabase.from("notification_deliveries").update({
          status: "failed",
          failure_code: errorCode,
          failure_reason: readString(receipt.message) ?? "Expo receipt error",
          receipt_checked_at: now,
        }).eq("id", delivery.id);
        if (errorCode === PERMANENT_DEVICE_ERROR) await disableDevice(delivery.device_id);
      }
      checked += 1;
    }
    return checked;
  }

  async function recipientUserIds(event: NotificationEvent) {
    const relation = event.eventType === "artist_appearance"
      ? { table: "user_favorite_artists", column: "artist_id", value: event.artistId }
      : { table: "user_favorite_festivals", column: "festival_id", value: event.festivalId };
    if (relation.value === null) return [];

    const { data: relations, error } = await supabase
      .from(relation.table)
      .select("user_id")
      .eq(relation.column, relation.value);
    if (error) throw error;

    const candidateIds = [...new Set((relations ?? []).map((item) => item.user_id))];
    if (!candidateIds.length) return [];
    const now = new Date().toISOString();
    const { data: entitlements, error: entitlementError } = await supabase
      .from("service_access_entitlements")
      .select("user_id")
      .in("user_id", candidateIds)
      .eq("entitlement_key", "personal_features")
      .eq("status", "active")
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`);
    if (entitlementError) throw entitlementError;

    const entitledIds = [...new Set((entitlements ?? []).map((item) => item.user_id))];
    if (!entitledIds.length) return [];
    const column = preferenceColumn(event.eventType);
    const { data: preferences, error: preferenceError } = await supabase
      .from("user_notification_preferences")
      .select(`user_id, ${column}`)
      .in("user_id", entitledIds);
    if (preferenceError) throw preferenceError;

    const disabledIds = new Set(
      (preferences ?? [])
        .filter((item) => item[column] === false)
        .map((item) => item.user_id),
    );
    return entitledIds.filter((id) => !disabledIds.has(id));
  }

  async function processEvent(event: NotificationEvent) {
    const userIds = await recipientUserIds(event);
    if (!userIds.length) return 0;
    const { data: devices, error: deviceError } = await supabase
      .from("user_push_devices")
      .select("id, user_id, expo_push_token")
      .in("user_id", userIds)
      .eq("is_active", true);
    if (deviceError) throw deviceError;

    const pushDevices: PushDevice[] = (devices ?? []).map((device) => ({
      id: device.id,
      userId: device.user_id,
      token: device.expo_push_token,
    }));
    if (!pushDevices.length) return 0;

    const { data: festival, error: festivalError } = await supabase
      .from("festivals")
      .select("name")
      .eq("id", event.festivalId)
      .single();
    if (festivalError) throw festivalError;

    let artistName: string | null = null;
    if (event.artistId !== null) {
      const { data: artist } = await supabase.from("artists").select("name").eq("id", event.artistId).maybeSingle();
      artistName = artist?.name ?? null;
    }

    const deliveryRows = pushDevices.map((device) => ({
      event_id: event.id,
      user_id: device.userId,
      device_id: device.id,
      dedupe_key: `${event.id}:${device.userId}:${device.id}`,
      status: "pending",
    }));
    const { data: inserted, error: deliveryError } = await supabase
      .from("notification_deliveries")
      .upsert(deliveryRows, { onConflict: "dedupe_key", ignoreDuplicates: true })
      .select("id, user_id, device_id");
    if (deliveryError) throw deliveryError;

    const deliveries: Delivery[] = (inserted ?? []).map((delivery) => ({
      id: delivery.id,
      userId: delivery.user_id,
      deviceId: delivery.device_id,
    }));
    const deviceById = new Map(pushDevices.map((device) => [device.id, device]));
    const text = notificationText(event, festival.name, artistName);

    let sent = 0;
    for (const batch of chunks(deliveries, 100)) {
      const messages = batch.flatMap((delivery) => {
        const device = deviceById.get(delivery.deviceId);
        return device ? [{
          to: device.token,
          sound: "default",
          title: text.title,
          body: text.body,
          data: { url: `https://festibom.com/festival/${event.festivalId}` },
        }] : [];
      });
      if (!messages.length) continue;

      const response = await fetch(EXPO_SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      if (!response.ok) throw new Error(`Expo Push HTTP ${response.status}`);
      const tickets = parseExpoTickets(readJson(await response.text()));

      for (let index = 0; index < batch.length; index += 1) {
        const delivery = batch[index];
        const ticket = tickets[index];
        if (!delivery || !ticket) continue;
        if (ticket.status === "ok") {
          await supabase.from("notification_deliveries").update({
            status: "sent",
            expo_ticket_id: ticket.id,
            sent_at: new Date().toISOString(),
          }).eq("id", delivery.id);
          sent += 1;
        } else {
          await supabase.from("notification_deliveries").update({
            status: "failed",
            failure_code: ticket.errorCode,
            failure_reason: ticket.message,
          }).eq("id", delivery.id);
          if (ticket.errorCode === PERMANENT_DEVICE_ERROR) await disableDevice(delivery.deviceId);
        }
      }
    }
    return sent;
  }

  const receiptsChecked = await checkReceipts();
  const { data: claimed, error: claimError } = await supabase.rpc("claim_notification_events", { p_limit: 50 });
  if (claimError) return Response.json({ error: claimError.message }, { status: 500 });

  const events = (claimed ?? []).flatMap((value) => {
    const parsed = parseEvent(value as JsonValue);
    return parsed ? [parsed] : [];
  });
  let sent = 0;
  for (const event of events) {
    try {
      sent += await processEvent(event);
      await supabase.rpc("finish_notification_event", { p_event_id: event.id, p_succeeded: true, p_error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "알림 처리 실패";
      await supabase.rpc("finish_notification_event", { p_event_id: event.id, p_succeeded: false, p_error: message });
    }
  }

  return Response.json({ claimed: events.length, sent, receiptsChecked });
});
