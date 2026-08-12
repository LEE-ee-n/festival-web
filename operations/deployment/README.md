# 배포 안전 점검

## 배포 전 전체 검사

테스트, ESLint, TypeScript, 프로덕션 빌드와 민감 파일 추적 여부를 한 번에 검사합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\deployment\Invoke-FestibomPreDeployCheck.ps1"
```

## 배포 후 공개 URL 검사

홈, 목록, 로그인, 정책, 제보, sitemap, robots와 잘못된 상세 ID의 404를 확인합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\deployment\Test-FestibomPublicDeployment.ps1"
```

결과와 로그는 Git 밖의 `Documents\FestibomOperations\deployments`에 저장됩니다.

GitHub Actions에서는 Pull Request와 `main` push마다 `npm run check`가 실행됩니다. 저장소 설정에서 `Quality gate / check`를 필수 검사로 지정해야 실패한 Pull Request 병합을 차단할 수 있습니다.
