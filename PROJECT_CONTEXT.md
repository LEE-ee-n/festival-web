# Festival Web

## 기술
- Next.js 16
- TypeScript
- Tailwind
- Supabase

## 주요 테이블
- artists
- artist_aliases
- festivals
- festival_artists
- festival_ticket_rounds
- profiles (`role = 'admin'`이 관리자 권한의 기준)

## 현재 규칙
- artists.name: 대표 표시 이름
- artists.normalized_name: 아티스트 중복 판별값. NOT NULL·UNIQUE이며 영문 소문자와 숫자만 허용
- artist_aliases: 별칭 1개당 1행
- `/admin` 전체와 모든 관리 데이터 쓰기는 관리자만 가능
- 공개 축제는 승인된 축제와 그 축제의 출연진·티켓만 조회 가능

## 주요 페이지
- /admin/login
- /admin/artists
- /admin/festivals
- /admin/festivals/new
- /admin/festival-candidates
- /admin/festivals/[id]/lineup

## 완료된 기능
- 관리자 로그인
- 관리자 인증 통일과 RLS 정리
- 축제 기본정보·라인업·티켓 관리
- JSON 축제 트랜잭션 등록
- 헤르메스 JSON 수집 후보 저장·폼 검토·승인 등록
- 후보 아티스트 `normalized_name` 기준 중복 확인
- 월 단위 캘린더 조회와 월 전체 고정 줄 배치
- 티켓 최신 회차·판매처·오픈 시간 표시
- 썸네일 JPEG·PNG·WebP 및 5MB 제한
- 자동 테스트·린트·타입 검사·프로덕션 빌드 통합 검사

## 다음 작업
- 실제 수집 JSON으로 후보 검토·승인 흐름 반복 검증
- 모바일 화면과 운영 배포 후 회귀 확인
