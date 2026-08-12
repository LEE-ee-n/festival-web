-- These tables are operated only by trusted database functions, service-role
-- jobs, or backend automation. Keep them inaccessible through user API roles.

begin;

revoke all on table
  public.pipeline_runs,
  public.service_access_settings,
  public.service_access_entitlements,
  public.notification_events,
  public.notification_deliveries
from anon, authenticated;

commit;
