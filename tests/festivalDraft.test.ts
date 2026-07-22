import assert from "node:assert/strict";
import test from "node:test";

import {
  canEditArtistReviewField,
  formatFestivalDraftJson,
  getActiveDraftArtists,
  getFestivalDraftFileName,
  mergeNonBlankValue,
  moveRegistrationStep,
  parseFestivalDraftJson,
  validateArtistReview,
  validateFestivalDraftForApproval,
} from "../lib/festivals/festivalDraft.ts";

test("축제·아티스트·티켓 초안 JSON을 검증한다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      festival: {
        name: "테스트 페스티벌",
        normalized_name: "testfestival",
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
            normalized_name: "test",
            start_date: "2026-08-02",
            end_date: "2026-08-01",
          },
          artists: [],
        }),
      ),
    /종료일/,
  );
});

test("축제 초안의 검토 메타데이터를 함께 읽는다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      candidate: {
        title: "인스타 포스터",
        source_type: "instagram_manual",
        score: 85,
      },
      festival: {
        name: "테스트 페스티벌",
        normalized_name: "testfestival",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [],
      tickets: [],
    }),
  );

  assert.equal(draft.candidate?.score, 85);
});

test("축제 초안 신뢰도가 범위를 벗어나면 거부한다", () => {
  assert.throws(
    () =>
      parseFestivalDraftJson(
        JSON.stringify({
          candidate: { score: 101 },
          festival: {
            name: "테스트 페스티벌",
            normalized_name: "testfestival",
            start_date: "2026-08-01",
            end_date: "2026-08-02",
          },
          artists: [],
        }),
      ),
    /0부터 100/,
  );
});

test("문자열로 들어온 아티스트 별칭을 배열로 정규화한다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      festival: {
        name: "테스트 페스티벌",
        normalized_name: "testfestival",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [
        {
          input_name: "TEST ARTIST",
          display_name: "TEST ARTIST",
          normalized_name: "testartist",
          aliases: "테스트 아티스트, TA",
        },
      ],
      tickets: [],
    }),
  );

  assert.deepEqual(draft.artists[0].aliases, ["테스트 아티스트", "TA"]);
});

test("아티스트 매칭 확인 전에는 후보 승인을 거부한다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      festival: {
        name: "테스트 페스티벌",
        normalized_name: "testfestival",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [
        {
          input_name: "TEST ARTIST",
          display_name: "TEST ARTIST",
          normalized_name: "testartist",
          aliases: [],
        },
      ],
      tickets: [],
    }),
  );

  assert.throws(() => validateFestivalDraftForApproval(draft), /ID 연결/);
});

test("이름이 비어 있는 아티스트는 승인 전에 거부한다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      festival: {
        name: "테스트 페스티벌",
        normalized_name: "testfestival",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [
        {
          input_name: "",
          display_name: "",
          normalized_name: "unknownartist",
          matched_artist_id: null,
          match_status: "new",
          aliases: [],
        },
      ],
      tickets: [],
    }),
  );

  assert.throws(
    () => validateFestivalDraftForApproval(draft),
    /포스터 표기 이름 또는 표시 이름/,
  );
});

test("신규 아티스트의 normalized_name 중복을 거부한다", () => {
  const artist = {
    input_name: "TEST ARTIST",
    display_name: "TEST ARTIST",
    normalized_name: "testartist",
    matched_artist_id: null,
    match_status: "new" as const,
    aliases: [],
  };

  assert.throws(
    () =>
      validateFestivalDraftForApproval({
        festival: {
          name: "테스트 페스티벌",
          normalized_name: "testfestival",
          start_date: "2026-08-01",
          end_date: "2026-08-02",
        },
        artists: [artist, { ...artist }],
        tickets: [],
      }),
    /중복된 normalized_name/,
  );
});

test("승인 전에 완전하고 유효한 축제 식별값을 요구한다", () => {
  const draft = {
    festival: {
      name: "테스트 페스티벌",
      normalized_name: "testfestival",
      start_date: "2026-02-30",
      end_date: "2026-03-01",
    },
    artists: [],
    tickets: [],
  };

  assert.throws(
    () => validateFestivalDraftForApproval(draft),
    /올바른 시작일·종료일/,
  );
});

