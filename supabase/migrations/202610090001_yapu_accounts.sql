begin;

create schema if not exists yapu_private;
revoke all on schema yapu_private from public, anon, authenticated;

create table public.yapu_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,23}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  role text not null check (role in ('teacher', 'student')),
  signup_province text,
  class_province text,
  created_at timestamptz not null default now()
);
create table public.yapu_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references public.yapu_profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  province text not null,
  created_at timestamptz not null default now()
);
create table public.yapu_memberships (
  student_id uuid primary key references public.yapu_profiles(id) on delete cascade,
  class_id uuid not null references public.yapu_classes(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index yapu_memberships_class_idx on public.yapu_memberships(class_id);
create table yapu_private.class_invites (
  class_id uuid primary key references public.yapu_classes(id) on delete cascade,
  code text not null unique
);
create table yapu_private.join_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  attempts integer not null
);
create table yapu_private.activity_days (
  user_id uuid not null references public.yapu_profiles(id) on delete cascade,
  active_date date not null,
  province text,
  primary key (user_id, active_date)
);
create table yapu_private.login_limits (
  key_hash text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
revoke all on all tables in schema yapu_private from public, anon, authenticated;

alter table public.yapu_profiles enable row level security;
alter table public.yapu_classes enable row level security;
alter table public.yapu_memberships enable row level security;
alter table yapu_private.class_invites enable row level security;
alter table yapu_private.join_limits enable row level security;
alter table yapu_private.activity_days enable row level security;
alter table yapu_private.login_limits enable row level security;
revoke all on public.yapu_profiles, public.yapu_classes, public.yapu_memberships from public, anon, authenticated;
grant select on public.yapu_profiles, public.yapu_classes, public.yapu_memberships to authenticated;

-- Helpers query as the owner to avoid recursive RLS. Only the caller's own ID is accepted.
create function yapu_private.can_read_profile(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select target = auth.uid() or exists (
    select 1 from public.yapu_memberships m join public.yapu_classes c on c.id = m.class_id
    where m.student_id = target and c.teacher_id = auth.uid()
  );
$$;
create function yapu_private.can_read_class(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.yapu_classes c where c.id = target and c.teacher_id = auth.uid())
    or exists (select 1 from public.yapu_memberships m where m.class_id = target and m.student_id = auth.uid() and m.status in ('pending','approved'));
$$;
revoke all on function yapu_private.can_read_profile(uuid), yapu_private.can_read_class(uuid) from public, anon;
grant usage on schema yapu_private to authenticated;
grant execute on function yapu_private.can_read_profile(uuid), yapu_private.can_read_class(uuid) to authenticated;
create policy yapu_profile_read on public.yapu_profiles for select to authenticated using (yapu_private.can_read_profile(id));
create policy yapu_class_read on public.yapu_classes for select to authenticated using (yapu_private.can_read_class(id));
create policy yapu_membership_read on public.yapu_memberships for select to authenticated using (
  student_id = (select auth.uid()) or exists (select 1 from public.yapu_classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);

create function public.complete_yapu_profile(p_username text, p_name text, p_role text, p_province text default null)
returns public.yapu_profiles language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); result public.yapu_profiles;
  provinces text[] := array['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区','香港特别行政区','澳门特别行政区','台湾省'];
begin
  if current_user_id is null then raise exception '请先完成联系方式验证。'; end if;
  perform 1 from auth.users where id = current_user_id and (email_confirmed_at is not null or phone_confirmed_at is not null) for update;
  if not found then raise exception '请先完成联系方式验证。'; end if;
  select * into result from public.yapu_profiles where id = current_user_id;
  if found then return result; end if;
  p_username := lower(trim(p_username)); p_name := trim(p_name); p_province := nullif(trim(p_province),'');
  if p_username !~ '^[a-z][a-z0-9_]{2,23}$' then raise exception '账号须以字母开头，由 3–24 位字母、数字或下划线组成。'; end if;
  if p_role not in ('teacher','student') or p_role is null then raise exception '请选择注册身份。'; end if;
  if p_name is null or char_length(p_name) not between 1 and 40 then raise exception '请填写姓名。'; end if;
  if (p_role = 'teacher' and p_province is null) or (p_province is not null and not (p_province = any(provinces))) then raise exception '请选择有效的省级地区。'; end if;
  insert into public.yapu_profiles (id, username, display_name, role, signup_province)
  values (current_user_id, p_username, p_name, p_role, p_province) returning * into result;
  return result;
end;
$$;

create function public.create_yapu_class(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare teacher public.yapu_profiles; class_uuid uuid;
begin
  select * into teacher from public.yapu_profiles where id = auth.uid() for update;
  if teacher.role is distinct from 'teacher' then raise exception '只有教师可以创建班级。'; end if;
  if char_length(trim(p_name)) not between 1 and 60 or p_name is null then raise exception '班级名称须为 1–60 个字符。'; end if;
  if exists (select 1 from public.yapu_classes where teacher_id = teacher.id) then raise exception '你已经创建了一个班级。'; end if;
  insert into public.yapu_classes (teacher_id, name, province) values (teacher.id, trim(p_name), teacher.signup_province) returning id into class_uuid;
  insert into yapu_private.class_invites(class_id, code) values (class_uuid, upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)));
  update public.yapu_profiles set class_province = teacher.signup_province where id = teacher.id;
  return class_uuid;
end;
$$;

create function public.request_yapu_class(p_code text) returns text
language plpgsql security definer set search_path = '' as $$
declare student public.yapu_profiles; target_class uuid; membership public.yapu_memberships; attempt_count integer;
begin
  select * into student from public.yapu_profiles where id = auth.uid() for update;
  if student.role is distinct from 'student' then raise exception '只有学生可以申请入班。'; end if;
  insert into yapu_private.join_limits(user_id, window_start, attempts) values (student.id, now(), 1)
  on conflict(user_id) do update set
    attempts = case when yapu_private.join_limits.window_start < now() - interval '10 minutes' then 1 else yapu_private.join_limits.attempts + 1 end,
    window_start = case when yapu_private.join_limits.window_start < now() - interval '10 minutes' then now() else yapu_private.join_limits.window_start end
  returning attempts into attempt_count;
  -- Return failures instead of raising so throttling survives invalid-code attempts.
  if attempt_count > 5 then return '申请过于频繁，请 10 分钟后再试。'; end if;
  select * into membership from public.yapu_memberships where student_id = student.id;
  if membership.status in ('approved','pending') then return '你已有班级或待审核申请，请先查看我的班级。'; end if;
  select class_id into target_class from yapu_private.class_invites where code = upper(trim(p_code));
  if target_class is null then return '邀请码无效，请向老师确认。'; end if;
  insert into public.yapu_memberships(student_id,class_id) values (student.id,target_class)
  on conflict(student_id) do update set class_id=excluded.class_id,status='pending',requested_at=now(),reviewed_at=null;
  return '申请已发送，请等待老师确认。';
end;
$$;

create function public.review_yapu_student(p_student uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare membership public.yapu_memberships; classroom public.yapu_classes;
begin
  -- The same student lock serializes approval and subsequent requests.
  perform 1 from public.yapu_profiles where id=p_student for update;
  select * into membership from public.yapu_memberships where student_id=p_student for update;
  select * into classroom from public.yapu_classes where id=membership.class_id;
  if classroom.teacher_id is distinct from auth.uid() or auth.uid() is null then raise exception '你无权审核这个学生。'; end if;
  if membership.status is distinct from 'pending' or p_approve is null then raise exception '这项申请已处理，请刷新列表。'; end if;
  update public.yapu_memberships set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now() where student_id=p_student;
  if p_approve then update public.yapu_profiles set class_province=classroom.province where id=p_student; end if;
end;
$$;

create function public.my_yapu_class() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare profile public.yapu_profiles; classroom public.yapu_classes; membership public.yapu_memberships; result jsonb;
begin
  select * into profile from public.yapu_profiles where id=auth.uid();
  if profile.id is null then return null; end if;
  if profile.role='teacher' then
    select * into classroom from public.yapu_classes where teacher_id=profile.id;
    if classroom.id is null then return null; end if;
    select jsonb_build_object('id',classroom.id,'name',classroom.name,'province',classroom.province,'invite_code',i.code,'students',
      coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'username',p.username,'status',m.status) order by m.requested_at)
        from public.yapu_memberships m join public.yapu_profiles p on p.id=m.student_id where m.class_id=classroom.id and m.status in ('pending','approved')), '[]'::jsonb))
    into result from yapu_private.class_invites i where i.class_id=classroom.id;
    return result;
  end if;
  select * into membership from public.yapu_memberships where student_id=profile.id;
  if membership.student_id is null then return null; end if;
  select * into classroom from public.yapu_classes where id=membership.class_id;
  return jsonb_build_object('id',classroom.id,'name',classroom.name,'province',classroom.province,'status',membership.status,
    'teacher_name',(select display_name from public.yapu_profiles where id=classroom.teacher_id));
