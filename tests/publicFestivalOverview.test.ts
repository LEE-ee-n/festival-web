import assert from "node:assert/strict";
import test from "node:test";

import {
  countPublicFestivalStates,
  filterPublicFestivalsByRegion,
  getPublicFestivalRegions,
  getPublicFestivalState,
  normalizePublicFestivalRegion,
  sortPublicFestivals,
} from "../lib/festivals/publicFestivalOverview.ts";

const todayKey = "2026-07-30";

type RegionTestFestival = {
  name: string;
  region: string | null;
  start_date: string;
  end_date: string;
};

function regionFestival(
  name: string,
  region: string | null,
  start_date = "2026-08-01",
  end_date = "2026-08-02",
): RegionTestFestival {
  return { name, region, start_date, end_date };
}

test("오늘 날짜를 기준으로 예정·진행중·종료를 판정한다", () => {
  assert.equal(
    getPublicFestivalState(
      { start_date: "2026-08-01", end_date: "2026-08-02" },
      todayKey,
    ),
    "scheduled",
  );
  assert.equal(
    getPublicFestivalState(
      { start_date: "2026-07-30", end_date: "2026-07-30" },
      todayKey,
    ),
    "ongoing",
  );
  assert.equal(
    getPublicFestivalState(
      { start_date: "2026-07-01", end_date: "2026-07-29" },
      todayKey,
    ),
    "ended",
  );
});

test("전체와 상태별 개수를 계산한다", () => {
  const counts = countPublicFestivalStates(
    [
      { start_date: "2026-08-01", end_date: "2026-08-02" },
      { start_date: "2026-07-29", end_date: "2026-07-31" },
      { start_date: "2026-07-01", end_date: "2026-07-02" },
    ],
    todayKey,
  );

  assert.deepEqual(counts, {
    all: 3,
    scheduled: 1,
    ongoing: 1,
    ended: 1,
  });
});

