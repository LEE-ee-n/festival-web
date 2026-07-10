# Festival Database V1

## 테이블

- festivals: 공개 축제 정보
- artists: 아티스트 정보
- festival_artists: 축제와 아티스트 연결
- festival_candidates: 크롤링 후보
- pipeline_runs: 크롤링 실행 기록

## 관계

festivals 1 ── N festival_artists N ── 1 artists

festival_candidates.festival_id
→ festivals.id

## 공개 범위

| 테이블 | anon SELECT |
|---|---|
| festivals | 허용 |
| artists | 허용 |
| festival_artists | 허용 |
| festival_candidates | 차단 |
| pipeline_runs | 차단 |

## 주요 제한

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

## 중복 방지

- festivals.source_url UNIQUE
- festivals.slug UNIQUE
- festivals: 축제명 + 시작일 + 장소 UNIQUE
- artists.normalized_name UNIQUE
- festival_artists: festival_id + artist_id 복합 기본키
- festival_candidates.source_url UNIQUE

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