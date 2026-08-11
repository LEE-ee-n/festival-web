import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260811061625_admin_insert_festival_update_drafts.sql",
    import.meta.url,
  ),
  "utf8",
);

test("기존 수정 초안 INSERT는 인증된 관리자에게만 허용한다", () => {
  assert.match(
    migration,
    /on public\.festival_update_drafts\s+for insert\s+to authenticated/i,
  );
  assert.match(
    migration,
    /with check \(\(select public\.is_admin\(\)\)\)/i,
  );
  assert.doesNotMatch(migration, /to\s+(?:anon|public)\b/i);
});
