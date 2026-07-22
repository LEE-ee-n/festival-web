# Festibom 운영 DB 명세

기준일: 2026-07-22  
기준: 운영 Supabase `information_schema.columns` 실측 결과 + 저장소 코드 사용처 + 적용된 migration 004~041

## 읽는 방법

- `직접 사용`: 페이지나 함수가 Supabase `.from()`으로 테이블을 직접 조회·변경한다.
- `RPC 경유`: 페이지가 RPC를 호출하고 PostgreSQL 함수가 테이블을 변경한다.
- `간접 사용`: 공통 hook 또는 함수가 조회하며 페이지는 그 결과를 사용한다.
- Storage bucket인 `festival-thumbnails`, `festival-candidate-posters`는 DB 테이블이 아니므로 별도로 표시한다.

## 전체 분류

| 분류 | 테이블 | 운영 상태 |
|---|---|---|
| 정식 축제 | `festivals`, `festival_artists`, `festival_ticket_rounds` | 사용 중 |
| 아티스트 | `artists`, `artist_aliases` | 사용 중 |
| 신규 등록 작업함 | `festival_candidates` | 사용 중, 기존 수정 작업과 분리 완료 |
| 기존 수정 작업함 | `festival_update_drafts` | 사용 중, 단계형 임시저장·최종 반영 |
| 통합 감사 기록 | `audit_events`, `audit_changes` | 사용 중 |
| 구형 JSON 변경 기록 | `festival_update_logs` | 034에서 감사 테이블로 이관 후 삭제 |
| 사용자 권한 | `profiles` | RPC/RLS에서 사용 중 |
| 구형 파이프라인 기록 | `pipeline_runs` | 현재 애플리케이션 코드 사용처 없음 |

## normalized_name 공통 규칙

### 축제

- `20XX` 형태의 연도를 제거한다.
- 공통 단어 `festival`을 제거한다.
- 나머지에서 영문 소문자와 숫자만 남긴다.
- 예: `ONE UNIVERSE FESTIVAL 2026` → `oneuniverse`

운영 DB에는 `public.normalize_festival_name(text, date)`가 존재한다. 현재 함수는 연도를 제거한 뒤 결과 앞에 다시 붙여 `2026oneuniverse`를 반환하므로 확정 규칙과 다르다. 현재 `import_festival_json`도 이 함수를 호출하지 않고 전달받은 값을 그대로 사용한다.

- 수정 마이그레이션: `031_fix_festival_normalized_name.sql`
- 적용 후 예시: `2026 ONE UNIVERSE FESTIVAL` → `oneuniverse`
- `032_link_artist_audit_to_festival.sql`의 `update_artist_from_festival_admin` 함수는 운영 DB에 남아 있지만, 페스티벌 관리 화면은 더 이상 이 함수를 호출하지 않는다. 기존 아티스트 공통정보 수정은 아티스트 관리 페이지에서만 수행한다.
- `033_discord_festival_update_drafts.sql`은 기존 축제에 매칭된 Discord JSON을 `festival_update_drafts`에 보관한다. Bot은 초안 생성만 하고 관리자가 해당 페스티벌의 기본정보·라인업·티켓 탭에서 검토·반영한다.
- `041_staged_existing_festival_updates.sql`은 기존 수정 초안의 단계·선택·기준 버전을 저장하고, `finalize_festival_update_draft`로 마지막에 한 번만 반영한다. 2026-07-22 운영 적용을 확인했다.

### 아티스트

- 아티스트 `normalized_name`은 특수문자와 한글을 제거하고 영문 소문자와 숫자만 남긴다.
- 포스터 원문은 `input_name`, 한글 독음과 다른 표기는 `artist_aliases`에 보존한다.

운영 DB의 `public.normalize_artist_name(text)`는 현재 한글도 유지하며 아티스트 본체와 별칭 정규화에 함께 쓰인다. 본체 규칙을 수정할 때 한글 별칭 검색이 사라지지 않도록 별칭 정규화 책임을 분리해야 한다.

