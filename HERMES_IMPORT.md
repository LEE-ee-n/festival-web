# 헤르메스 축제 JSON 규격

헤르메스는 전달받은 포스터 사진과 게시글에서 확인되는 정보만 사용해 JSON 파일 하나를 만든다. 확인할 수 없는 정보는 추측하지 않고 빈 문자열 또는 빈 배열로 둔다.

## 작업 흐름

1. 사용자가 헤르메스에 포스터 사진과 게시글 내용을 전달한다.
2. 헤르메스가 아래 규격의 JSON 파일을 생성한다.
3. 관리자가 `/admin/festival-candidates`에서 JSON을 업로드한다.
4. 검토 대기 초안을 수정하고 `승인`을 누른다.
5. 축제·출연진·티켓이 한 트랜잭션으로 등록되고 후보에 축제 ID가 기록된다.

## 헤르메스 지시문

```text
첨부한 축제 포스터와 게시글에서 확인되는 정보만 추출해 제공된 JSON 규격으로 작성한다.
정보를 추측하지 않는다. 확인할 수 없는 문자열은 "", 목록은 []로 작성한다.
날짜는 YYYY-MM-DD, 시간은 HH:MM:SS, 날짜와 시간이 함께 있으면 ISO 8601 형식을 사용한다.
연도가 보이지 않으면 현재 연도를 임의로 넣지 않는다.
출연진 표기를 원본 그대로 유지한다.
같은 티켓 회차가 여러 판매처에서 판매되면 판매처마다 tickets 항목을 따로 만든다.
설명문 없이 JSON만 출력하고 UTF-8 .json 파일로 제공한다.
```

## 필드 설명

- `candidate`: 검토용 출처 정보다. 정식 축제 등록에는 사용하지 않는다.
- `festival`: 축제명, 기간, 장소 등 기본정보다.
- `festival.normalized_name`: 축제 중복 판별값이다.
  - 공식 영문명을 기준으로 영문 소문자와 숫자만 사용한다.
  - 공백과 특수문자는 제거하고 `&`는 `and`로 바꾼다.
  - 같은 `normalized_name + start_date + end_date`는 같은 축제로 처리한다.
  - 매년 열리는 축제는 가급적 연도를 제외한다. `19xx`·`20xx`가 포함되면 관리자 화면에서 경고하지만 저장은 허용한다.
- `artists`: 출연진과 공연 날짜·시간·무대 목록이다.
- `artists[].matched_artist_id`: 관리자 검토 화면에서 선택하는 기존 `artists.id`다. 헤르메스는 항상 `null`로 작성한다.
- `artists[].match_status`: 헤르메스는 `pending`으로 작성하며 관리자가 기존 아티스트 또는 신규 등록 여부를 결정한다.
- `artists[].normalized_name`: 공백·대소문자·특수문자 차이를 정리한 중복 판별값이다.
  - 공식 영문명을 기준으로 영문 소문자와 숫자만 사용한다.
  - 공백과 특수문자는 제거하고 `&`는 `and`로 바꾼다.
  - 예: `10CM` → `10cm`, `Simon Dominic` → `simondominic`, `AKMU & Friends` → `akmuandfriends`
- `tickets`: 티켓 회차, 오픈 시간, 가격, 판매처 목록이다.
- `candidate.score`: 추출 신뢰도를 0부터 100 사이 정수로 기록한다.
- `candidate.raw_text`: 포스터와 게시글에서 읽은 핵심 원문을 보존한다.
- 정식 등록 필수값은 `festival.name`, `festival.normalized_name`, `festival.start_date`, `festival.end_date` 네 개다.
- 출연진이나 티켓을 확인할 수 없으면 `artists: []`, `tickets: []`로 작성해도 등록할 수 있다.

전체 예시는 `test-data/hermes-festival-candidate.json`을 사용한다.
