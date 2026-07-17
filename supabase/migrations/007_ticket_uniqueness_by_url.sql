-- 같은 회차와 판매처라도 URL이 다르면 별도 티켓으로 허용한다.
-- PostgreSQL UNIQUE는 NULL 값을 서로 다른 값으로 취급하므로
-- 판매 URL이 아직 없는 티켓은 여러 개 등록할 수 있다.

begin;

alter table public.festival_ticket_rounds
drop constraint if exists festival_ticket_rounds_unique_ticket;

alter table public.festival_ticket_rounds
add constraint festival_ticket_rounds_unique_ticket
unique (
  festival_id,
  round_name,
  open_at,
  ticket_platform,
  ticket_url
);

commit;
