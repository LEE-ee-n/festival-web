# Supabase 보안 구조

## 요약

- 모든 주요 테이블에 RLS 활성화
- 일반 사용자는 공개 데이터 조회 가능
- artists 생성은 관리자만 가능
- artist_aliases 생성은 관리자만 가능
- 관리자 판별은 public.is_admin() 사용
- set_artist_display_name 함수 내부에서 관리자 권한 검사
- festivals 관련 관리자 쓰기 정책은 아직 추가 필요


# 정책 확인 쿼리
| schemaname | tablename              | policyname                             | permissive | roles                | cmd    | qual                   | with_check |
| ---------- | ---------------------- | -------------------------------------- | ---------- | -------------------- | ------ | ---------------------- | ---------- |
| public     | admin_users            | Users can read own admin status        | PERMISSIVE | {authenticated}      | SELECT | (user_id = auth.uid()) | null       |
| public     | artist_aliases         | Admins can insert artist aliases       | PERMISSIVE | {authenticated}      | INSERT | null                   | is_admin() |
| public     | artist_aliases         | Public can read artist aliases         | PERMISSIVE | {anon,authenticated} | SELECT | true                   | null       |
| public     | artists                | Admins can insert artists              | PERMISSIVE | {authenticated}      | INSERT | null                   | is_admin() |
| public     | artists                | Allow public read                      | PERMISSIVE | {public}             | SELECT | true                   | null       |
| public     | festival_artists       | Allow public read                      | PERMISSIVE | {public}             | SELECT | true                   | null       |
| public     | festival_ticket_rounds | Public can read festival ticket rounds | PERMISSIVE | {anon,authenticated} | SELECT | true                   | null       |
| public     | festivals              | Allow public read                      | PERMISSIVE | {public}             | SELECT | true                   | null       |






