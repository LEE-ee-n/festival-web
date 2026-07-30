# 공통 글자색·배경색 적용

## 목적과 완료 조건

- 공개·관리자 화면의 일반 회색 글자와 중립 배경을 공통 Tailwind 색상으로 통일한다.
- 의미가 있는 오류·성공·경고색과 흰색 글자는 유지한다.
- 토·일 글자는 브랜드 색상으로 변경한다.

## 공통 글자색

- `text-ink`: `#111111`
- `text-ink-secondary`: `#505050`
- `text-ink-tertiary`: `#767676`
- `text-ink-muted`: `#999999`

## 공통 배경색

- `bg-surface`: `#FFFFFF`
- `bg-surface-subtle`: `#FAFAFA`
- `bg-surface-muted`: `#F5F5F5`
- `bg-surface-strong`: `#E5E5E5`
- `bg-surface-dark`: `#090A1A`

## 치환 규칙

- slate/gray 950·900·800, black → `ink`
- slate/gray 700·600 → `ink-secondary`
- slate/gray 500 → `ink-tertiary`
- slate/gray 400·300 → `ink-muted`
- white → `surface`
- slate/gray 50 → `surface-subtle`
- slate/gray 100 → `surface-muted`
- slate/gray 200 → `surface-strong`
- slate 950·900·800 배경 → `surface-dark`
- 달력 토요일 파랑 → `festival-indigo`
- 달력 일요일 빨강 → `festival-coral`

## 제외 범위

- 오류·삭제, 성공, 경고 상태색
- 흰색 글자
- 테두리색
- 축제 막대와 기존 브랜드 강조색

## 검증

- 기존 중립 글자·배경 클래스 잔여 항목을 검색한다.
- 전체 린트, TypeScript, 테스트를 실행한다.

## 결과

- [완료] 공개·관리자 화면의 중립 글자색을 `ink` 4단계로 통일
- [완료] 중립 배경을 `surface` 5단계로 통일
- [완료] 달력 토요일·일요일을 `festival-indigo`·`festival-coral`로 변경
- [완료] 기존 중립 글자·배경 클래스 잔여 0건 확인
- [완료] ESLint, TypeScript, 전체 테스트 156개 통과
- [부분 확인] Next.js 컴파일·TypeScript 완료 후 `.env.local` 읽기 권한 때문에 정적 페이지 생성 중단