코드 공통 원본은 `operations/discord-instagram-bot/src/nameNormalization.js`이고 웹은 `lib/normalizedName.ts`와 `lib/artists/normalizeArtistName.ts`를 통해 사용한다.

## 페이지·테이블 연결표

| 페이지 또는 실행 주체 | 직접/간접 조회 | 변경 경로 |
|---|---|---|
| 공개 달력 `/` | `festivals` | 없음 |
| 축제 상세 `/festival/[id]` | `festivals`, `festival_artists`, `artists`, `festival_ticket_rounds` | 없음 |
| 아티스트 상세 `/artist/[id]` | `artists`, `festival_artists`, 연결된 `festivals` | 없음 |
| 축제 관리 `/admin/festivals` | `festivals` | 삭제 시 `delete_festival_with_audit` |
| 축제 신규 등록 `/admin/festivals/new` | 중복 확인용 `festivals` | `create_festival_with_audit` |
| 축제 관리 `/admin/festivals/[id]/lineup` | 정식 축제·라인업·티켓, `audit_events`와 연결된 `audit_changes` | 기본정보·라인업·티켓·썸네일 감사 RPC |
| 기존 축제 수정 작업함 `/admin/festival-updates` | `festival_update_drafts`, 연결된 `festivals` | 단계 작업 링크 제공 |
| 기존 축제 단계형 수정 `/admin/festivals/import-json` | `festivals`, `artists`, `festival_artists`, `festival_ticket_rounds`, `festival_update_drafts`, `audit_events`, `audit_changes` | `finalize_festival_update_draft` |
| 라인업 import `/admin/festivals/import` | `festivals`, `artist_aliases` | `import_festival_lineup` |
| XLSX 전체 import `/admin/import` | `festivals`, `festival_artists`, `artist_aliases` | `import_festival_from_xlsx` |
| 신규 등록 작업함 `/admin/festival-candidates` | `festival_candidates`, `festivals`, `festival_artists`, `festival_ticket_rounds`, `audit_events`, `audit_changes` | `approve_new_festival_candidate` |
| 아티스트 관리 `/admin/artists` | `artists`, `artist_aliases` | 아티스트 감사 RPC |
| 아티스트 Excel 수정 `/admin/artists/import-update` | `artists`, `artist_aliases` | `update_artists_from_excel` |
| Discord Bot | `festivals`, `artists`, `artist_aliases`, `festival_artists`, `festival_candidates`, `festival_update_drafts` | 신규·기존 전용 초안 RPC |

## 1. festivals

정식 축제의 기준 테이블이다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | sequence | 축제 PK |
| `name` | text | NO | 없음 | 표시 축제명 |
| `start_date` | date | NO | 없음 | 시작일·식별값 |
| `end_date` | date | NO | 없음 | 종료일·식별값 |
| `location` | text | YES | 없음 | 행사장명 |
| `category` | text | YES | 없음 | 축제 분류 |
| `description` | text | YES | 없음 | 축제 소개 |
| `price_info` | text | YES | 없음 | 기본 가격 안내 |
| `program_info` | text | YES | 없음 | 프로그램 안내 |
| `source_url` | text | YES | 없음 | 정보 출처 URL |
| `confidence_score` | integer | YES | `60` | 구형 수집 신뢰도 |
| `verification_status` | text | YES | `pending` | 검증 상태 |
| `created_at` | timestamptz | YES | `now()` | 생성 시각 |
| `updated_at` | timestamptz | YES | `now()` | 수정 시각 |
| `address` | text | YES | 없음 | 상세 주소 |
| `region` | text | YES | 없음 | 지역 |
| `official_url` | text | YES | 없음 | 공식 사이트 |
| `status` | text | YES | `scheduled` | 예정·진행·종료·취소 |
| `thumbnail_url` | text | YES | 없음 | 대표 이미지 경로 |
| `timetable_status` | text | NO | `published` | 타임테이블 전체 공개·미공개 상태 (Migration 037 적용) |
| `price_type` | text | YES | 없음 | 무료·유료 구분 |
| `slug` | text | YES | 없음 | URL용 식별자 |
| `search_aliases` | text | YES | 없음 | 검색 보조 별칭 |
| `normalized_name` | text | NO | 없음 | 정규화 축제명·식별값 |