# 테이블별 권한 확인
| grantee       | table_schema | table_name       | privilege_type |
| ------------- | ------------ | ---------------- | -------------- |
| anon          | public       | admin_users      | DELETE         |
| anon          | public       | admin_users      | INSERT         |
| anon          | public       | admin_users      | REFERENCES     |
| anon          | public       | admin_users      | SELECT         |
| anon          | public       | admin_users      | TRIGGER        |
| anon          | public       | admin_users      | TRUNCATE       |
| anon          | public       | admin_users      | UPDATE         |
| authenticated | public       | admin_users      | DELETE         |
| authenticated | public       | admin_users      | INSERT         |
| authenticated | public       | admin_users      | REFERENCES     |
| authenticated | public       | admin_users      | SELECT         |
| authenticated | public       | admin_users      | TRIGGER        |
| authenticated | public       | admin_users      | TRUNCATE       |
| authenticated | public       | admin_users      | UPDATE         |
| postgres      | public       | admin_users      | DELETE         |
| postgres      | public       | admin_users      | INSERT         |
| postgres      | public       | admin_users      | REFERENCES     |
| postgres      | public       | admin_users      | SELECT         |
| postgres      | public       | admin_users      | TRIGGER        |
| postgres      | public       | admin_users      | TRUNCATE       |
| postgres      | public       | admin_users      | UPDATE         |
| service_role  | public       | admin_users      | DELETE         |
| service_role  | public       | admin_users      | INSERT         |
| service_role  | public       | admin_users      | REFERENCES     |
| service_role  | public       | admin_users      | SELECT         |
| service_role  | public       | admin_users      | TRIGGER        |
| service_role  | public       | admin_users      | TRUNCATE       |
| service_role  | public       | admin_users      | UPDATE         |
| anon          | public       | artist_aliases   | DELETE         |
| anon          | public       | artist_aliases   | INSERT         |
| anon          | public       | artist_aliases   | REFERENCES     |
| anon          | public       | artist_aliases   | SELECT         |
| anon          | public       | artist_aliases   | TRIGGER        |
| anon          | public       | artist_aliases   | TRUNCATE       |
| anon          | public       | artist_aliases   | UPDATE         |
| authenticated | public       | artist_aliases   | DELETE         |
| authenticated | public       | artist_aliases   | INSERT         |
| authenticated | public       | artist_aliases   | REFERENCES     |
| authenticated | public       | artist_aliases   | SELECT         |
| authenticated | public       | artist_aliases   | TRIGGER        |
| authenticated | public       | artist_aliases   | TRUNCATE       |
| authenticated | public       | artist_aliases   | UPDATE         |
| postgres      | public       | artist_aliases   | DELETE         |
| postgres      | public       | artist_aliases   | INSERT         |
| postgres      | public       | artist_aliases   | REFERENCES     |
| postgres      | public       | artist_aliases   | SELECT         |
| postgres      | public       | artist_aliases   | TRIGGER        |
| postgres      | public       | artist_aliases   | TRUNCATE       |
| postgres      | public       | artist_aliases   | UPDATE         |
| service_role  | public       | artist_aliases   | DELETE         |
| service_role  | public       | artist_aliases   | INSERT         |
| service_role  | public       | artist_aliases   | REFERENCES     |
| service_role  | public       | artist_aliases   | SELECT         |
| service_role  | public       | artist_aliases   | TRIGGER        |
| service_role  | public       | artist_aliases   | TRUNCATE       |
| service_role  | public       | artist_aliases   | UPDATE         |
| anon          | public       | artists          | DELETE         |
| anon          | public       | artists          | INSERT         |
| anon          | public       | artists          | REFERENCES     |
| anon          | public       | artists          | SELECT         |
| anon          | public       | artists          | TRIGGER        |
| anon          | public       | artists          | TRUNCATE       |
| anon          | public       | artists          | UPDATE         |
| authenticated | public       | artists          | DELETE         |
| authenticated | public       | artists          | INSERT         |
| authenticated | public       | artists          | REFERENCES     |
| authenticated | public       | artists          | SELECT         |
| authenticated | public       | artists          | TRIGGER        |
| authenticated | public       | artists          | TRUNCATE       |
| authenticated | public       | artists          | UPDATE         |
| postgres      | public       | artists          | DELETE         |
| postgres      | public       | artists          | INSERT         |
| postgres      | public       | artists          | REFERENCES     |
| postgres      | public       | artists          | SELECT         |
| postgres      | public       | artists          | TRIGGER        |
| postgres      | public       | artists          | TRUNCATE       |
| postgres      | public       | artists          | UPDATE         |
| service_role  | public       | artists          | DELETE         |
| service_role  | public       | artists          | INSERT         |
| service_role  | public       | artists          | REFERENCES     |
| service_role  | public       | artists          | SELECT         |
| service_role  | public       | artists          | TRIGGER        |
| service_role  | public       | artists          | TRUNCATE       |
| service_role  | public       | artists          | UPDATE         |
| anon          | public       | festival_artists | DELETE         |
| anon          | public       | festival_artists | INSERT         |
| anon          | public       | festival_artists | REFERENCES     |
| anon          | public       | festival_artists | SELECT         |
| anon          | public       | festival_artists | TRIGGER        |
| anon          | public       | festival_artists | TRUNCATE       |
| anon          | public       | festival_artists | UPDATE         |
| authenticated | public       | festival_artists | DELETE         |
| authenticated | public       | festival_artists | INSERT         |
| authenticated | public       | festival_artists | REFERENCES     |
| authenticated | public       | festival_artists | SELECT         |
| authenticated | public       | festival_artists | TRIGGER        |
| authenticated | public       | festival_artists | TRUNCATE       |
| authenticated | public       | festival_artists | UPDATE         |
| postgres      | public       | festival_artists | DELETE         |
| postgres      | public       | festival_artists | INSERT         |









