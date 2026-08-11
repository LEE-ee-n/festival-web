begin;

drop policy if exists "Admins can insert festival update drafts"
  on public.festival_update_drafts;

create policy "Admins can insert festival update drafts"
  on public.festival_update_drafts
  for insert
  to authenticated
  with check ((select public.is_admin()));

comment on policy "Admins can insert festival update drafts"
  on public.festival_update_drafts is
  'Allows only an authenticated aal2 administrator to convert a new candidate into an existing festival update draft';

commit;