식별 기준은 `normalized_name + start_date + end_date` 복합 unique다. `name`과 `search_aliases`는 검색 보조값일 뿐 동일 축제 확정 기준이 아니다.

주요 코드:

- `components/Calendar.tsx`, `components/calendar/FestivalSearch.tsx`
- `lib/hooks/useFestivalDetail.ts`
- `lib/hooks/useFestivalDuplicateCheck.ts`
- `lib/festivals/getFestivalLineupData.ts`
- 관리자 축제 목록·등록·import 화면
- Discord Bot `src/bot.js`

## 2. festival_artists

축제별 아티스트 공연 한 건을 저장한다. 같은 아티스트의 여러 날짜·시간 공연을 허용한다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `festival_id` | bigint | NO | 없음 | `festivals.id` FK |
| `artist_id` | bigint | NO | 없음 | `artists.id` FK |
| `performance_date` | date | YES | 없음 | 공연일 |
| `performance_time` | time | YES | 없음 | 시작 시간 |
| `stage_name` | text | YES | 없음 | 무대명 |
| `status` | text | YES | `confirmed` | 예정·확정·취소 |
| `source_url` | text | YES | 없음 | 라인업 출처 |
| `created_at` | timestamptz | YES | `now()` | 생성 시각 |
| `performance_end_time` | time | YES | 없음 | 종료 시간 |
| `id` | bigint | NO | identity | 공연 행 PK |
| `input_name` | text | YES | 없음 | 신규 연결 때 확정한 최초 포스터 표기 (Migration 037 적용) |

사용 페이지·함수:

- 축제 상세, 아티스트 상세
- `/admin/festivals/[id]/lineup`
- `/admin/festivals/import-json`, `/admin/import`
- `addFestivalArtist`, `updateFestivalArtist`, `deleteFestivalArtist`
- `import_festival_lineup`, `apply_lineup_work_with_audit`, JSON 업데이트 RPC
- Discord Bot의 기존 라인업 비교

애플리케이션 시간 표준은 `HH:MM`이며 DB의 `HH:MM:SS` 반환값은 `normalizeMinuteTime`으로 통일해야 한다.

## 3. festival_ticket_rounds

축제별 티켓 판매 회차다. 운영 DB의 ordinal 6과 10은 과거 삭제 칼럼 자리라 현재 칼럼이 아니다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | identity | 티켓 PK |
| `festival_id` | bigint | NO | 없음 | `festivals.id` FK |
| `round_type` | text | YES | 없음 | 판매 회차 종류 |
| `round_name` | text | NO | 없음 | 회차 표시명 |
| `open_at` | timestamptz | YES | 없음 | 판매 시작 시각 |
| `price_info` | text | YES | 없음 | 가격 정보 |
| `ticket_url` | text | YES | 없음 | 예매 URL |
| `ticket_platform` | text | YES | 없음 | 판매처 |
| `created_at` | timestamptz | NO | `now()` | 생성 시각 |
| `updated_at` | timestamptz | NO | `now()` | 수정 시각 |

사용 페이지·함수:

- 축제 상세 티켓 영역
- `/admin/festivals/[id]/lineup`
- `/admin/festivals/import-json`
- 신규 작업함의 티켓 discovery 비교
- `change_festival_ticket_with_audit`, 기존 축제 JSON 업데이트 RPC

## 4. artists

