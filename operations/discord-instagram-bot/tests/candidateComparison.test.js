import assert from "node:assert/strict";
import test from "node:test";

import {
  compareLineup,
  findFestivalConnection,
  getAnnouncementRound,
  normalizeDraftDates,
} from "../src/candidateComparison.js";
import {
  normalizeAsciiName,
  normalizeFestivalName,
} from "../src/nameNormalization.js";

test("festival and artist normalized names use separate rules", () => {
  assert.equal(normalizeFestivalName("ONE UNIVERSE FESTIVAL 2026"), "oneuniverse");
  assert.equal(normalizeAsciiName("Festival 2026"), "festival2026");
  assert.equal(normalizeAsciiName("JOEY VALENCE & BRAE"), "joeyvalenceandbrae");
});

test("festival connection requires normalized name and both dates", () => {
  const festivals = [{ id: 7, normalized_name: "festibom", start_date: "2026-09-01", end_date: "2026-09-02" }];
  assert.equal(findFestivalConnection({ normalized_name: "festibom", start_date: "2026-09-01", end_date: "2026-09-02" }, festivals).type, "update");
  assert.equal(findFestivalConnection({ normalized_name: "festibom", start_date: "2027-09-01", end_date: "2027-09-02" }, festivals).type, "new");
});

test("similar display names never replace the exact festival identity", () => {
  const festivals = [{
    id: 9,
    name: "2026 ONE UNIVERSE 페스티벌",
    normalized_name: "oneuniverse",
    search_aliases: "One Universe Festival, 원 유니버스 페스티벌",
    start_date: "2026-07-25",
    end_date: "2026-07-26",
  }];
  const result = findFestivalConnection({
    name: "ONE UNIVERSE FESTIVAL",
    normalized_name: "oneuniversefestival",
    start_date: "2026-07-25",
    end_date: "2026-07-26",
  }, festivals);
  assert.equal(result.type, "new");
  assert.equal(result.festival, null);
});

test("incomplete festival identity requires review instead of new registration", () => {
  const result = findFestivalConnection({
    normalized_name: "oneuniverse",
    start_date: "2026-07-25",
    end_date: "",
  }, []);
  assert.equal(result.type, "needs_review");
});

test("missing artists are never marked for removal", () => {
  const result = compareLineup([
    { input_name: "A", matched_artist_id: 1, status: "confirmed" },
    { input_name: "B", matched_artist_id: 2, status: "confirmed" },
  ], [1, 3]);
  assert.deepEqual(result.map((item) => item.comparison_status), ["existing", "add"]);
});

test("only an explicit cancellation becomes a remove candidate", () => {
  const [artist] = compareLineup([{ input_name: "A", matched_artist_id: 1, status: "cancelled" }], [1]);
  assert.equal(artist.comparison_status, "remove_candidate");
});

test("announcement round is extracted without guessing", () => {
  assert.equal(getAnnouncementRound("2차 라인업 ADD"), "round_2");
  assert.equal(getAnnouncementRound("FINAL LINEUP"), "final");
  assert.equal(getAnnouncementRound("LINEUP OPEN"), "unspecified");
});

test("partial dates use the only explicit evidence year", () => {
  const draft = {
    candidate: { raw_text: "2026 FESTIVAL 07-25" },
    festival: { name: "Festival", start_date: "07-25", end_date: "07-26" },
    artists: [{ performance_date: "07-25" }],
  };
  normalizeDraftDates(draft);
  assert.equal(draft.festival.start_date, "2026-07-25");
  assert.equal(draft.artists[0].performance_date, "2026-07-25");
});

test("partial dates stay empty when the year is ambiguous", () => {
  const draft = {
    candidate: { raw_text: "07-25" },
    festival: { name: "Festival", start_date: "07-25", end_date: "07-26" },
    artists: [],
  };
  const result = normalizeDraftDates(draft);
  assert.equal(draft.festival.start_date, "");
  assert.equal(result.hasCompleteFestivalDates, false);
});
