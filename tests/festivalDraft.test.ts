import assert from "node:assert/strict";
import test from "node:test";

import {
  formatFestivalDraftJson,
  getFestivalDraftFileName,
  parseFestivalDraftJson,
} from "../lib/festivals/festivalDraft.ts";

test("축제·아티스트·티켓 초안 JSON을 검증한다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      festival: {
        name: "테스트 페스티벌",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [],
      tickets: [],
    }),
  );

  assert.equal(draft.festival.name, "테스트 페스티벌");
});

test("종료일이 시작일보다 빠른 초안을 거부한다", () => {
  assert.throws(
    () =>
      parseFestivalDraftJson(
        JSON.stringify({
          festival: {
            name: "테스트",
            start_date: "2026-08-02",
            end_date: "2026-08-01",
          },
          artists: [],
        }),
      ),
    /종료일/,
  );
});

test("헤르메스 검토 메타데이터를 함께 읽는다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      candidate: {
        title: "인스타 포스터",
        source_type: "instagram_manual",
        score: 85,
      },
      festival: {
        name: "테스트 페스티벌",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [],
      tickets: [],
    }),
  );

  assert.equal(draft.candidate?.score, 85);
});

test("헤르메스 신뢰도가 범위를 벗어나면 거부한다", () => {
  assert.throws(
    () =>
      parseFestivalDraftJson(
        JSON.stringify({
          candidate: { score: 101 },
          festival: {
            name: "테스트 페스티벌",
            start_date: "2026-08-01",
            end_date: "2026-08-02",
          },
          artists: [],
        }),
      ),
    /0부터 100/,
  );
});

test("축제명을 안전한 JSON 파일명으로 바꾼다", () => {
  assert.equal(
    getFestivalDraftFileName({
      festival: {
        name: "2026 테스트:페스티벌",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [],
    }),
    "2026-테스트-페스티벌.json",
  );
});

test("JSON 초안에서 시작일 다음에 종료일을 표시한다", () => {
  const formatted = formatFestivalDraftJson({
    festival: {
      name: "테스트",
      end_date: "2026-08-02",
      start_date: "2026-08-01",
    },
    artists: [],
  });

  assert.ok(formatted.indexOf('"start_date"') < formatted.indexOf('"end_date"'));
});