정식 아티스트 기준 테이블이다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | sequence | 아티스트 PK |
| `name` | text | NO | 없음 | 공식 표시명 |
| `genre` | text | YES | 없음 | 장르 |
| `created_at` | timestamptz | YES | `now()` | 생성 시각 |
| `normalized_name` | text | NO | 없음 | 검색·중복 판별값, unique |
| `artist_type` | text | YES | 없음 | 아티스트 유형 |
| `image_url` | text | YES | 없음 | 프로필 이미지 |

사용 페이지·함수:

- `/admin/artists`, `/admin/artists/import-update`
- `delete_artist_admin`: 라인업 연결이 없는 아티스트만 별칭과 함께 감사 기록 후 삭제
- `/artist/[id]`, 축제 상세·라인업 관리
- `matchFestivalDraftArtists`, `searchArtists`
- 기존 축제 JSON 업데이트의 ID 매칭
- Discord Bot 아티스트 매칭

## 5. artist_aliases

아티스트 별칭과 검색용 정규화 별칭이다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | identity | 별칭 PK |
| `artist_id` | bigint | NO | 없음 | `artists.id` FK |
| `alias_name` | text | NO | 없음 | 표시 별칭 |
| `normalized_alias` | text | NO | 없음 | 검색용 별칭 |
| `created_at` | timestamptz | NO | `now()` | 생성 시각 |

사용 페이지·함수:

- `/admin/artists`, `/admin/artists/import-update`
- 라인업 import와 XLSX import
- `searchArtists`, `getFestivalLineupData`
- Discord Bot 아티스트 매칭

## 6. festival_candidates

관리자 검수 전 신규 축제 JSON과 원본 자료를 보관하는 작업함이다. 기존 축제 수정은 `festival_update_drafts`로 분리한다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | identity | 후보 PK |
| `title` | text | NO | 없음 | 작업 제목 |
| `source_url` | text | YES | 없음 | Instagram 등 원본 URL |
| `source_type` | text | YES | 없음 | 출처 종류 |
| `raw_text` | text | YES | 없음 | OCR·캡션 원문 |
| `festival_name` | text | YES | 없음 | 후보 축제명 |
| `start_date` | date | YES | 없음 | 후보 시작일 |
| `end_date` | date | YES | 없음 | 후보 종료일 |
| `location` | text | YES | 없음 | 후보 행사장 |
| `category` | text | YES | 없음 | 후보 분류 |
| `score` | integer | YES | `0` | 후보 신뢰도 |
| `status` | text | NO | `pending` | pending·approved·rejected |
| `reject_reason` | text | YES | 없음 | 반려 사유 |
| `reviewed_at` | timestamptz | YES | 없음 | 검수 시각 |
| `created_at` | timestamptz | YES | `now()` | 생성 시각 |
| `updated_at` | timestamptz | YES | `now()` | 수정 시각 |
| `festival_id` | bigint | YES | 없음 | 승인 후 정식 축제 FK |
| `draft_json` | jsonb | YES | 없음 | 전체 축제 후보 JSON |
| `source_assets` | jsonb | NO | `[]` | 포스터 등 원본 파일 정보 |
| `review_notes` | text | YES | 없음 | 관리자 검수 메모 |
| `reviewed_by` | uuid | YES | 없음 | 검수 관리자 |
| `work_type` | text | NO | `new` | 신규·판별 확인용. Migration 041 이후 update 저장 차단 |
| `announcement_round` | text | NO | `unspecified` | 1차·2차·최종 발표 구분 |
| `version_number` | integer | NO | `1` | 같은 URL의 생성 버전 |
| `parent_candidate_id` | bigint | YES | 없음 | 이전 버전 자기참조 FK |
| `created_by` | uuid | YES | 없음 | 후보 생성 계정·Bot |
| `comparison_json` | jsonb | NO | `{}` | 기존·추가·삭제후보 비교 결과 |

연결:

- `/admin/festival-candidates`
- Discord Bot의 URL 중복 확인 및 `create_discord_festival_candidate`
- 승인 RPC `approve_festival_candidate`
- Storage `festival-candidate-posters`

