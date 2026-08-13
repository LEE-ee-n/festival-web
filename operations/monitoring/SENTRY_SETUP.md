# Festibom Sentry 오류 감시

## 역할

- UptimeRobot: 사이트가 외부에서 열리는지 확인
- Microsoft Clarity: 사용자의 화면 이용 흐름 분석
- Sentry: 브라우저·서버·API 내부 코드 오류의 발생 위치와 스택 확인

Sentry는 백업 도구가 아니며 DB나 이미지를 보관하지 않는다.

## 현재 수집 원칙

- 오류 종류, 발생 경로, 코드 스택만 수집한다.
- 사용자 식별정보, 쿠키, 요청 헤더, URL 쿼리, 요청 본문은 제거한다.
- 일기와 입력값이 오류 메시지에 섞이지 않도록 오류·breadcrumb 메시지도 제거한다.
- 화면 녹화(Session Replay), 성능 추적, Sentry Logs는 사용하지 않는다.
- DSN이 없으면 SDK는 비활성화된다.

## Sentry에서 만들 것

1. 운영 전용 계정으로 Sentry 조직을 만든다.
2. Next.js 프로젝트 `festibom-web`을 만든다.
3. 프로젝트 DSN과 소스맵 업로드용 인증 토큰을 발급한다.

## Vercel Production 환경변수

| 이름 | 공개 여부 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | 브라우저에 노출 가능 | 오류 전송 주소 |
| `SENTRY_AUTH_TOKEN` | 비공개 | 배포할 때 소스맵 업로드 |
| `SENTRY_ORG` | 비밀 아님 | Sentry 조직 slug |
| `SENTRY_PROJECT` | 비밀 아님 | Sentry 프로젝트 slug |

`SENTRY_AUTH_TOKEN`은 소스코드, 채팅, 화면 캡처에 남기지 않는다.

## 연결 후 확인

1. Vercel을 다시 배포한다.
2. Sentry에서 첫 오류가 접수되는지 전용 테스트 오류로 한 번 확인한다.
3. 이벤트의 User, Request Data, Cookies, Headers, Query String에 값이 없는지 확인한다.
4. 테스트 오류를 해결 처리한다.

## 알림 권장값

- 새 오류 최초 발생: 즉시 이메일
- 같은 오류 급증: 즉시 이메일
- 해결된 오류 재발: 즉시 이메일
- 일반 반복 오류: Sentry에서 묶어서 확인
