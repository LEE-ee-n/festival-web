# Festibom Discord Instagram Bot

Discord에 Instagram 게시물 URL을 보내면 전체 이미지와 캡션을 분석하고 웹 단계형 임시등록을 만듭니다. `신규등록` 문구와 포스터 이미지를 직접 첨부하면 Instagram을 열지 않고 해당 이미지만 분석해 신규 작업함에 저장합니다. Discord에는 JSON·WebP를 첨부하지 않고 관리자 작업함 링크만 표시합니다. 첫 이미지는 승인 전 검토용 WebP로 임시 저장하고 최종 등록·수정 후 삭제하며 정식 썸네일로 자동 승격하지 않습니다. 일반 Instagram 게시글의 작성자 프로필은 공식 Instagram URL 검토값으로 함께 저장합니다.

아티스트 자동 연결은 `normalized_name` 100% 일치만 허용합니다. 표시 이름·별칭·유사도는 자동 연결에 사용하지 않으며 불일치 항목은 웹 첫 단계에서 관리자가 기존 연결·신규 등록·제외 중 하나로 확정합니다. 같은 URL 재추출은 허용하지 않습니다.

## 명령

- `Instagram URL`: 새 후보 생성. 같은 URL이 있으면 중단합니다.
- `신규등록` + 이미지 첨부: JPG·PNG·WebP·GIF 이미지를 최대 5장 분석해 신규 후보를 만듭니다. 뒤에 적은 문장은 캡션 근거로 사용합니다.
- 중복 출처의 `기존 삭제 후 재등록` 버튼: Bot이 만든 pending 임시 작업만 삭제하고 원본 메시지를 다시 분석합니다. 승인·완료 이력이 있으면 버튼을 표시하지 않습니다.
- `다시생성 Instagram URL`: 기존 결과를 덮어쓰지 않고 새 버전을 만듭니다.
- `DB 저장 재시도` 버튼: OCR을 다시 실행하지 않고 실패 결과만 저장합니다.
- `!티켓제외 T-001, T-002`: 쉼표로 구분한 티켓 후보의 정확한 URL을 제외합니다.

티켓 번호는 북마클릿 전체 비교 CMD가 URL별로 고정 발급합니다. 제외된 URL은 다음
전체 비교부터 나오지 않으며, 2차·3차 티켓의 새로운 URL은 새 번호로 다시 표시됩니다.

## 설치와 실행

1. 이 폴더에서 `npm install`
2. Supabase Auth에 Bot 전용 사용자를 만들고 `profiles.role`을 `bot`으로 지정
3. 프로젝트의 Discord 후보 관련 Migration과 `049_discord_attachment_candidate_source.sql`, `050_replace_pending_discord_source_draft.sql` 적용
4. `scripts/save-config.ps1` 실행
5. Instagram 로그인용 Chrome 프로필을 준비한 뒤 `scripts/run-bot.ps1` 실행

Bot은 후보와 검수 포스터만 추가할 수 있습니다. 정식 축제·아티스트·별칭의 생성, 변경, 삭제 권한은 없습니다.

## 실행 로그

- 실행 로그는 `work/logs/bot-YYYY-MM-DD.log`에 일자별로 누적됩니다.
- CMD 화면에도 같은 로그를 계속 표시합니다.
- 시작·종료 코드, Discord 연결·재연결, 처리한 메시지 ID와 Instagram URL 또는 첨부 이미지 수, 처리 성공·실패를 기록합니다.
- 토큰, 비밀번호, Supabase 키와 Discord 메시지 전체 내용은 기록하지 않습니다.
