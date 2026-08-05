# [완료] 2026-08-04 SEO·GEO 최적화 구현 보고서

## 목적과 완료 조건

공개 축제·아티스트 페이지가 Google, 네이버, AI 검색엔진에서 정확히 이해·노출되도록
서버 HTML, 메타데이터, 구조화 데이터, GEO 콘텐츠 구조, 내부 링크, sitemap·robots를 개선한다.
완료 조건은 `npm test`, `npx tsc --noEmit --incremental false`, 변경 파일 eslint 통과다.

## 확정 범위와 제외 범위

- 확정: 공개 상세 페이지 서버 렌더링 전환, 404 처리, 메타데이터·구조화 데이터 확장,
  GEO 콘텐츠 구조 개선, sitemap·robots 점검, 단위 테스트.
- 제외: 관리자 기능·DB 스키마·축제 등록 로직, 외부 패키지, llms.txt,
  Search Console·네이버 서치어드바이저 제출, 가짜 FAQ·가짜 콘텐츠.

## 구현 내역

| 항목 | 기존 문제 | 적용 내용 | 수정 파일 | 검증 결과 | 수동 확인 필요 |
| --- | --- | --- | --- | --- | --- |
| 축제 상세 서버 HTML | 클라이언트에서만 데이터를 조회해 서버 HTML에 핵심 본문이 없음 | 페이지를 서버 컴포넌트로 전환하고 서버 데이터 로더를 추가, 화면 UI는 `FestivalDetailContent` 클라이언트 컴포넌트로 이동 | `app/festival/[id]/page.tsx`, `lib/festivals/getPublicFestivalDetail.ts`, `components/festival/FestivalDetailContent.tsx` | tsc·eslint·테스트 통과 | 배포 후 소스보기에서 본문 포함 확인 |
| 아티스트 상세 서버 HTML | 클라이언트에서만 조회해 서버 HTML이 비어 있음 | 상호작용이 없어 전체 페이지를 서버 컴포넌트로 전환 | `app/artist/[id]/page.tsx`, `lib/artists/getPublicArtistDetail.ts` | tsc·eslint·테스트 통과 | 배포 후 소스보기에서 본문 포함 확인 |
| 없음·비공개 URL 처리 | 존재하지 않거나 비공개인 페이지가 200 + noindex로 노출 | 서버에서 미존재·비공개 판정 시 `notFound()`로 실제 HTTP 404 반환, 레이아웃 noindex 메타데이터는 안전망으로 유지 | `app/festival/[id]/page.tsx`, `app/artist/[id]/page.tsx` | 빌드·배포 전 자동 검증 불가 | 없는 ID로 404 응답 확인 |
| 축제 메타데이터 | description에 출연진·예매 정보가 없고 og:image·트위터 카드 없음 | description에 기간·장소·축제명·타임테이블·예매 정보와 출연진 일부(최대 3팀)를 자연 문장으로 포함, 대표 이미지가 있을 때만 og:image·트위터 카드 추가, canonical 유지 | `app/festival/[id]/layout.tsx`, `lib/seo.ts`, `lib/publicSeoData.ts` | SEO 테스트 13개 통과 | 배포 후 메타 태그 확인 |
| 아티스트 메타데이터 | description에 출연 축제 정보가 없고 og:image·트위터 카드 없음 | description에 출연 페스티벌 이름(공개 승인 축제만) 포함, 아티스트 이미지가 있을 때만 og:image·트위터 카드 추가, canonical 유지 | `app/artist/[id]/layout.tsx`, `lib/seo.ts`, `lib/publicSeoData.ts` | seo 테스트 통과 | 배포 후 메타 태그 확인 |
| 축제 Event JSON-LD | performer·image·offers 없음 | 출연진은 `artist_type` 기준 Person/MusicGroup으로 performer 추가, image는 대표 이미지가 실제 있을 때만, offers는 오픈된 예매 URL과 가격(`N원` 텍스트에서 파싱)이 모두 있을 때만 추가, location·날짜·상태 유지 | `lib/seo.ts`, `lib/publicSeoData.ts`, `app/festival/[id]/layout.tsx` | Event 필수 필드·선택 필드 테스트 통과 | Google 리치 결과 테스트 |
| BreadcrumbList | 없음 | 축제: 홈 → 전체 페스티벌 → 축제명, 아티스트: 홈 → 아티스트명, 절대 URL로 생성 | `lib/seo.ts`, 양쪽 layout | Breadcrumb 테스트 통과 | 리치 결과 테스트 |
| 아티스트 구조화 데이터 | 없음 | `artist_type`(singer·dj → Person, band·group 등 → MusicGroup), image·sameAs는 실제 유효 URL만 포함 | `lib/seo.ts`, `app/artist/[id]/layout.tsx` | 테스트 통과 | 리치 결과 테스트 |
| 홈페이지 구조화 데이터 | WebSite만 존재 | 실제 이름·URL·설명만으로 Organization 추가 (없는 정보 미포함) | `app/page.tsx` | tsc·eslint 통과 | 리치 결과 테스트 |
| GEO 콘텐츠 구조 | 공식 링크에 heading 없음, 타임테이블 미공개가 짧은 라벨만 표시 | 공식 링크 섹션에 `공식 링크` h2 추가, 미공개 상태를 `이 페스티벌의 타임테이블은 아직 공개되지 않았습니다.` 문구로 표시, 출연진이 없으면 `등록된 출연진 정보가 없습니다.`를 실제 HTML 텍스트로 제공 | `components/festival/FestivalDetailContent.tsx` | tsc·eslint 통과 | localhost 화면 확인 |
| 내부 링크 | 점검 결과 축제→아티스트, 아티스트→축제, 목록→상세 모두 축제명·아티스트명 앵커 사용 | 변경 없음(`자세히 보기`류 문구 없음 확인), 관리자 링크는 기존처럼 SEO 대상 밖 | 없음 | grep 확인 | 없음 |
| sitemap | `/festivals` 누락, 아티스트 lastModified 없음, 중복 방지 장치 없음 | `/festivals` 추가, URL 중복 제거(Set), 축제 lastModified는 `updated_at`(기존 유지), 아티스트 lastModified는 출연 등록 기준 최신 `created_at`(artists·festival_artists에 updated_at 컬럼이 없음), 빌더를 `buildSitemapRoutes` 공통 함수로 분리해 단위 테스트 추가 | `app/sitemap.ts`, `lib/seo.ts` | sitemap 빌더 테스트 통과 | 배포 후 `/sitemap.xml` 확인 |
| robots | `/admin` 차단·sitemap URL 정상, 공개 페이지 차단 없음 | 변경 없이 유지 | 없음 | 코드 검토 | 없음 |
| JSON-LD 안전 | `<` 이스케이프만 존재 | 이스케이프 유지, 모든 URL 필드는 http/https 검증 후 포함, undefined·잘된 URL(`javascript:` 등) 유입을 테스트로 차단 | `lib/seo.ts`, `tests/seo.test.ts` | 테스트 통과 | 없음 |

