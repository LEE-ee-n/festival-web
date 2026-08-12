# 사용자 요청 관리

실제 요청 대장은 Git 저장소 밖의 `Documents\FestibomOperations\requests\request-register.csv`에 저장합니다.

## 처리 순서

1. 이메일이나 사이트 문의를 확인합니다.
2. 요청 원문은 원래 채널에 두고 대장에는 최소한의 요약만 등록합니다.
3. 개인정보·이미지·계정 삭제는 대상과 요청자 본인 여부를 확인합니다.
4. 처리 후 공개 화면, DB, Storage에서 실제 반영 여부를 확인합니다.
5. 처리 내용과 완료일을 기록하고 상태를 `완료`로 바꿉니다.

상태는 `접수`, `확인 중`, `보류`, `완료`, `취소` 중 하나를 사용합니다. 잘못 등록한 항목은 삭제하지 않고 `취소`로 남깁니다. 내부 처리 목표일은 기본 7일이며 법적 기한을 대신하지 않습니다.

## 새 요청 등록

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\requests\New-FestibomRequest.ps1" -Type "삭제" -Summary "회원이 계정 삭제를 요청함" -Target "/mypage" -Channel "이메일"
```

## 상태 변경

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\requests\Update-FestibomRequest.ps1" -RequestId "REQ-20260812-0001" -Status "완료" -Resolution "계정과 개인 데이터를 삭제하고 재확인함"
```

## 미처리 요청 점검

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\requests\Test-FestibomRequestRegister.ps1" -ShowSuccess
```

매일 20:30 자동 점검을 등록합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\requests\Install-FestibomRequestCheckTask.ps1" -DailyAt "20:30"
```

## 기록하지 않는 정보

- 비밀번호, 인증 코드, access token, 비밀키
- 주민등록번호 등 처리에 필요하지 않은 개인정보
- 이메일 원문이나 첨부파일 전체

`ContactReference`에는 이메일 주소 대신 Gmail 메시지 링크나 식별 가능한 짧은 메모만 사용합니다.
