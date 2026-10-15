begin;
set local role service_role;
do $$
declare attempt integer; allowed boolean;
begin
  for attempt in 1..20 loop
    select public.check_yapu_login_limit(array[repeat('b',64),repeat('e',64)]) into allowed;
    if not allowed then raise exception 'A normal attempt was rejected: %', attempt; end if;
  end loop;
  select public.check_yapu_login_limit(array[repeat('b',64),repeat('e',64)]) into allowed;
  if allowed then raise exception 'Attempt 21 was not throttled'; end if;
  if public.check_yapu_login_limit(array['invalid','invalid']) then raise exception 'Invalid limiter keys accepted'; end if;
end;
$$;
reset role;
select 'PASS: 20 normal attempts accepted, 21st throttled, malformed keys rejected; fixtures rolled back.' as result;
rollback;
