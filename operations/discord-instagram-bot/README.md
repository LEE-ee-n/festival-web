# Festibom Discord Instagram Bot

Discord에 Instagram 게시물 URL을 보내면 전체 이미지와 캡션을 분석하고 웹 단계형 임시등록을 만듭니다. Discord에는 JSON·WebP를 첨부하지 않고 관리자 작업함 링크만 표시합니다. 첫 이미지는 WebP 임시 포스터로 저장되며 최종 등록 때 정식 썸네일로 승격합니다.

아티스트 자동 연결은 `normalized_name` 100% 일치만 허용합니다. 표시 이름·별칭·유사도는 자동 연결에 사용하지 않으며 불일치 항목은 웹 첫 단계에서 관리자가 기존 연결·신규 등록·제외 중 하나로 확정합니다. 같은 URL 재추출은 허용하지 않습니다.

## 명령

- `Instagram URL`: 새 후보 생성. 같은 URL이 있으면 중단합니다.
- `다시생성 Instagram URL`: 기존 결과를 덮어쓰지 않고 새 버전을 만듭니다.
- `DB 저장 재시도` 버튼: OCR을 다시 실행하지 않고 실패 결과만 저장합니다.
- `!티켓제외 T-001, T-002`: 쉼표로 구분한 티켓 후보의 정확한 URL을 제외합니다.

티켓 번호는 북마클릿 전체 비교 CMD가 URL별로 고정 발급합니다. 제외된 URL은 다음
전체 비교부터 나오지 않으며, 2차·3차 티켓의 새로운 URL은 새 번호로 다시 표시됩니다.

## 설치와 실행

1. 이 폴더에서 `npm install`
2. Supabase Auth에 Bot 전용 사용자를 만들고 `profiles.role`을 `bot`으로 지정
3. 프로젝트 루트의 `supabase/migrations/028_discord_candidate_inbox.sql` 적용
4. `scripts/save-config.ps1` 실행
5. Instagram 로그인용 Chrome 프로필을 준비한 뒤 `scripts/run-bot.ps1` 실행

Bot은 후보와 검수 포스터만 추가할 수 있습니다. 정식 축제·아티스트·별칭의 생성, 변경, 삭제 권한은 없습니다.
