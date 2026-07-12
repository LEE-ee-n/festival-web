# Festival Web

## 기술
- Next.js 14
- TypeScript
- Tailwind
- Supabase

## 주요 테이블
- artists
- artist_aliases
- festivals
- festival_artists
- festival_ticket_rounds
- admin_users

## 현재 규칙
- artists.name: 대표 표시 이름
- artists.normalized_name: 검색용 영문 정규화값
- artist_aliases: 별칭 1개당 1행
- 관리자만 별칭 추가 가능

## 주요 페이지
- /admin/login
- /admin/artists

## 완료된 기능
- 관리자 로그인
- 유사 아티스트 검색
- 신규 아티스트 생성
- 별칭 추가
- 대표 표시 이름 변경

## 다음 작업
- 전체 아티스트 목록
- 아티스트 수정/삭제
- 페스티벌 연결