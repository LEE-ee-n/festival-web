import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260811045755_harden_rpc_execute_privileges.sql",
    import.meta.url,
  ),
  "utf8",
);

const legacyStatusMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260811050658_lock_legacy_status_search_path.sql",
    import.meta.url,
  ),
  "utf8",
);

test("아티스트 Excel 수정 RPC는 관리자 권한을 DB에서 재검사한다", () => {
  assert.match(
    migration,
    /create or replace function public\.update_artists_from_excel[\s\S]*public\.is_admin\(\)/,
  );
  assert.match(
    migration,
    /revoke all[\s\S]*public\.update_artists_from_excel\(jsonb\)[\s\S]*from public, anon;/,
  );
});

test("축제 상태 갱신 RPC는 익명·일반 회원 실행 권한을 회수한다", () => {
  assert.match(
    migration,
    /public\.refresh_festival_statuses\(\),[\s\S]*public\.update_festival_statuses\(\)[\s\S]*from public, anon, authenticated;/,
  );
  assert.match(
    legacyStatusMigration,
    /alter function public\.update_festival_statuses\(\)[\s\S]*set search_path = '';/,
  );
});

test("트리거 전용 함수는 외부 역할의 직접 실행을 허용하지 않는다", () => {
  for (const functionName of [
    "audit_artist_alias_row_change",
    "audit_artist_row_change",
    "handle_new_user",
    "set_festival_update_draft_base_version",
  ]) {
    assert.match(migration, new RegExp(`public\\.${functionName}\\(\\)`));
  }

  assert.match(migration, /from public, anon, authenticated, service_role;/);
});
