import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  new URL(
    "../supabase/tests/personal_data_cross_account_rls.sql",
    import.meta.url,
  ),
  "utf8",
);

const personalTables = [
  "profiles",
  "user_favorite_artists",
  "user_favorite_festivals",
  "user_schedule_items",
  "user_festival_diaries",
  "user_festival_performances",
  "user_festival_songs",
  "user_festival_media",
  "service_access_entitlements",
];

test("cross-account RLS test covers every personal table and both RPCs", () => {
  for (const table of personalTables) {
    assert.match(sql, new RegExp(`public\\.${table}\\b`));
  }
  assert.match(sql, /public\.save_user_festival_record\(/);
  assert.match(sql, /public\.save_user_festival_artist_record\(/);
});

test("cross-account RLS test uses authenticated role in both directions", () => {
  assert.match(sql, /set local role authenticated/i);
  assert.match(sql, /for v_direction in 1\.\.2 loop/i);
  assert.match(sql, /request\.jwt\.claim\.sub/);
});

test("cross-account RLS test checks every DML class and rolls back", () => {
  assert.match(sql, /교차 INSERT/);
  assert.match(sql, /교차 UPDATE/);
  assert.match(sql, /교차 DELETE/);
  assert.match(sql, /교차 계정 SELECT/);
  assert.match(sql, /rollback;/i);
  assert.match(sql, /persistent_test_rows', 0/);
});

test("cross-account RLS test does not select account identifiers as output", () => {
  const finalSelect = sql.slice(sql.lastIndexOf("select jsonb_build_object"));
  assert.doesNotMatch(finalSelect, /user_[ab]|email|uuid/i);
});
