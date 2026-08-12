# Festibom Android 앱 준비

웹·DB·앱 코드는 구현되어 있다. 실제 Android 빌드와 푸시 알림을 연결하려면 아래 외부 설정이 필요하다.

1. Expo 계정으로 `eas init`을 실행하고 `app.json`의 `extra.eas.projectId` 값을 발급된 ID로 바꾼다.
2. Firebase 프로젝트에서 Android 앱 `com.festibom.app`을 만들고 FCM HTTP v1 자격 증명을 EAS에 등록한다.
3. Supabase Auth의 허용 Redirect URL에 `festibom://auth/callback`을 추가한다.
4. Supabase Edge Function secret `MOBILE_NOTIFICATION_CRON_SECRET`을 설정하고 `send-mobile-notifications`를 주기적으로 호출한다.
5. EAS Android 서명 인증서의 SHA-256 지문을 받은 뒤 `https://festibom.com/.well-known/assetlinks.json`에 등록한다.
6. 앱 아이콘·스플래시·스토어 스크린샷을 준비한다.

## 로컬 검사

```powershell
Set-Location -LiteralPath 'C:\Users\소닉스\Documents\festibom\mobile'
npm run typecheck
npx expo-doctor
```

## 개발 빌드

```powershell
Set-Location -LiteralPath 'C:\Users\소닉스\Documents\festibom\mobile'
eas build --profile development --platform android
```

비밀값과 Firebase 자격 증명 파일은 저장소에 커밋하지 않는다.