# 함수 실행 권한 확인
| routine_schema | routine_name               | grantee       | privilege_type |
| -------------- | -------------------------- | ------------- | -------------- |
| public         | gin_extract_query_trgm     | anon          | EXECUTE        |
| public         | gin_extract_query_trgm     | authenticated | EXECUTE        |
| public         | gin_extract_query_trgm     | postgres      | EXECUTE        |
| public         | gin_extract_query_trgm     | service_role  | EXECUTE        |
| public         | gin_extract_value_trgm     | anon          | EXECUTE        |
| public         | gin_extract_value_trgm     | authenticated | EXECUTE        |
| public         | gin_extract_value_trgm     | postgres      | EXECUTE        |
| public         | gin_extract_value_trgm     | service_role  | EXECUTE        |
| public         | gin_trgm_consistent        | anon          | EXECUTE        |
| public         | gin_trgm_consistent        | authenticated | EXECUTE        |
| public         | gin_trgm_consistent        | postgres      | EXECUTE        |
| public         | gin_trgm_consistent        | service_role  | EXECUTE        |
| public         | gin_trgm_triconsistent     | anon          | EXECUTE        |
| public         | gin_trgm_triconsistent     | authenticated | EXECUTE        |
| public         | gin_trgm_triconsistent     | postgres      | EXECUTE        |
| public         | gin_trgm_triconsistent     | service_role  | EXECUTE        |
| public         | gtrgm_compress             | anon          | EXECUTE        |
| public         | gtrgm_compress             | authenticated | EXECUTE        |
| public         | gtrgm_compress             | postgres      | EXECUTE        |
| public         | gtrgm_compress             | service_role  | EXECUTE        |
| public         | gtrgm_consistent           | anon          | EXECUTE        |
| public         | gtrgm_consistent           | authenticated | EXECUTE        |
| public         | gtrgm_consistent           | postgres      | EXECUTE        |
| public         | gtrgm_consistent           | service_role  | EXECUTE        |
| public         | gtrgm_decompress           | anon          | EXECUTE        |
| public         | gtrgm_decompress           | authenticated | EXECUTE        |
| public         | gtrgm_decompress           | postgres      | EXECUTE        |
| public         | gtrgm_decompress           | service_role  | EXECUTE        |
| public         | gtrgm_distance             | anon          | EXECUTE        |
| public         | gtrgm_distance             | authenticated | EXECUTE        |
| public         | gtrgm_distance             | postgres      | EXECUTE        |
| public         | gtrgm_distance             | service_role  | EXECUTE        |
| public         | gtrgm_in                   | anon          | EXECUTE        |
| public         | gtrgm_in                   | authenticated | EXECUTE        |
| public         | gtrgm_in                   | postgres      | EXECUTE        |
| public         | gtrgm_in                   | service_role  | EXECUTE        |
| public         | gtrgm_options              | anon          | EXECUTE        |
| public         | gtrgm_options              | authenticated | EXECUTE        |
| public         | gtrgm_options              | postgres      | EXECUTE        |
| public         | gtrgm_options              | service_role  | EXECUTE        |
| public         | gtrgm_out                  | anon          | EXECUTE        |
| public         | gtrgm_out                  | authenticated | EXECUTE        |
| public         | gtrgm_out                  | postgres      | EXECUTE        |
| public         | gtrgm_out                  | service_role  | EXECUTE        |
| public         | gtrgm_penalty              | anon          | EXECUTE        |
| public         | gtrgm_penalty              | authenticated | EXECUTE        |
| public         | gtrgm_penalty              | postgres      | EXECUTE        |
| public         | gtrgm_penalty              | service_role  | EXECUTE        |
| public         | gtrgm_picksplit            | anon          | EXECUTE        |
| public         | gtrgm_picksplit            | authenticated | EXECUTE        |
| public         | gtrgm_picksplit            | postgres      | EXECUTE        |
| public         | gtrgm_picksplit            | service_role  | EXECUTE        |
| public         | gtrgm_same                 | anon          | EXECUTE        |
| public         | gtrgm_same                 | authenticated | EXECUTE        |
| public         | gtrgm_same                 | postgres      | EXECUTE        |
| public         | gtrgm_same                 | service_role  | EXECUTE        |
| public         | gtrgm_union                | anon          | EXECUTE        |
| public         | gtrgm_union                | authenticated | EXECUTE        |
| public         | gtrgm_union                | postgres      | EXECUTE        |
| public         | gtrgm_union                | service_role  | EXECUTE        |
| public         | is_admin                   | anon          | EXECUTE        |
| public         | is_admin                   | authenticated | EXECUTE        |
| public         | is_admin                   | postgres      | EXECUTE        |
| public         | is_admin                   | service_role  | EXECUTE        |
| public         | normalize_artist_name      | PUBLIC        | EXECUTE        |
| public         | normalize_artist_name      | anon          | EXECUTE        |
| public         | normalize_artist_name      | authenticated | EXECUTE        |
| public         | normalize_artist_name      | postgres      | EXECUTE        |
| public         | normalize_artist_name      | service_role  | EXECUTE        |
| public         | search_similar_artists     | PUBLIC        | EXECUTE        |
| public         | search_similar_artists     | anon          | EXECUTE        |
| public         | search_similar_artists     | authenticated | EXECUTE        |
| public         | search_similar_artists     | postgres      | EXECUTE        |
| public         | search_similar_artists     | service_role  | EXECUTE        |
| public         | set_artist_display_name    | PUBLIC        | EXECUTE        |
| public         | set_artist_display_name    | anon          | EXECUTE        |
| public         | set_artist_display_name    | authenticated | EXECUTE        |
| public         | set_artist_display_name    | postgres      | EXECUTE        |
| public         | set_artist_display_name    | service_role  | EXECUTE        |
| public         | set_artist_normalized_name | PUBLIC        | EXECUTE        |
| public         | set_artist_normalized_name | anon          | EXECUTE        |
| public         | set_artist_normalized_name | authenticated | EXECUTE        |
| public         | set_artist_normalized_name | postgres      | EXECUTE        |
| public         | set_artist_normalized_name | service_role  | EXECUTE        |
| public         | set_limit                  | anon          | EXECUTE        |
| public         | set_limit                  | authenticated | EXECUTE        |
| public         | set_limit                  | postgres      | EXECUTE        |
| public         | set_limit                  | service_role  | EXECUTE        |
| public         | set_updated_at             | PUBLIC        | EXECUTE        |
| public         | set_updated_at             | anon          | EXECUTE        |
| public         | set_updated_at             | authenticated | EXECUTE        |
| public         | set_updated_at             | postgres      | EXECUTE        |
| public         | set_updated_at             | service_role  | EXECUTE        |
| public         | show_limit                 | anon          | EXECUTE        |
| public         | show_limit                 | authenticated | EXECUTE        |
| public         | show_limit                 | postgres      | EXECUTE        |
| public         | show_limit                 | service_role  | EXECUTE        |
| public         | show_trgm                  | anon          | EXECUTE        |
| public         | show_trgm                  | authenticated | EXECUTE        |
| public         | show_trgm                  | postgres      | EXECUTE        |







