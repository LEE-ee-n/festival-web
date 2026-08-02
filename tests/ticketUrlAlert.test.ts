import assert from "node:assert/strict";
import test from "node:test";

import { getTicketUrlAlerts } from "../lib/festivals/ticketUrlAlert.ts";

const now = new Date("2026-08-02T00:00:00.000Z");

test("유료 축제의 미래 오픈·URL 없는 티켓만 알림 대상으로 고른다", () => {
  const alerts = getTicketUrlAlerts({
    festivals: [
      { end_date: "2026-08-10", id: 1, name: "유료 축제", price_type: "paid" },
      { end_date: "2026-08-10", id: 2, name: "무료 축제", price_type: "free" },
      { end_date: "2026-08-01", id: 3, name: "종료 축제", price_type: "paid" },
    ],
    now,
    ticketRounds: [
      { festival_id: 1, id: 1, open_at: "2026-08-03T00:00:00.000Z", round_name: "얼리버드", ticket_platform: "NOL", ticket_url: null },
      { festival_id: 1, id: 2, open_at: "2026-08-03T00:00:00.000Z", round_name: "일반", ticket_platform: "YES24", ticket_url: "https://example.com" },
      { festival_id: 1, id: 3, open_at: "2026-08-01T00:00:00.000Z", round_name: "지난 티켓", ticket_platform: "NOL", ticket_url: null },
      { festival_id: 2, id: 4, open_at: "2026-08-03T00:00:00.000Z", round_name: "무료", ticket_platform: "NOL", ticket_url: null },
      { festival_id: 3, id: 5, open_at: "2026-08-03T00:00:00.000Z", round_name: "종료", ticket_platform: "NOL", ticket_url: null },
    ],
    today: "2026-08-02",
  });

  assert.deepEqual(alerts.map((alert) => alert.id), [1]);
  assert.equal(alerts[0]?.festival_name, "유료 축제");
});

test("무료·유료 혼합 축제는 알림 대상에 포함한다", () => {
  const alerts = getTicketUrlAlerts({
    festivals: [
      { end_date: "2026-08-10", id: 1, name: "혼합 축제", price_type: "partial_free" },
    ],
    now,
    ticketRounds: [
      { festival_id: 1, id: 1, open_at: "2026-08-03T00:00:00.000Z", round_name: "유료 구역", ticket_platform: null, ticket_url: "   " },
    ],
    today: "2026-08-02",
  });

  assert.equal(alerts.length, 1);
});