test("축제명을 안전한 JSON 파일명으로 바꾼다", () => {
  assert.equal(
    getFestivalDraftFileName({
      festival: {
        name: "2026 테스트:페스티벌",
        normalized_name: "testfestival2026",
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
      normalized_name: "test",
      end_date: "2026-08-02",
      start_date: "2026-08-01",
    },
    artists: [],
  });

  assert.ok(formatted.indexOf('"start_date"') < formatted.indexOf('"end_date"'));
});

test("축제 normalized_name을 영문 소문자와 숫자로 정리한다", () => {
  const draft = parseFestivalDraftJson(
    JSON.stringify({
      festival: {
        name: "테스트 축제",
        normalized_name: "Test Festival 2026!",
        start_date: "2026-08-01",
        end_date: "2026-08-02",
      },
      artists: [],
    }),
  );

  assert.equal(draft.festival.normalized_name, "test");
});

test("축제 normalized_name이 없으면 JSON을 거부한다", () => {
  assert.throws(
    () =>
      parseFestivalDraftJson(
        JSON.stringify({
          festival: {
            name: "테스트 축제",
            start_date: "2026-08-01",
            end_date: "2026-08-02",
          },
          artists: [],
        }),
      ),
    /festival\.normalized_name/,
  );
});

test("미처리 아티스트가 있으면 최종 명단 단계로 이동하지 못한다", () => {
  const draft = parseFestivalDraftJson(JSON.stringify({
    festival: {
      name: "테스트 축제",
      normalized_name: "test",
      start_date: "2026-08-01",
      end_date: "2026-08-02",
    },
    artists: [{
      input_name: "TEST ARTIST",
      display_name: "TEST ARTIST",
      normalized_name: "testartist",
      aliases: [],
    }],
  }));

  assert.throws(() => validateArtistReview(draft), /처리해 주세요/);
  assert.throws(
    () => moveRegistrationStep(draft, "artist_confirmation"),
    /처리해 주세요/,
  );
});

test("아티스트 아님으로 제외한 OCR 항목은 확정 명단에서 빠진다", () => {
  const draft = parseFestivalDraftJson(JSON.stringify({
    festival: {
      name: "테스트 축제",
      normalized_name: "test",
      start_date: "2026-08-01",
      end_date: "2026-08-02",
    },
    artists: [{
      input_name: "SPONSOR",
      display_name: "SPONSOR",
      normalized_name: "sponsor",
      match_status: "excluded",
      aliases: [],
    }],
  }));

  assert.doesNotThrow(() => validateArtistReview(draft));
  assert.equal(getActiveDraftArtists(draft).length, 0);
});

test("빈 신규 값은 기존 운영 값을 덮어쓰지 않는다", () => {
  assert.equal(mergeNonBlankValue("기존 장소", ""), "기존 장소");
  assert.equal(mergeNonBlankValue("기존 장소", "새 장소"), "새 장소");
  assert.equal(mergeNonBlankValue("기존 장소", null), "기존 장소");
});

test("아티스트 검토 필드는 pending과 new에서만 수정할 수 있다", () => {
  const baseArtist = {
    input_name: "POSTER NAME",
    display_name: "Display Name",
    normalized_name: "displayname",
    aliases: [] as string[],
  };
  const pending = { ...baseArtist, match_status: "pending" as const };
  const newArtist = { ...baseArtist, match_status: "new" as const };
  const matched = {
    ...baseArtist,
    match_status: "matched" as const,
    matched_artist_id: 1,
  };

  assert.equal(canEditArtistReviewField(pending, "display_name"), true);
  assert.equal(canEditArtistReviewField(newArtist, "normalized_name"), true);
  assert.equal(canEditArtistReviewField(newArtist, "aliases"), true);
  assert.equal(canEditArtistReviewField(pending, "input_name"), false);
  assert.equal(canEditArtistReviewField(matched, "display_name"), false);
  assert.equal(canEditArtistReviewField(matched, "normalized_name"), false);
  assert.equal(canEditArtistReviewField(matched, "aliases"), false);
});
