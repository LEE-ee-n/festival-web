# Google Drive 일기 미디어 연결

## 목적

- 사진·영상 원본은 사용자 Google Drive에 둡니다.
- 페스티봄 DB에는 Drive 파일 ID, 이름, MIME 유형, 크기, 미리보기 주소만 저장합니다.
- 공유 기능은 제공하지 않습니다.
- OAuth refresh token은 서버 전용 테이블에 AES-256-GCM으로 암호화해 저장합니다.

## Google Cloud 설정

1. Google Drive API와 Google Picker API를 활성화합니다.
2. OAuth 동의 화면에 `drive.file` 범위를 등록합니다.
3. 웹 OAuth 클라이언트를 만들고 리디렉션 URI를 등록합니다.
   - `http://localhost:3000/api/google-drive/callback`
   - `https://festibom.com/api/google-drive/callback`
4. Picker API 키는 HTTP referrer를 localhost와 festibom.com으로 제한합니다.
5. App ID에는 Google Cloud 프로젝트 번호를 사용합니다.

## Vercel 환경 변수

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET` (Sensitive)
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY` (Sensitive, Base64 32바이트)
- `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY`
- `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID`

PowerShell 암호화 키 생성:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

## 적용 순서

1. `20260815004956_google_drive_connections_and_media_metadata.sql` 마이그레이션 적용
2. DB 타입 재생성
3. Google Cloud와 Vercel 환경 변수 등록
4. 배포 후 마이페이지에서 Drive 연결
5. 일기 수정 → 아티스트 카드 → `Drive에서 추가` 검증
6. 연결 삭제 시 Drive 원본이 유지되는지 확인

토큰, API 비밀키, 사용자 파일명은 로그나 Sentry 이벤트에 남기지 않습니다.
