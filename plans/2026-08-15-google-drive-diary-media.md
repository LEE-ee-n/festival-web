# Google Drive 일기 미디어 연결

## 목표
- Google 로그인과 별개로 Drive를 선택 연결한다.
- Picker에서 고른 사진·영상만 접근한다.
- 파일이 아닌 Drive ID와 메타데이터만 DB에 저장한다.
- 공유 기능 없이 본인 일기 다시 보기만 제공한다.

## 보안 원칙
- 비민감 최소 범위 `drive.file`만 요청한다.
- refresh token은 AES-256-GCM으로 암호화한다.
- 연결 테이블의 브라우저 Data API 접근을 차단한다.
- access token은 필요할 때만 갱신하고 저장하지 않는다.

## 순서
1. 연결/미디어 DB 구조
2. OAuth 연결·해제 API
3. 마이페이지 연결 UI
4. 일기 Picker와 메타데이터 저장
5. 다시 보기, 테스트, 운영 설정 문서