Bot과 화면의 신규 전용 분기를 수정했고, Migration 030을 운영 DB에 적용해 RPC도 신규 작업만 허용한다.

Migration 037~039는 2026-07-22 운영 DB에 적용했다. 최종 승인 시 후보 원문 제거, 타임테이블 상태·신규 연결 `input_name` 반영, Discord 수집 초안 RPC를 제공한다. 파일 객체 삭제와 정식 썸네일 승격은 애플리케이션에서 처리한다.

승인된 `festival_candidates` 행은 삭제하지 않고 신규 등록 이력으로 남긴다. `status = approved`와 `festival_id`로 정식 `festivals` 행을 가리키며, OCR·JSON·임시 이미지 메타데이터는 제거한다. Migration 040은 승인 완료 행을 읽기 전용으로 잠그고 임시저장 때문에 `pending`으로 잘못 돌아간 신규 등록 이력을 복구한다. 운영 적용을 확인했다.

## 6-1. festival_update_drafts

기존 페스티벌 수정 전용 임시작업이다. `source_url`과 대상 `festival_id`를 유지하고, `draft_json`, `workflow_json`, `selection_json`에 최종 확정 전 작업을 보관한다. `base_festival_updated_at`과 `base_data_hash`는 시작 당시 기본정보·아티스트 연결·타임테이블·티켓을 묶어 검사한다.

- 작업함: `/admin/festival-updates`
- 단계 화면: `/admin/festivals/import-json?festivalId=...&updateDraftId=...`
- 최종 RPC: `finalize_festival_update_draft`
- 완료 시 운영 변경과 감사 이벤트를 한 트랜잭션으로 반영하고 JSON·선택 내용을 제거하며 URL만 남긴다.
- Migration 041은 기존 `festival_candidates.work_type = update` 대기 작업을 이 테이블로 옮기고 이후 혼입을 차단한다. 2026-07-22 운영 적용을 확인했다.

## 7. audit_events

한 번의 관리자 변경 작업을 나타내는 감사 헤더다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | identity | 감사 이벤트 PK |
| `actor_id` | uuid | YES | 없음 | 작업 사용자 |
| `actor_name` | text | NO | 없음 | 작업자 표시명 |
| `action_type` | text | NO | 없음 | 작업 종류 |
| `festival_id` | bigint | YES | 없음 | 관련 축제 |
| `festival_name` | text | YES | 없음 | 당시 축제명 |
| `created_at` | timestamptz | NO | `now()` | 작업 시각 |
| `work_type` | text | YES | 없음 | 발표·정정 등 작업 분류 |
| `lineup_round` | text | YES | 없음 | 라인업 차수 |
| `announcement_date` | date | YES | 없음 | 공식 발표일 |
| `source_url` | text | YES | 없음 | 출처 URL |
| `reason` | text | YES | 없음 | 정정 사유 |
| `source_type` | text | YES | 없음 | 출처 종류 |
| `source_file_name` | text | YES | 없음 | 원본 파일명 |
| `note` | text | YES | 없음 | 작업 메모 |
| `target_type` | text | YES | 없음 | 축제·아티스트 등 대상 종류 |
| `target_id` | text | YES | 없음 | 대상 ID |
| `target_label` | text | YES | 없음 | 대상 표시명 |
| `transaction_id` | bigint | NO | `txid_current()` | 같은 트랜잭션 묶음 |
| `baseline_key` | text | YES | 없음 | 초기 기준 기록 중복 방지 |
| `audit_summary` | jsonb | YES | 없음 | 유지·추가·변경·삭제 요약 |

연결:

- `/admin/festivals/[id]/lineup`의 `AuditHistoryTab`
- 축제 생성·수정·삭제, 직접 라인업, 티켓, 썸네일, 기존 JSON 업데이트 RPC
- 아티스트 및 별칭 DB trigger·감사 RPC

## 8. audit_changes

