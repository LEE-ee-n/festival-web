# 푸시 전 린트 오류 정리

## 목적

- 전체 린트가 프로젝트 소스만 검사하고 오류 없이 완료되게 한다.

## 범위

- `eslint.config.mjs`: Discord Bot 런타임 작업 폴더 제외
- `useFestivalArtists.ts`: 이번 변경이 삭제뿐일 때 작업 종류를 계산값으로 정정 처리
- DB와 UI 구조 변경은 하지 않는다.

## 검증

- `npm run lint`
- `npm test`
- `npm run build`

## 완료 결과

- [완료] Discord Bot 런타임 폴더를 ESLint 검사에서 제외했다.
- [완료] 이번 라인업 변경이 삭제뿐일 때만 작업 종류를 계산값으로 `정정` 처리했다.
- [완료] 린트 통과, 테스트 138개 통과, 프로덕션 빌드 통과.
