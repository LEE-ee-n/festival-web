# [구현 완료·실제 응답 확인 대기] SEO·GEO 구현 검토 결함 수정

## 목적과 완료 조건

`2026-08-04-seo-geo-implementation-report.md` 검토에서 확인된 공개 판정, 조회 오류 처리, sitemap 안정성, 아티스트 구조화 데이터 의미 오류를 수정한다.

완료 조건:

1. 공개 승인 축제의 유효한 출연 이력이 없는 아티스트 상세 URL은 실제 404를 반환한다.
2. 축제·아티스트 상세의 하위 데이터 조회 실패가 빈 데이터로 표시되지 않고 서버 오류로 처리된다.
3. SEO 메타데이터 조회 실패가 미존재·비공개로 오인되지 않는다.
4. sitemap DB 조회 실패 시 불완전한 sitemap을 성공 응답으로 생성하지 않는다.
5. 아티스트 JSON-LD `sameAs`에는 아티스트 정체성을 나타내는 공식 프로필만 포함한다.
6. 관련 회귀 테스트, TypeScript 검사, 관련 파일 ESLint와 `git diff --check`가 통과한다.

## 확정 범위

### 1. 아티스트 공개 판정 통일

- 아티스트 상세 페이지와 메타데이터가 같은 공개 기준을 사용하도록 맞춘다.
- 공개 기준은 다음을 모두 만족하는 출연 이력이 1건 이상 있는 경우다.
  - 라인업 상태가 `scheduled` 또는 `confirmed`
  - 연결 축제가 `approved`
  - 연결 축제가 `scheduled`, `ongoing`, `ended` 중 하나
- 아티스트 행은 존재하지만 공개 출연 이력이 없으면 `getPublicArtistDetail`이 `null`을 반환하고 페이지가 `notFound()`를 실행한다.

### 2. 조회 오류와 정상적인 빈 결과 분리

- `getPublicFestivalDetail`의 라인업·티켓 쿼리 오류를 검사하고 오류가 있으면 throw한다.
- `getPublicArtistDetail`의 출연 축제 쿼리 오류도 throw한다.
- `getPublicFestivalSeoData`와 `getPublicArtistSeoData`에서 DB 오류는 throw하고, 조회 성공 후 대상 없음만 `null`로 반환한다.
- 정상적으로 라인업·티켓이 0건인 경우에는 기존처럼 빈 배열을 허용한다.

### 3. sitemap 실패 처리

- 축제 또는 아티스트 출연 목록 쿼리가 실패하면 오류를 throw한다.
- DB 연결 설정 자체가 없는 경우의 정적 sitemap 반환 정책은 기존 동작을 유지한다.
- 일시 장애 결과가 동적 URL 없는 정상 sitemap으로 캐시되지 않도록 한다.

### 4. 아티스트 JSON-LD `sameAs` 수정

- `featured_playlist_url`을 `sameAs`에서 제외한다.
- 현재 저장 데이터 중 정체성을 나타내는 공식 프로필인 Instagram URL만 안전한 URL일 때 포함한다.
- 추천 플레이리스트의 공개 화면 링크 기능은 변경하지 않는다.
- 공식 YouTube 채널 전용 필드는 이번 범위에서 추가하지 않는다.

### 5. 보고서와 테스트 수치 정정

- 현재 SEO 테스트 수와 새로 추가한 회귀 테스트 수를 실제 결과로 기록한다.
- 수정 완료 후 기존 SEO·GEO 구현 보고서의 검증 결과와 남은 수동 확인 항목을 갱신한다.

## 제외 범위

- 아티스트 사진 저장과 Storage
- 타임테이블 상태 저장
- Instagram 관리자 입력 검증
- 관리자 UI와 DB migration
- `/festivals` 목록 페이지 서버 렌더링
- Search Console·네이버 서치어드바이저 제출
- SEO 목적과 무관한 리팩터링

## 예상 수정 파일과 데이터 흐름

- `lib/artists/getPublicArtistDetail.ts`
- `lib/festivals/getPublicFestivalDetail.ts`
- `lib/publicSeoData.ts`
- `app/sitemap.ts`
- `lib/seo.ts`
- `tests/seo.test.ts`
- 필요 시 공개 판정·오류 분리 테스트를 위한 최소 보조 모듈과 테스트
- `plans/2026-08-04-seo-geo-implementation-report.md`
- `PROJECT_STATUS.md`