test("진행중, 가까운 예정, 최근 종료 순서로 정렬한다", () => {
  const festivals = sortPublicFestivals(
    [
      {
        name: "지난 축제",
        start_date: "2026-07-01",
        end_date: "2026-07-02",
      },
      {
        name: "예정 축제",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      {
        name: "진행 축제",
        start_date: "2026-07-29",
        end_date: "2026-07-31",
      },
    ],
    todayKey,
  );

  assert.deepEqual(
    festivals.map((festival) => festival.name),
    ["진행 축제", "예정 축제", "지난 축제"],
  );
});

test("정식·이전 행정구역 명칭과 공백을 17개 표준 축약명으로 변환한다", () => {
  const aliasExpectations: Array<[string, string]> = [
    ["서울특별시", "서울"],
    ["부산광역시", "부산"],
    ["대구광역시", "대구"],
    ["인천광역시", "인천"],
    ["광주광역시", "광주"],
    ["대전광역시", "대전"],
    ["울산광역시", "울산"],
    ["세종특별자치시", "세종"],
    ["경기도", "경기"],
    ["강원도", "강원"],
    ["강원특별자치도", "강원"],
    ["충청북도", "충북"],
    ["충청남도", "충남"],
    ["전라북도", "전북"],
    ["전북특별자치도", "전북"],
    ["전라남도", "전남"],
    ["경상북도", "경북"],
    ["경상남도", "경남"],
    ["제주도", "제주"],
    ["제주특별자치도", "제주"],
  ];

  aliasExpectations.forEach(([input, expected]) => {
    assert.equal(normalizePublicFestivalRegion(input), expected);
  });

  [
    "서울",
    "경기",
    "인천",
    "강원",
    "대전",
    "세종",
    "충북",
    "충남",
    "광주",
    "전북",
    "전남",
    "대구",
    "경북",
    "부산",
    "울산",
    "경남",
    "제주",
  ].forEach((region) => {
    assert.equal(normalizePublicFestivalRegion(region), region);
  });

  assert.equal(normalizePublicFestivalRegion(" 서울특별시 "), "서울");
  assert.equal(normalizePublicFestivalRegion(null), null);
  assert.equal(normalizePublicFestivalRegion(""), null);
  assert.equal(normalizePublicFestivalRegion("   "), null);
  assert.equal(normalizePublicFestivalRegion("해외"), null);
});

test("중복·별칭 지역은 표준 선택지 하나로 합치고 표준 순서를 지킨다", () => {
  const regions = getPublicFestivalRegions([
    regionFestival("서울 축제 1", "서울"),
    regionFestival("서울 축제 2", "서울특별시"),
    regionFestival("서울 축제 3", "서울"),
    regionFestival("부산 축제", "부산광역시"),
    regionFestival("강원 축제", "강원도"),
    regionFestival("없는 지역 축제", null),
  ]);

  assert.deepEqual(regions, ["서울", "강원", "부산"]);
});

test("지역이 없거나 알 수 없는 축제는 선택지에서 빠지지만 전체 지역 목록에는 남는다", () => {
  const festivals = [
    regionFestival("지역 없음", null),
    regionFestival("빈 값", ""),
    regionFestival("공백", "   "),
    regionFestival("알 수 없음", "해외"),
  ];

  assert.deepEqual(getPublicFestivalRegions(festivals), []);
  assert.equal(
    filterPublicFestivalsByRegion(festivals, "all").length,
    4,
  );
});

test("지역을 선택하면 정리한 값이 정확히 일치하는 축제만 남는다", () => {
  const festivals = [
    regionFestival("서울 1", "서울"),
    regionFestival("서울 2", " 서울특별시 "),
    regionFestival("서울 세부지역", "서울 마포구"),
    regionFestival("경기", "경기도"),
    regionFestival("경기 세부지역", "경기 수원"),
    regionFestival("지역 없음", null),
    regionFestival("알 수 없음", "해외"),
  ];

  const seoulOnly = filterPublicFestivalsByRegion(
    festivals,
    "서울",
  );

  assert.deepEqual(
    seoulOnly.map((festival) => festival.name),
    ["서울 1", "서울 2", "서울 세부지역"],
  );
  assert.equal(
    filterPublicFestivalsByRegion(festivals, "all").length,
    festivals.length,
  );
});

test("지역과 날짜 상태 필터는 교차 적용되고 개수는 선택 지역 기준이다", () => {
  const festivals = [
    regionFestival("서울 예정", "서울", "2026-08-01", "2026-08-02"),
    regionFestival("서울 진행", "서울특별시", "2026-07-29", "2026-07-31"),
    regionFestival("서울 종료", "서울", "2026-07-01", "2026-07-02"),
    regionFestival("부산 종료", "부산광역시", "2026-07-03", "2026-07-04"),
    regionFestival("경기 예정", "경기도", "2026-08-05", "2026-08-06"),
  ];

  const seoulFestivals = filterPublicFestivalsByRegion(
    festivals,
    "서울",
  );

  assert.deepEqual(countPublicFestivalStates(seoulFestivals, todayKey), {
    all: 3,
    scheduled: 1,
    ongoing: 1,
    ended: 1,
  });

  const seoulScheduled = seoulFestivals.filter(
    (festival) =>
      getPublicFestivalState(festival, todayKey) === "scheduled",
  );
  const seoulOngoing = seoulFestivals.filter(
    (festival) =>
      getPublicFestivalState(festival, todayKey) === "ongoing",
  );
  const busanEnded = filterPublicFestivalsByRegion(
    festivals,
    "부산",
  ).filter(
    (festival) =>
      getPublicFestivalState(festival, todayKey) === "ended",
  );

  assert.deepEqual(
    seoulScheduled.map((festival) => festival.name),
    ["서울 예정"],
  );
  assert.deepEqual(
    seoulOngoing.map((festival) => festival.name),
    ["서울 진행"],
  );
  assert.deepEqual(
    busanEnded.map((festival) => festival.name),
    ["부산 종료"],
  );
});