## 작업 순서(완료)

1. [x] 현재 구현 확인(레이아웃, 페이지, sitemap, robots, seo 라이브러리)
2. [x] `lib/seo.ts` 확장(메타 문구, 경로 헬퍼, URL·가격 파서, Event/Breadcrumb/Artist JSON-LD, sitemap 빌더)
3. [x] `lib/publicSeoData.ts` 확장(대표 이미지·출연진·예매 정보, 아티스트 프로필·출연 축제)
4. [x] 서버 데이터 로더 추가(`getPublicFestivalDetail`, `getPublicArtistDetail`)
5. [x] 축제·아티스트 상세 페이지 서버 컴포넌트 전환 + `notFound()`
6. [x] 레이아웃 메타데이터·JSON-LD 확장, 홈페이지 Organization 추가
7. [x] sitemap 개선, SEO 테스트 총 13개 구성, 검증

## 회귀 위험과 검증 결과

- 최초 검증 결과: 전체 테스트 **208개 통과**, `npx tsc --noEmit --incremental false` 통과,
  변경 파일 14개 eslint 통과.
- 회귀 위험: `useFestivalDetail`의 타임테이블 그룹화를 `groupArtistsByDateAndStage`
  공통 함수로 추출했다. 이 훅을 사용하는 캘린더 드로어(`FestivalDetailDrawer`)도
  동일한 정렬 로직을 사용하므로 테스트·타입 검사로 동등성을 확인했다.
- ISR(`revalidate = 3600`) 환경에서 축제 조회가 오류면 throw(500, 캐시 안 됨),
  조회 성공 후 없음일 때만 404를 반환하도록 설계해 임시 장애가 404로 캐시되는 범위를 제한했다.

## 수동 확인 필요 항목

1. 배포 후 실제 HTML 소스보기에서 축제·아티스트 상세 본문 포함 확인
2. 존재하지 않는 `/festival/[id]`, `/artist/[id]`의 HTTP 404 응답 확인
3. Google 리치 결과 테스트로 Event·Breadcrumb·Person/MusicGroup·Organization 검증
4. 대표 이미지가 있는 축제의 og:image·트위터 카드 노출 확인
5. localhost에서 공식 링크 heading·타임테이블 미공개 문구 등 화면 회귀 확인
6. `/sitemap.xml`에서 공개 승인 데이터만 포함되는지 확인

## 후속 개선점

- `/festivals` 목록 페이지(`FestivalOverview`)도 클라이언트 전용 조회라 서버 HTML이 비어 있다.
  이번 범위는 상세 페이지였으므로 목록 페이지 서버 렌더링은 별도 작업으로 검토한다.
- artists·festival_artists 테이블에 `updated_at` 컬럼이 없어 아티스트 sitemap
  lastModified는 출연 등록 기준이다. 컬럼 추가 시 교체할 수 있다.
- Event offers의 가격은 `price_info` 텍스트의 첫 `N원` 값을 파싱한다.
  가격 포맷이 다양해지면 전용 컬럼 또는 정규화 검토가 필요하다.

## 2026-08-05 코드 검토 후 보완

- 아티스트 상세 페이지와 메타데이터의 공개 기준을 통일했다. 공개 승인 축제의 `scheduled` 또는 `confirmed` 출연 이력이 없으면 실제 404 경로를 사용한다.
- 축제·아티스트 상세의 하위 조회, SEO 데이터 조회와 sitemap 조회 오류를 정상 빈 결과와 분리했다. DB 오류는 throw하고 조회 성공 후 대상 없음만 `null` 또는 빈 배열로 처리한다.
- sitemap은 DB 조회 실패 시 동적 URL이 빠진 성공 결과를 반환하지 않는다.
- 추천 플레이리스트는 아티스트 정체성을 나타내는 공식 프로필이 아니므로 JSON-LD `sameAs`에서 제외했다. 공개 화면 링크는 유지한다.
- 재검증 결과: 전체 테스트 **211개 통과**, SEO 테스트 **13개 통과**, TypeScript 검사, 관련 파일 ESLint와 `git diff --check` 통과.
- localhost 아티스트 상세(`/artist/112`)에서 서버 HTML, metadata, Artist·Breadcrumb JSON-LD를 확인했다. 없는 ID의 404 안내 화면도 확인했다.
- 배포 환경의 실제 HTTP 상태·sitemap 응답과 Google 리치 결과 확인은 남아 있다.
