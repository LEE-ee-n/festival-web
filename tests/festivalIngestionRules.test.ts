import assert from "node:assert/strict";
import test from "node:test";

import {
  createFestivalIdentityKey,
  findExactFestivalIdentityMatch,
  isSameMinuteTime,
  mergeWithoutBlankOverwrite,
  normalizeMinuteTime,
} from "../lib/festivals/ingestionRules.ts";

const festival2026 = {
  id: 3,
  normalized_name: "oneuniverse",
  start_date: "2026-07-25",
  end_date: "2026-07-26",
};

test("축제 식별키는 normalized_name + start_date + end_date를 모두 사용한다", () => {
  assert.equal(
    createFestivalIdentityKey(festival2026),
    "oneuniverse|2026-07-25|2026-07-26",
  );
  assert.equal(createFestivalIdentityKey({
    normalized_name: "oneuniverse",
    start_date: "",
    end_date: "2026-07-26",
  }), null);
});

test("이름이 같아도 날짜가 다른 연도 축제는 기존 축제로 판정하지 않는다", () => {
  const result = findExactFestivalIdentityMatch({
    normalized_name: "oneuniverse",
    start_date: "2027-07-24",
    end_date: "2027-07-25",
  }, [festival2026]);

  assert.equal(result.status, "new");
});

test("세 식별값이 모두 같을 때만 기존 축제로 판정한다", () => {
  const result = findExactFestivalIdentityMatch(festival2026, [festival2026]);

  assert.equal(result.status, "existing");
  assert.equal(result.festival?.id, 3);
});

test("식별값이 빠지면 신규가 아니라 확인 필요 상태가 된다", () => {
  const result = findExactFestivalIdentityMatch({
    normalized_name: "oneuniverse",
    start_date: "2026-07-25",
    end_date: "",
  }, [festival2026]);

  assert.equal(result.status, "incomplete");
});

test("존재하지 않는 달력 날짜는 불완전한 식별값이다", () => {
  assert.equal(createFestivalIdentityKey({
    normalized_name: "oneuniverse",
    start_date: "2026-02-30",
    end_date: "2026-03-01",
  }), null);
});

test("DB 초 단위와 JSON 분 단위 시간을 같은 값으로 비교한다", () => {
  assert.equal(normalizeMinuteTime("17:50:00"), "17:50");
  assert.equal(normalizeMinuteTime("7:05"), "07:05");
  assert.equal(isSameMinuteTime("17:50:00", "17:50"), true);
  assert.equal(normalizeMinuteTime("25:10"), "");
});

test("빈 JSON 값은 기존 값을 덮어쓰지 않는다", () => {
  const merged = mergeWithoutBlankOverwrite(
    { location: "파라다이스시티", price_info: "120,000원", status: "scheduled" },
    { location: "", price_info: null, status: "confirmed" },
  );

  assert.deepEqual(merged, {
    location: "파라다이스시티",
    price_info: "120,000원",
    status: "confirmed",
  });
});
