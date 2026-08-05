# [구현·운영 DB 적용 완료·화면 확인 대기] 축제 지역 2글자 표준 접두어·선택 세부지역 검증

## 목적과 완료 조건

- `festivals.region`은 17개 표준 광역지역 중 하나의 **2글자 접두어**로 시작하도록 통일한다.
- 값은 `서울`처럼 광역지역만 쓰거나 `충남 아산시`처럼 `광역지역 + 공백 + 세부지역`을 쓸 수 있다.
- `충남아산시`, `서울특별시`, `창원`, `해외`처럼 접두어가 없거나 공백 규칙을 지키지 않은 값은 신규·수정 저장에서 오류로 막는다.
- 공개 지역 필터는 세부지역 유무와 관계없이 첫 광역지역으로 정확히 분류한다.

## 확정 범위

- 표준 접두어: `서울`, `경기`, `인천`, `강원`, `대전`, `세종`, `충북`, `충남`, `광주`, `전북`, `전남`, `대구`, `경북`, `부산`, `울산`, `경남`, `제주`.
- 지역은 필수다. 빈값·공백값도 규칙 위반으로 저장하지 않는다.
- 세부지역은 필터 선택지로 추가하지 않으며, 표시·검색용 원문으로만 보존한다.
- 기존 데이터는 자동 수정하지 않는다. 먼저 아래 운영 DB SQL로 위반 행을 추린 뒤 관리자가 올바른 값으로 수동 수정하고, 그 다음 DB 제약을 적용한다.
- 검증은 프런트엔드 공통 payload와 운영 DB 저장 경계(RPC/제약) 양쪽에 둔다. 어떤 등록·기존 수정·후보 최종 반영 경로도 우회하지 못해야 한다.

## 운영 DB 사전 점검 SQL

```sql
select coalesce(nullif(btrim(region), ''), '(비어 있음)') as region, count(*) as festival_count
from public.festivals
group by 1
order by festival_count desc, region;

select id, name, region, status
from public.festivals
where region is null
   or btrim(region) = ''
   or btrim(region) !~ '^(서울|경기|인천|강원|대전|세종|충북|충남|광주|전북|전남|대구|경북|부산|울산|경남|제주)( [^[:space:]].*)?$'
order by id;
```

## 예상 수정 파일·데이터 흐름

- `lib/festivals/regionValidation.ts` (신규): 표준 접두어 목록, 공백 정리, 유효성 검사, 필터용 광역지역 추출을 단일 원본으로 제공.
- `lib/festivals/publicFestivalOverview.ts`: 별칭 완전 일치 방식 대신 공통 추출 함수를 사용해 `충남 아산시`도 `충남` 필터에 포함.
- `lib/festivals/festivalBasicInfoPayload.ts`, `lib/festivals/updateFestivalBasicInfo.ts`, `lib/festivals/createFestival.ts`: 저장 전 공통 오류를 사용자에게 표시.
- 후보 최종 반영·기존 수정 RPC를 갱신하는 새 migration: DB에서도 같은 정규식/검증 함수를 적용한다. 위반 행을 전부 수동 정리한 뒤 `festivals.region`의 `NOT NULL` 및 CHECK 제약을 적용해 모든 저장 경로를 막는다.
- `tests/regionValidation.test.ts`, `tests/publicFestivalOverview.test.ts`, 기존 기본정보 payload 테스트: 광역지역 단독·세부지역·공백·잘못된 접두어·필터 회귀를 검증.
- `DATABASE.md`, `PROJECT_STATUS.md`, 이 계획 문서: 실제 적용 결과와 운영 DB 위반 행 처리 상태를 기록.

데이터 흐름: 관리자 입력 → 공통 지역 검증·공백 정리 → 저장 payload → RPC의 동일 규칙 검증 → `festivals.region` 저장 → 공개 필터가 첫 2글자 광역지역 추출.

## 작업 순서

- [x] 운영 DB 집계 SQL을 실행해 현재 지역값과 위반 행을 추린다. — 위반 행 개별 수정 후 재조회 `Success. No rows returned` 확인
- [x] 공통 지역 규칙·필터 추출 함수를 작성하고 단위 테스트를 추가한다.
- [x] 신규 등록·기존 기본정보 수정의 저장 전 오류와 입력 안내를 연결한다.
- [x] 기존 위반 행을 SQL 결과로 수동 정정하고, 재조회 결과가 0건인지 확인한다.
- [x] 모든 저장 경로에 적용되는 trigger와 `festivals.region` NOT NULL·CHECK 제약을 Migration 053으로 작성하고 운영 DB 적용을 확인한다.
- [x] 전체 테스트 228개, TypeScript, 관련 ESLint를 확인한다.
- [ ] localhost PC·모바일에서 필터와 저장 오류를 확인한다. — 브라우저 보안 정책으로 자동 확인 불가

## 실제 결과

- 기존 규칙 위반 행은 관리자가 개별 수정했고 동일 조회 SQL이 `Success. No rows returned`를 반환했다.
- 운영 DB에 Migration 053을 적용해 빈 지역과 잘못된 형식을 모든 저장 경로에서 거부한다.
- `regionValidation.ts`가 17개 접두어·저장 검증·필터 추출의 웹 공통 원본을 제공한다.
- 관리자 입력 안내와 저장 전 오류를 추가했고 `충남 아산시`는 원문을 보존한다.
- 공개 지역 필터는 `충남 아산시`, `경남 창원시`를 각각 `충남`, `경남`으로 분류한다.
- 운영 스키마에서 Supabase 타입을 재생성했고 `region: string` 및 새 검증 함수가 반영됐다.
- 전체 테스트 228개, `tsc --noEmit`, 관련 파일 ESLint가 통과했다.

## 회귀 위험과 검증 방법

- `충남 아산시`, `경남 창원시`는 각각 `충남`, `경남` 필터에 보여야 한다.
- `서울`처럼 세부지역 없는 값은 계속 저장·필터 가능해야 한다.
- `충남아산시`, `서울특별시`, `창원`, `해외`는 저장 전에 구체적 오류가 보여야 하며 DB RPC로도 저장되지 않아야 한다.
- 정리 후에는 빈 지역과 규칙 위반 지역이 어떤 저장 경로에서도 들어오면 안 된다.
- 공개 필터의 `전체 지역`, 상태 필터 교차, 모바일 배치가 유지되어야 한다.

## 후속 개선점

- 기존 지역 누락·위반 행을 관리자 데이터 점검판의 별도 항목으로 노출할지는 실제 위반 수를 본 뒤 별도 계획으로 결정한다.