end;
$$;

create function public.record_yapu_activity() returns void
language sql security definer set search_path = '' as $$
  insert into yapu_private.activity_days(user_id,active_date,province)
  select id,(now() at time zone 'Asia/Shanghai')::date,coalesce(class_province,signup_province) from public.yapu_profiles where id=auth.uid()
  on conflict(user_id,active_date) do nothing;
$$;

-- Function execution is opt-in; no anonymous profile or classroom API is exposed.
revoke all on function public.complete_yapu_profile(text,text,text,text), public.create_yapu_class(text), public.request_yapu_class(text), public.review_yapu_student(uuid,boolean), public.my_yapu_class(), public.record_yapu_activity() from public, anon;
grant execute on function public.complete_yapu_profile(text,text,text,text), public.create_yapu_class(text), public.request_yapu_class(text), public.review_yapu_student(uuid,boolean), public.my_yapu_class(), public.record_yapu_activity() to authenticated;
grant select on public.yapu_profiles to service_role;

create function public.check_yapu_login_limit(p_keys text[]) returns boolean
language plpgsql security definer set search_path = '' as $$
declare current_hash text; count_attempts integer; allowed boolean := true;
begin
  if array_length(p_keys,1) is distinct from 2 then return false; end if;
  foreach current_hash in array p_keys loop
    if current_hash !~ '^[a-f0-9]{64}$' then return false; end if;
    insert into yapu_private.login_limits values (current_hash, now(), 1)
    on conflict (key_hash) do update set
      attempts = case when yapu_private.login_limits.window_start < now()-interval '1 minute' then 1 else yapu_private.login_limits.attempts+1 end,
      window_start = case when yapu_private.login_limits.window_start < now()-interval '1 minute' then now() else yapu_private.login_limits.window_start end
    returning attempts into count_attempts;
    if count_attempts>20 then allowed := false; end if;
  end loop;
  delete from yapu_private.login_limits where window_start<now()-interval '1 day';
  return allowed;
end;
$$;
revoke all on function public.check_yapu_login_limit(text[]) from public, anon, authenticated;
grant execute on function public.check_yapu_login_limit(text[]) to service_role;

-- The automatic-RLS event trigger remains enabled, but it is not a client RPC.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
commit;
