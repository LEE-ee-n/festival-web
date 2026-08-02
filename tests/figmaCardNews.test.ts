import assert from "node:assert/strict";
import test from "node:test";

import {
  createFigmaCardNewsDraft,
  toFigmaCardNewsFestival,
} from "../lib/festivals/figmaCardNews.ts";

test("카드뉴스 축제 데이터는 기간, 예매처, 출연진과 색상을 정리한다", () => {
  const festival = toFigmaCardNewsFestival({
    id: 7,
    name: "2026 테스트 페스티벌",
    startDate: "2026-08-08",
    endDate: "2026-08-10",
    location: "서울",
    region: null,
    thumbnailUrl: "https://example.com/poster.webp",
    calendarColor: "blue",
    ticketPlatforms: ["NOL 티켓", "YES24", "NOL 티켓"],
    artistNames: ["아티스트 A", "아티스트 B", "아티스트 C", "아티스트 D", "아티스트 E"],
  });

  assert.equal(festival.dateText, "8월 8일~10일");
  assert.equal(festival.ticketPlatformText, "NOL 티켓 · YES24");
  assert.equal(festival.lineupText, "아티스트 A, 아티스트 B, 아티스트 C, 아티스트 D 외 1팀");
  assert.equal(festival.colorHex, "#C0E6F4");
});

test("포스터 없는 축제는 세 개씩 목록 카드로 생성한다", () => {
  const draft = createFigmaCardNewsDraft(
    2026,
    8,
    Array.from({ length: 4 }, (_, index) => ({
      id: index + 1,
      name: `${index + 1}번 축제`,
      startDate: `2026-08-0${index + 1}`,
      endDate: `2026-08-0${index + 1}`,
      location: null,
      region: "서울",
      thumbnailUrl: null,
      calendarColor: null,
      ticketPlatforms: [],
      artistNames: [],
    })),
  );

  assert.equal(draft.festivalCards.length, 0);
  assert.deepEqual(draft.festivalLists.map((items) => items.length), [3, 1]);
  assert.equal(draft.coverTitle, "2026년 8월 페스티벌\n어디 갈까?");
});