아티스트 상세:

`route ID 검증 → 공개 출연 이력 조회 → 조회 오류면 throw → 공개 이력 없음이면 null → 아티스트 조회 → 페이지 렌더링 또는 404`

축제 상세:

`공개 축제 조회 → 없음이면 null → 라인업·티켓 병렬 조회 → 하나라도 오류면 throw → 모두 성공하면 실제 배열로 렌더링`

sitemap:

`공개 축제·아티스트 출연 목록 병렬 조회 → 하나라도 오류면 throw → 모두 성공한 경우에만 동적 URL 포함 sitemap 생성`

## 작업 순서

1. 공개 아티스트 판정과 JSON-LD `sameAs` 회귀 테스트를 추가한다.
2. 아티스트 상세 로더의 공개 조건과 오류 처리를 SEO 로더와 일치시킨다.
3. 축제 상세·SEO 데이터 로더에서 오류와 정상 빈 결과를 분리한다.
4. sitemap 쿼리 오류를 성공 응답으로 변환하지 않도록 수정한다.
5. 추천 플레이리스트를 아티스트 `sameAs`에서 제외한다.
6. 관련 테스트, TypeScript 검사, 관련 파일 ESLint, `git diff --check`를 실행한다.
7. 가능한 경우 localhost에서 공개 아티스트·비공개 아티스트·없는 ID의 응답을 확인한다.
8. SEO·GEO 구현 보고서와 `PROJECT_STATUS.md`에 실제 결과와 미검증 항목을 기록한다.
9. 계획 제목에 `[완료]`를 표시한다.

## 회귀 위험과 검증 방법

- 위험: 공개 판정을 강화하면서 정상 공개 아티스트까지 404가 될 수 있다.
  - 검증: 승인 축제 출연, 취소 라인업만 존재, 비승인 축제만 존재, 출연 이력 없음 사례를 구분한다.
- 위험: DB 오류 throw가 Next.js에서 404로 변환될 수 있다.
  - 검증: 로더의 `null` 반환 경로와 예외 경로를 분리해 확인한다.
- 위험: sitemap 오류 처리 변경이 정적 페이지까지 제거할 수 있다.
  - 검증: DB 미설정 정책과 DB 쿼리 실패 정책을 각각 확인한다.
- 위험: `sameAs` 제거로 아티스트 JSON-LD 테스트 기대값이 달라진다.
  - 검증: Instagram은 유지되고 추천 플레이리스트만 제외되는지 확인한다.
- 위험: ISR 환경에서 오류 응답이 캐시될 수 있다.
  - 검증: 성공 데이터만 정상 sitemap·상세 응답으로 생성되고 오류는 성공 결과로 반환되지 않는지 확인한다.

## 후속 개선점

- 공식 YouTube 채널 URL 전용 필드가 생기면 `sameAs`에 추가한다.
- Supabase 로더 테스트를 위한 공통 테스트 주입 구조는 필요성이 커질 때 별도 검토한다.
- 배포 후 실제 HTML, 404 응답, 리치 결과와 sitemap은 기존 보고서의 수동 검증 항목으로 유지한다.

## 실제 결과

- 아티스트 상세 로더에 메타데이터와 동일한 공개 출연 조건을 적용해 공개 이력이 없으면 404 경로로 이동하도록 수정했다.
- 축제·아티스트 상세, SEO 데이터, sitemap의 Supabase 오류를 정상 빈 결과와 분리해 throw하도록 수정했다.
- 추천 플레이리스트는 공개 화면 링크로 유지하고 아티스트 JSON-LD `sameAs`에서는 제외했다.
- 전체 테스트 211개, SEO 테스트 13개, TypeScript 검사, 관련 파일 ESLint와 `git diff --check`가 통과했다.
- localhost 아티스트 상세(`/artist/112`)에서 본문·출연 목록의 서버 HTML, metadata, Artist·Breadcrumb JSON-LD를 확인했다.
- 없는 ID의 404 안내 화면도 확인했다. HTTP 상태 코드는 브라우저 Network 탭으로 추가 확인이 필요하다.
- 배포 환경의 실제 404·500·sitemap 응답과 Google 리치 결과 확인은 남아 있다.
