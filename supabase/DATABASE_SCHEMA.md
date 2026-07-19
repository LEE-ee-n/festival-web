# Festival Database V1

## 검증 기준

- 칼럼: 2026-07-17 운영 DB 조회 결과와 대조 완료
- RLS 정책: 2026-07-17 운영 DB 조회 결과와 대조 완료
- 인덱스, 외래키, 트리거: `004_database_v1.sql` 기준이며 운영 DB 실측은 별도 필요

## 테이블

- festivals: 공개 축제 정보
- artists: 아티스트 정보
- festival_artists: 축제와 아티스트 연결
- festival_candidates: 크롤링 후보
- pipeline_runs: 크롤링 실행 기록
- profiles: 로그인 사용자 프로필 및 관리자 역할
- artist_aliases: 아티스트 별칭
- festival_ticket_rounds: 축제 티켓 판매 회차

## 관계

festivals 1 ── N festival_artists N ── 1 artists

auth.users 1 ── 1 profiles

festival_candidates.festival_id
→ festivals.id

## JSON 등록 규칙

- 필수값은 축제명, 시작일, 종료일이다.
- 출연진과 티켓 배열은 비어 있어도 축제 기본정보를 먼저 등록할 수 있다.

## 공개 범위

| 테이블 | anon SELECT |
|---|---|
| festivals | 승인되고 취소되지 않은 축제만 허용 |
| artists | 허용 |
| artist_aliases | 허용 |
| festival_artists | 공개 축제의 scheduled/confirmed 일정만 허용 |
| festival_ticket_rounds | 공개 축제의 티켓 회차만 허용 |
| festival_candidates | 차단 |
| pipeline_runs | 차단 |

## 주요 제한

### profiles.role

- admin: 관리자
- user: 일반 사용자

관리자 판별은 `public.is_admin()`을 사용한다.

일반 사용자는 자신의 프로필만 읽을 수 있으며 `role`을 직접 수정할 수 없다.
관리자 지정은 서비스 역할 또는 SQL Editor에서 처리한다.

### festivals.category

- music_festival
- local_festival
- food_festival
- culture_festival
- other

### festivals.status

- scheduled
- ongoing
- ended
- cancelled
- `014_automatic_festival_status.sql`이 한국시간 매일 00:05에 날짜 기준으로 자동 갱신
- `015_immediate_festival_status_trigger.sql`이 등록과 날짜·상태 수정 시 즉시 같은 규칙을 적용
- cancelled는 관리자가 지정한 상태를 유지하며 자동 갱신에서 제외

### festivals.verification_status

- pending
- approved
- rejected

### festivals.price_type

- free
- paid
- partial_free
- unknown

### festival_artists.status

- scheduled
- confirmed
- cancelled

### festival_candidates.status

- pending
- approved
- rejected

### festival_candidates 검토 자료

- draft_json: 최종 등록 전 축제·출연진·티켓 전체 JSON 초안
- source_assets: 수동 업로드 이미지와 추가 출처 메타데이터
- review_notes: 관리자 검토 메모
- reviewed_by: 마지막 승인·거절 관리자
- source_url: 수동 수집 자료를 위해 선택값 허용

## 중복 방지

- festivals.source_url UNIQUE
- festivals.slug UNIQUE
- festivals: normalized_name + 시작일 + 종료일 UNIQUE
  - normalized_name은 NOT NULL, 영문 소문자와 숫자만 허용 (`^[a-z0-9]+$`)
  - 과거 normalized_name 단독 UNIQUE는 013에서 제거
- artists.normalized_name UNIQUE
  - NOT NULL, 영문 소문자와 숫자만 허용 (`^[a-z0-9]+$`)
  - 016에서 기존 데이터의 누락·형식 오류·중복을 다시 검사한 뒤 제약을 재확정
- festival_artists: festival_id + artist_id 복합 기본키
- festival_candidates.source_url UNIQUE
- festival_ticket_rounds: 축제 + 회차명 + 오픈시간 + 판매처 + URL UNIQUE
  - URL이 없는 티켓은 여러 개 허용

## 운영 DB에서 확인된 보조 칼럼

- profiles.created_at, profiles.updated_at
- festivals.search_aliases, festivals.normalized_name
- festival_artists.performance_end_time

## 적용된 제약 및 설정

- 컬럼 추가
- CHECK 제약조건
- UNIQUE 인덱스
- 일반 인덱스
- festival_candidates 생성
- 외래키 설정
- updated_at 자동 갱신 트리거
- RLS 활성화
- 공개 SELECT 정책 설정
