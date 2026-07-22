# [완료] 페스티벌 관리 아티스트 정보 읽기 전용 전환 계획

- 작성일: 2026-07-22
- 상태: 완료
- 완료일: 2026-07-22
- 승인일: 2026-07-22
- 대상: `/admin/festivals/[id]/lineup` 페스티벌 관리 라인업 화면
- DB 변경: 없음

## 한눈에 보는 요약

- 페스티벌 관리에서 아티스트 `표시 이름·normalized_name·별칭`을 수정할 수 없게 한다.
- 세 값은 DB 정보를 읽기 전용 텍스트로만 보여준다.
- 이 화면의 저장은 공연 날짜·시간·무대·상태 같은 페스티벌별 일정만 처리한다.
- 기존 아티스트 정보 수정은 아티스트 관리 페이지에서만 한다.

## 확인한 현재 구조

- `ArtistLineupTable`에서 표시 이름·`normalized_name`·별칭을 입력칸으로 렌더링한다.
- `updateArtistIdentity()`가 같은 아티스트가 연결된 로컬 행의 공통정보를 함께 바꾼다.
- 행 저장 시 `update_artist_from_festival_admin` RPC를 호출해 전역 아티스트 마스터를 수정한다.
- 같은 저장 버튼이 공연 일정 변경도 함께 처리해 책임이 섞여 있다.

## 확정 범위

1. 기존 연결 아티스트의 표시 이름·`normalized_name`·별칭 입력칸을 읽기 전용 텍스트로 변경한다.
2. `ArtistLineupTable`의 `updateArtistIdentity` 이벤트와 타입을 제거한다.
3. `useFestivalArtists`의 아티스트 공통정보 로컬 수정 함수를 제거한다.
4. 행 저장에서 `update_artist_from_festival_admin` RPC 호출을 제거한다.
5. 행 저장은 공연 날짜·시작/종료 시간·무대·상태 변경만 저장한다.
6. 일정 변경이 없으면 성공으로 표시하지 않고 `저장할 일정 변경이 없습니다.`를 안내한다.
7. 저장 버튼 문구를 `일정 저장`으로 바꿔 역할을 명확히 한다.
8. 상단 안내문을 `아티스트 정보는 아티스트 관리 페이지에서만 수정할 수 있습니다.`로 변경한다.

## 유지할 기능

- 기존 DB 아티스트 검색과 라인업 추가
- 현재의 신규 아티스트 추가 준비 기능
- 공연 날짜·시간·무대·상태 수정
- 라인업 삭제와 발표·정정 감사 기록
- 전체 미저장 일정 변경 저장

신규 아티스트 생성 경로 자체를 막는 작업은 이번 요청의 `기존 아티스트 정보 수정 금지`와 분리해 유지한다.

## 예상 수정 파일

- `app/admin/festivals/[id]/lineup/components/ArtistLineupTable.tsx`
- `app/admin/festivals/[id]/lineup/hooks/useFestivalArtists.ts`
- `ARTIST_MANAGEMENT.md`
- `DATABASE.md`
- 이 계획 문서와 `PROJECT_STATUS.md`

## 상태 변화

```text
현재: 아티스트 공통정보 입력 → 행 저장 → 아티스트 마스터 RPC + 일정 저장
변경: 아티스트 공통정보 읽기 전용 → 일정 입력 → 일정 저장만 실행
```

## 회귀 위험과 대응

- 아티스트 정보가 빈칸으로 보임: 기존 조회 데이터의 DB 이름·`normalized_name`·별칭을 그대로 표시한다.
- 일정 저장까지 막힘: 일정 필드는 기존 `updateRow`와 `applyLineupWork`를 유지한다.
- 변경 없는 행을 저장함: 행 단위 일정 연산이 0건이면 저장을 중단하고 안내한다.
- 신규 라인업 추가가 깨짐: `ArtistAddSection`과 신규/기존 추가 상태는 변경하지 않는다.

## 검증

- 표시 이름·`normalized_name`·별칭에 입력 요소가 없는지 확인
- 일정 1건 수정 후 행 저장 성공
- 일정 변경 없이 행 저장 시 안내 표시
- 전체 일정 변경 저장 유지
- typecheck, 변경 파일 ESLint, 전체 자동 테스트
- localhost에서 실제 페스티벌 관리 화면 확인

## 완료 조건

- 페스티벌 관리에서 기존 아티스트 마스터 정보를 수정할 수 없다.
- 이 화면에서 `update_artist_from_festival_admin`을 호출하지 않는다.
- 일정 수정·삭제·라인업 추가 기능은 유지된다.
- 문서와 실제 코드가 일치한다.

## 제외 범위

- 아티스트 관리 페이지 개편
- 신규 아티스트 생성 경로 제거
- DB 함수·권한·migration 삭제
- 페스티벌 기본정보·티켓 화면 변경

## 후속 개선점·참고사항

- 더 이상 이 화면에서 사용하지 않는 `update_artist_from_festival_admin` DB 함수의 정리는 다른 사용처와 운영 이력을 확인한 뒤 별도 계획으로 판단한다.
- 변경 전부터 `useFestivalArtists.ts`의 기존 `useEffect` 안 동기 `setWorkType` 호출이 ESLint `react-hooks/set-state-in-effect` 규칙에 걸린다. 이번 아티스트 읽기 전용 범위에는 포함하지 않는다.

## 진행 결과

- [x] 표시 이름·`normalized_name`·별칭을 읽기 전용 텍스트로 변경
- [x] `updateArtistIdentity` 상태 변경과 컴포넌트 이벤트 제거
- [x] 행 저장의 `update_artist_from_festival_admin` RPC 호출 제거
- [x] 행 저장을 일정 변경 전용으로 변경하고 변경 없음 안내 추가
- [x] 버튼 문구를 `일정 저장`으로 변경
- [x] 아티스트 관리·DB 문서 갱신
- [x] 전체 테스트 113개와 typecheck 통과
- [x] 화면 컴포넌트 ESLint 통과
- [x] localhost에서 읽기 전용 표시 확인

검증 참고: 훅 파일 ESLint에는 이번 변경 전부터 존재한 `react-hooks/set-state-in-effect` 1건만 남아 있다.
