# 축제 썸네일 공개 읽기 전환 계획

- 작성일: 2026-07-24
- 상태: 승인 대기
- 대상: Supabase Storage `festival-thumbnails`
- DB 변경: 있음

## 목적

- 공개 달력과 축제 화면에서 `festival-thumbnails` 이미지를 로그인 없이 표시한다.
- 기존 공개 URL과 저장된 파일 경로는 변경하지 않는다.

## 확정 범위

1. `festival-thumbnails` 버킷의 공개 읽기를 활성화한다.
2. 업로드·수정·삭제 권한은 기존 관리자 전용 정책을 유지한다.
3. 기존 `thumbnail_url`과 Storage 객체를 수정하거나 재업로드하지 않는다.
4. 보안·DB 문서를 실제 공개 범위에 맞게 갱신한다.

## 예상 수정 파일

- `supabase/migrations/043_public_festival_thumbnails.sql`
- `DATABASE.md`
- `SECURITY.md`
- `PROJECT_STATUS.md`
- 이 계획 문서

## 작업 순서

- [ ] Migration 043에서 `festival-thumbnails.public = true`를 적용한다.
- [ ] 관리자 쓰기 정책이 유지되는지 SQL을 확인한다.
- [ ] 관련 문서와 상태를 갱신한다.
- [ ] 운영 DB에 Migration 043을 적용한다.
- [ ] 기존 썸네일 URL이 비로그인 상태에서 표시되는지 확인한다.

## 유지할 규칙

- 썸네일 읽기만 공개한다.
- 업로드·수정·삭제는 관리자만 허용한다.
- `festival-candidate-posters` 버킷은 공개하지 않는다.
- 기존 이미지와 DB URL을 삭제하거나 일괄 수정하지 않는다.

## 검증 항목

- 비로그인 사용자에게 기존 썸네일 URL 표시
- 관리자 업로드·수정·삭제 유지
- 일반 사용자의 쓰기 차단 유지
- `festival-candidate-posters` 비공개 유지

## 완료 조건

- 공개 달력에서 기존 축제 썸네일이 깨지지 않는다.
- 썸네일 쓰기 권한은 관리자 전용으로 유지된다.

## 제외 범위

- 깨진 외부 이미지 URL 일괄 교체
- 썸네일 디자인 변경
- 후보 포스터 버킷 공개

## 후속 개선점·참고사항

- Storage 객체 자체가 없는 URL은 별도 데이터 정리가 필요하다.

