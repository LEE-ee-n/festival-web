# Vercel 보안 점검 체크리스트

> GitHub Actions는 코드 검사를 수행하고, Vercel은 `main` 변경을 감지해 자동 배포한다. 두 작업은 현재 병렬로 진행될 수 있다. 외부 가용성은 UptimeRobot이 5분마다 별도로 감시한다. 전체 연결 관계는 `operations/SECURITY_MONITORING_AND_RECOVERY.md`를 참고한다.

## 현재 코드에서 자동 적용되는 보호

- 모든 경로에 HSTS, `nosniff`, `DENY`, Referrer Policy, Permissions Policy 적용
- CSP는 Report-Only로 적용해 실제 기능 차단 없이 위반 여부를 관찰
- OAuth 팝업을 유지하면서 탭 간 격리를 강화하는 COOP 적용
- `/api/cron/ticket-url-alert`는 `CRON_SECRET`이 없으면 `401` 반환
- Figma 카드뉴스 API는 공개 데이터만 반환하며 CDN 캐시를 사용
- 공개 배포 점검에서 주요 URL과 보안 헤더, Cron 무인증 차단을 함께 확인

## Vercel Dashboard에서 확인할 항목

1. Project → Settings → Environment Variables
   - `CRON_SECRET`, Supabase secret key, Resend key가 Production에만 존재하는지 확인
   - Preview/Development에 운영용 secret을 불필요하게 복사하지 않기
2. Project → Firewall
   - 먼저 7일간 트래픽과 차단 기록만 관찰
   - 정상 사용자 패턴을 확인하기 전에는 국가 전체 차단이나 광범위 Challenge를 만들지 않기
3. 비용 또는 반복 요청이 발생할 때만 Rate Limit 추가
   - `/api/account/delete`: IP당 10분에 10회
   - `/api/figma/card-news`: IP당 1분에 60회
   - `/api/cron/ticket-url-alert`: Secret이 있으므로 Rate Limit보다 `401` 검증을 우선
4. Firewall 규칙 적용 후 `/`, Google 로그인, 회원탈퇴, Figma API, Cron 자동 실행을 다시 점검

## CSP 강제 전환 조건

CSP 위반 보고를 최소 7일 관찰하고 GA4, Clarity, Supabase, 이미지, Google 로그인이 차단되지 않는 것이 확인된 뒤 `Content-Security-Policy-Report-Only`를 `Content-Security-Policy`로 전환한다. 전환 직후 공개 smoke test와 실제 Google 로그인을 확인한다.

## 배포 후 확인

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\deployment\Test-FestibomPublicDeployment.ps1"
```

성공 기준은 주요 공개 URL `200`, 존재하지 않는 축제·아티스트 `404`, 무인증 Cron API `401`, 보안 헤더 전부 `OK`이다. UptimeRobot의 정상 표시만으로 저장·로그인 기능까지 정상이라고 판단하지 않는다.