# RLS 활성화 여부 확인
| schemaname | tablename              | rls_enabled |
| ---------- | ---------------------- | ----------- |
| public     | admin_users            | true        |
| public     | artist_aliases         | true        |
| public     | artists                | true        |
| public     | festival_artists       | true        |
| public     | festival_candidates    | true        |
| public     | festival_ticket_rounds | true        |
| public     | festivals              | true        |
| public     | pipeline_runs          | true        |



# 트리거 확인
| table_name          | trigger_name                       | action_timing | event_manipulation | action_statement                              |
| ------------------- | ---------------------------------- | ------------- | ------------------ | --------------------------------------------- |
| artists             | artists_set_normalized_name        | BEFORE        | INSERT             | EXECUTE FUNCTION set_artist_normalized_name() |
| artists             | artists_set_normalized_name        | BEFORE        | UPDATE             | EXECUTE FUNCTION set_artist_normalized_name() |
| festival_candidates | set_festival_candidates_updated_at | BEFORE        | UPDATE             | EXECUTE FUNCTION set_updated_at()             |
| festivals           | set_festivals_updated_at           | BEFORE        | UPDATE             | EXECUTE FUNCTION set_updated_at()             |
| festivals           | update_festivals_updated_at        | BEFORE        | UPDATE             | EXECUTE FUNCTION update_updated_at_column()   |