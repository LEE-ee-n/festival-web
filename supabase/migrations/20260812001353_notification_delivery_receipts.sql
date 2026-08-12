begin;

alter table public.notification_deliveries
add column receipt_checked_at timestamptz;

drop index if exists public.notification_deliveries_expo_ticket_idx;

create index notification_deliveries_pending_receipt_idx
on public.notification_deliveries (created_at, id)
where expo_ticket_id is not null
  and status = 'sent'
  and receipt_checked_at is null;

commit;
