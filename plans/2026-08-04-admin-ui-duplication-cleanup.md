# [완료] 2026-08-04 관리자 UI 중복 정리

결과: 공통 컴포넌트 2개 신설, 사용처 15개 파일 교체 완료. 테스트 191개·타입 검사·변경 파일 ESLint 통과. localhost 실제 화면 확인은 사용자 검증 대기. `app/admin/import/page.tsx`의 신규 추가(blue)/업데이트(orange) 상태 색 쌍은 레거시 경로 검토(7번)와 함께 처리하기로 하고 제외함.

## 목적과 완료 조건

관리자 화면에 복사된 UI 조각(타임테이블 공개 토글, 오류/알림 배너, blue-600 잔재 색상)을 공통 컴포넌트·공통 색상 규칙으로 정리해 이후 변경 지점을 하나로 모은다.

완료 조건:

1. 타임테이블 검토/미공개 토글이 공통 컴포넌트 하나로 제공되고 후보 화면·기존 수정 화면이 재사용한다.
2. 관리자 인라인 오류/성공/경고/안내 배너가 `AdminNotice` 공통 컴포넌트를 사용한다.
3. 관리자 라벨·링크·활성 탭의 `text-blue-600` 잔재가 공통 ink 색상 규칙으로 교체된다.
4. 4~6번 후속 항목(비교표 중복, 훅 불일치, 비대 페이지)은 이 문서에 기록만 한다.

## 확정 범위와 제외 범위

확정:

- `components/admin/TimetableVisibilityToggle.tsx` 신규, 사용처 2 교체.
- `components/admin/AdminNotice.tsx` 신규(error/success/warning/info), 인라인 배너 사용처 교체.
- `text-blue-600` 라벨→`text-ink-secondary`, 인라인 링크→`text-ink-secondary underline hover:text-ink`, 라인업 활성 탭→`border-surface-dark text-ink`.

제외:

- `app/admin/import/page.tsx`의 `신규 추가`(blue)/`업데이트`(orange) 상태 색 쌍은 레거시 CSV 수입 경로의 상태 색으로 남겨 둔다(7번 레거시 경로 검토와 함께 처리).
- 큰 섹션 카드(최종 등록 확인 emerald 카드 등)는 배너가 아니므로 교체하지 않는다.
- 동작·데이터 흐름은 변경하지 않는다(순수 UI 정리).

## 예상 수정 파일

- 신규: `components/admin/TimetableVisibilityToggle.tsx`, `components/admin/AdminNotice.tsx`
- `app/admin/festival-candidates/page.tsx`, `components/CandidateSourcePreview.tsx`
- `app/admin/festivals/import-json/StagedFestivalUpdate.tsx`, `import-json/page.tsx`
- `app/admin/festival-updates/page.tsx`
- `app/admin/artists/page.tsx`, `artists/import-update/page.tsx`
- `app/admin/login/page.tsx`
- `app/admin/festivals/import/page.tsx`, `festivals/new/page.tsx`, `festivals/page.tsx`
- `app/admin/festivals/[id]/lineup/page.tsx`, `lineup/components/AuditHistoryTab.tsx`

## 작업 순서

1. 공통 컴포넌트 2개 작성.
2. 토글 교체(후보 화면, 기존 수정 화면).
3. 배너 교체(11곳)와 색상 교체(11곳).
4. `npm test`, 변경 파일 ESLint, `npm run typecheck` 실행.
5. 계획 문서 완료 표시, PROJECT_STATUS.md 갱신.

## 회귀 위험과 검증 방법

- 위험: 배너 마크업 통일로 일부 화면의 자잘한 시각 차이(테두리 추가, p-3→p-4, font-bold→font-semibold) 발생. 기능 변화는 없음.
- 위험: 라인업 페이지 오류 배너의 스크롤·포커스 동작은 `noticeRef`로 유지해야 한다.
- 검증: 자동 테스트·린트·타입 검사. 화면 확인은 localhost에서 사용자가 진행(자동 브라우저 제한).

## 후속 개선점(사용자 검토 대기)

4. 전후 비교표·STATUS_META 중복 통합 — `FestivalCandidateJsonUploader.tsx`와 `import-json` 비교 컴포넌트.
5. 페스티벌 관리 훅 불일치 — `useFestivalBasicInfo`의 useState 22개·플랫 props, `useFestivalArtists.reloadLineup`의 `getFestivalLineupData` 중복 쿼리.
6. 비대 페이지/컴포넌트 분리 — `festival-candidates/page.tsx`(790줄), `StagedFestivalUpdate.tsx`(577줄, 한 줄 JSX).
7. 레거시 직접 JSON 수입 경로 검토(PROJECT_STATUS 9절 미완료 항목과 연계).
