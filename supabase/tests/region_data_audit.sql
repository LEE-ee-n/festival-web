-- 운영 DB의 festivals.region 분포와 표준 규칙 위반 행을 조회한다.
-- 읽기 전용 점검 SQL이며 데이터를 변경하지 않는다.

select
  coalesce(nullif(btrim(region), ''), '(비어 있음)') as region,
  count(*) as festival_count
from public.festivals
group by 1
order by festival_count desc, region;

select
  id,
  name,
  region,
  location,
  address,
  status
from public.festivals
where region is null
   or region <> btrim(region)
   or btrim(region) = ''
   or btrim(region) !~ '^(서울|경기|인천|강원|대전|세종|충북|충남|광주|전북|전남|대구|경북|부산|울산|경남|제주)( [^[:space:]].*)?$'
order by id;
