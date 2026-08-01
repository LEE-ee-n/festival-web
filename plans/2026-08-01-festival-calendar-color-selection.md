# [운영 DB 적용 완료·화면 확인 대기] 페스티벌별 캘린더 색상 수동 지정

## 목적과 완료 조건

- 관리자가 페스티벌별 캘린더 막대 색상을 파스텔 5색 중에서 직접 지정할 수 있게 한다.
- 지정하지 않은 페스티벌은 기존 ID 기반 자동 색상 규칙을 유지한다.
- 관리자 선택은 즉시 저장되고 공개 캘린더와 축제 카드에 반영된다.

## 확정 범위

- `festivals.calendar_color` nullable text 컬럼 추가
- 허용값: `pink`, `blue`, `green`, `purple`, `orange`
- `null`은 자동 색상, 값이 있으면 수동 지정 색상 우선
- 관리자 `/admin/festivals` 표에서 `관리` 왼쪽에 작은 `색상` 열 추가
- 현재 색상 버튼을 누르면 `자동`과 파스텔 5색 선택 표시
- 색상 선택 즉시 관리자 전용 RPC로 저장
- 저장 중 해당 행 비활성화, 실패 시 이전 값 복구와 오류 표시
- 변경 전후 값을 감사 로그에 기록

## 제외 범위

- 신규·기존 페스티벌 등록 5단계에 색상 입력 추가
- 캘린더 화면에서 직접 색상 변경
- 파스텔 팔레트 자체 수정
- 겹치는 축제의 색상을 자동으로 재배치하는 알고리즘

## 데이터 흐름과 예상 수정 파일

1. Migration 048
   - `festivals.calendar_color`와 허용값 CHECK 제약조건
   - `update_festival_calendar_color_with_audit` 관리자 RPC
   - 실행 권한 제한과 감사 이벤트·변경 스냅샷
2. 타입·공통 색상 규칙
   - `lib/supabase/database.types.ts`
   - `lib/types.ts`
   - `lib/festivalColor.ts`
3. 관리자 즉시 저장
   - `lib/festivals/updateFestivalCalendarColor.ts`
   - `app/admin/festivals/page.tsx`
4. 공개 화면 적용
   - `components/Calendar.tsx`
   - `components/calendar/CalendarGrid.tsx`
   - `components/calendar/CalendarDayCell.tsx`
   - `components/FestivalCard.tsx`
5. 테스트·문서
   - 색상 선택 우선순위와 유효값 테스트
   - `DATABASE.md`, `PROJECT_STATUS.md`

## 작업 순서

1. 컬럼·제약조건·감사 RPC 마이그레이션을 작성한다.
2. DB 타입과 5색 키·클래스 공통 매핑을 추가한다.
3. 관리자 목록에 컴팩트한 색상 선택 UI와 즉시 저장·복구 처리를 구현한다.
4. 공개 조회에 `calendar_color`를 포함하고 수동값 우선 규칙을 연결한다.
5. 단위 테스트, 타입 검사, ESLint와 빌드를 실행한다.
6. 사용자가 Migration 048을 운영 DB에 적용한다.
7. 실제 관리자 색상 저장, 새로고침 유지, 감사 로그와 공개 캘린더 반영을 확인한다.

## 회귀 위험과 검증 방법

- 기존 데이터는 `null`이므로 배포 직후 색상이 바뀌지 않는지 자동 규칙 테스트로 확인한다.
- 허용되지 않은 문자열은 DB CHECK와 RPC에서 모두 거부한다.
- 저장 실패 시 UI만 바뀐 채 남지 않도록 이전 상태 복구를 확인한다.
- 관리자만 RPC를 실행할 수 있고 익명·일반 사용자는 실행할 수 없게 권한을 제한한다.
- 캘린더와 축제 카드가 같은 수동 색상을 사용하는지 테스트한다.

## 후속 개선점

- 같은 기간에 겹치는 축제의 중복 색상 경고 또는 자동 추천 기능은 별도 작업으로 검토한다.

## 구현 결과

- Migration 048에 nullable `festivals.calendar_color`, 5색 CHECK와 관리자 전용 감사 저장 RPC를 추가했다.
- `null`은 기존 ID 기반 자동 색상, 수동 지정값은 자동 색상보다 우선하도록 공통 규칙을 확장했다.
- 관리자 페스티벌 목록의 `관리` 왼쪽에 `자동 + 5색` 선택 컴포넌트를 추가했다.
- 선택 즉시 낙관적으로 표시하고 RPC 저장 실패 시 이전 색상으로 복구한다.
- 공개 캘린더와 축제 카드가 동일한 수동 지정 색상을 사용한다.
- 감사 로그 필드명을 `캘린더 색상`으로 표시한다.
- 전체 테스트 164개, 타입 검사와 변경 파일 ESLint가 통과했다.
- Migration 048 SQL을 UTF-8로 확인해 클립보드에 복사했다.
- Migration 048을 운영 DB에 적용하고 컬럼·5색 CHECK·RPC 실행 권한(`authenticated = true`, `anon = false`)을 확인했다.
- 관리자 저장·새로고침·감사 로그·공개 캘린더 실제 확인은 남아 있다.