`audit_events` 한 건에 속한 실제 변경 전후 값이다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | identity | 변경 PK |
| `event_id` | bigint | NO | 없음 | `audit_events.id` FK |
| `entity_type` | text | NO | 없음 | 변경 대상 종류 |
| `entity_id` | text | YES | 없음 | 변경 대상 ID |
| `entity_label` | text | NO | 없음 | 대상 표시명 |
| `operation` | text | NO | 없음 | insert·update·delete |
| `before_data` | jsonb | YES | 없음 | 변경 전 스냅샷 |
| `after_data` | jsonb | YES | 없음 | 변경 후 스냅샷 |
| `created_at` | timestamptz | NO | `now()` | 생성 시각 |

`AuditHistoryTab`이 `audit_events` 조회 시 관계 데이터로 함께 읽으며, 감사 RPC가 기록한다.

## 9. festival_update_logs (034 적용 후 삭제)

Migration 020에서 만든 초기 기존 축제 JSON 업데이트 로그다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | identity | 로그 PK |
| `festival_id` | bigint | NO | 없음 | 관련 축제 |
| `updated_by` | uuid | NO | `auth.uid()` | 작업자 |
| `source_type` | text | YES | 없음 | 출처 종류 |
| `source_url` | text | YES | 없음 | 출처 URL |
| `source_file_name` | text | YES | 없음 | 파일명 |
| `changes` | jsonb | NO | `[]` | 변경 목록 |
| `created_at` | timestamptz | NO | `now()` | 작업 시각 |

034 적용 시 기존 행을 `audit_events/audit_changes`로 이관한 뒤 테이블을 삭제한다. `/admin/festivals/import-json`의 최근 기록도 `audit_events`를 조회한다.

## 10. profiles

Supabase Auth 사용자와 애플리케이션 역할을 연결한다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | uuid | NO | 없음 | `auth.users.id`와 1:1 |
| `role` | text | NO | `user` | user·admin·bot |
| `created_at` | timestamptz | NO | `now()` | 생성 시각 |
| `updated_at` | timestamptz | NO | `now()` | 수정 시각 |
| `display_name` | text | NO | `사용자` | 감사 로그 작업자명 |

페이지가 직접 읽기보다 `is_admin()`, `is_festival_bot()`, RLS와 감사 함수가 사용한다. Discord Bot 계정은 `bot`, 운영자는 `admin` 역할이다.

## 11. pipeline_runs

구형 크롤링 파이프라인 실행 기록이다.

| 칼럼 | 타입 | NULL | 기본값 | 역할 |
|---|---|---:|---|---|
| `id` | bigint | NO | sequence | 실행 PK |
| `started_at` | timestamptz | YES | `now()` | 시작 시각 |
| `finished_at` | timestamptz | YES | 없음 | 종료 시각 |
| `status` | text | YES | 없음 | 실행 상태 |
| `articles_added` | integer | YES | 없음 | 추가 기사 수 |
| `notes` | text | YES | 없음 | 실행 메모 |

현재 `app`, `lib`, `crawler`, Discord Bot 코드에서 사용처가 확인되지 않았다. 삭제하지 말고 미사용 후보로 유지하며 과거 외부 작업이 쓰는지 확인해야 한다.

## DB 객체 중복·정리 점검 결과

1. `festival_update_logs` 중복 문제는 034에서 이관·삭제한다.
2. `pipeline_runs`는 현재 저장소 사용처가 없다.
3. migration 번호 `018`이 두 파일에서 중복된다.
4. `festival_candidates.work_type = update` 혼입 문제는 041에서 기존 수정 작업함으로 이전하고 이후 저장을 차단했다.
5. `approve_festival_candidate`와 `import_festival_json`은 034에서 감사형 신규 승인 함수로 대체 후 삭제한다.
8. `festival_ticket_rounds`와 `festivals`의 ordinal 번호 공백은 삭제된 과거 칼럼 자리이며 중복 칼럼이 아니다.

정리 후보는 호출·데이터 보존 여부를 확인하기 전 삭제하지 않는다.
