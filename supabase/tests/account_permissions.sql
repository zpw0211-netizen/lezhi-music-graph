-- Run after the migration. All fixtures and temporary functions are rolled back.
begin;
create temporary table yapu_test_ids as select gen_random_uuid() teacher_a,gen_random_uuid() teacher_b,gen_random_uuid() student_a,gen_random_uuid() student_b,gen_random_uuid() unconfirmed;
grant select on yapu_test_ids to authenticated,anon;
create function pg_temp.yapu_assert(condition boolean, description text) returns void language plpgsql as $$
begin if condition is distinct from true then raise exception 'FAILED: %',description; end if; end;
$$;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
select teacher_a,'fixture-teacher-a@invalid.invalid',now(),'{}'::jsonb,'{}'::jsonb from yapu_test_ids union all
select teacher_b,'fixture-teacher-b@invalid.invalid',now(),'{}','{}' from yapu_test_ids union all
select student_a,'fixture-student-a@invalid.invalid',now(),'{}','{}' from yapu_test_ids union all
select student_b,'fixture-student-b@invalid.invalid',now(),'{}','{}' from yapu_test_ids union all
select unconfirmed,'fixture-unconfirmed@invalid.invalid',null,'{}','{}' from yapu_test_ids;

select pg_temp.yapu_assert(not has_table_privilege('anon','public.yapu_profiles','select'),'anonymous profile read denied');
select pg_temp.yapu_assert(not has_function_privilege('anon','public.complete_yapu_profile(text,text,text,text)','execute'),'anonymous profile creation denied');
select pg_temp.yapu_assert(not has_function_privilege('authenticated','public.check_yapu_login_limit(text[])','execute'),'server login limiter restricted');
select pg_temp.yapu_assert(not has_table_privilege('authenticated','yapu_private.class_invites','select'),'private invite read denied');
select pg_temp.yapu_assert(not has_table_privilege('authenticated','public.yapu_profiles','update'),'direct role escalation denied');

select set_config('request.jwt.claims',json_build_object('sub',unconfirmed,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
do $$ begin
  begin perform public.complete_yapu_profile('fixture_unconfirmed','未验证','student',null); raise exception 'FAILED: unverified contact was accepted';
  exception when others then if sqlerrm <> '请先完成联系方式验证。' then raise; end if; end;
end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',teacher_a,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
select public.complete_yapu_profile('fixture_teacher_a','测试教师甲','teacher','广东省');
select public.create_yapu_class('测试班级甲');
do $$ begin
  begin perform public.create_yapu_class('第二个班'); raise exception 'FAILED: two classes accepted';
  exception when others then if sqlerrm <> '你已经创建了一个班级。' then raise; end if; end;
end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',teacher_b,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
select public.complete_yapu_profile('fixture_teacher_b','测试教师乙','teacher','浙江省');
select public.create_yapu_class('测试班级乙');
reset role;

create temporary table yapu_test_codes as select c.teacher_id,i.code from public.yapu_classes c join yapu_private.class_invites i on i.class_id=c.id where c.teacher_id in (select teacher_a from yapu_test_ids union select teacher_b from yapu_test_ids);
grant select on yapu_test_codes to authenticated;
select set_config('request.jwt.claims',json_build_object('sub',student_a,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
select public.complete_yapu_profile('fixture_student_a','测试学生甲','student','河北省');
select pg_temp.yapu_assert(public.request_yapu_class((select code from yapu_test_codes where teacher_id=(select teacher_a from yapu_test_ids)))='申请已发送，请等待老师确认。','valid invite accepted');
select pg_temp.yapu_assert((select count(*) from public.yapu_profiles)=1,'student cannot read peers or teachers');
select pg_temp.yapu_assert((public.my_yapu_class()->>'status')='pending','membership pending teacher approval');
select pg_temp.yapu_assert(not(public.my_yapu_class() ? 'invite_code'),'student receives no invite code');
do $$ begin
  begin perform public.create_yapu_class('学生建班'); raise exception 'FAILED: student created class';
  exception when others then if sqlerrm <> '只有教师可以创建班级。' then raise; end if; end;
end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',teacher_b,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
select pg_temp.yapu_assert(not exists(select 1 from public.yapu_profiles where id=(select student_a from yapu_test_ids)),'other teacher cannot read student');
do $$ begin
  begin perform public.review_yapu_student((select student_a from yapu_test_ids),true); raise exception 'FAILED: other teacher approved student';
  exception when others then if sqlerrm <> '你无权审核这个学生。' then raise; end if; end;
end $$;
reset role;

select set_config('request.jwt.claims',json_build_object('sub',teacher_a,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
select pg_temp.yapu_assert(exists(select 1 from public.yapu_profiles where id=(select student_a from yapu_test_ids)),'own teacher sees application');
select public.review_yapu_student((select student_a from yapu_test_ids),true);
reset role;

select set_config('request.jwt.claims',json_build_object('sub',student_a,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
select pg_temp.yapu_assert((public.my_yapu_class()->>'status')='approved','approval binds student');
select pg_temp.yapu_assert((select class_province from public.yapu_profiles where id=auth.uid())='广东省','approved class province inherited');
select pg_temp.yapu_assert(public.request_yapu_class((select code from yapu_test_codes where teacher_id=(select teacher_b from yapu_test_ids)))='你已有班级或待审核申请，请先查看我的班级。','one class per student enforced');
select public.record_yapu_activity();
select public.record_yapu_activity();
reset role;
select pg_temp.yapu_assert((select count(*) from yapu_private.activity_days where user_id=(select student_a from yapu_test_ids))=1,'daily activity deduplicated');

select set_config('request.jwt.claims',json_build_object('sub',student_b,'role','authenticated')::text,true) from yapu_test_ids;
set local role authenticated;
select public.complete_yapu_profile('fixture_student_b','测试学生乙','student',null);
select public.request_yapu_class('0000000000');
select public.request_yapu_class('0000000000');
select public.request_yapu_class('0000000000');
select public.request_yapu_class('0000000000');
select public.request_yapu_class('0000000000');
select pg_temp.yapu_assert(public.request_yapu_class('0000000000')='申请过于频繁，请 10 分钟后再试。','invalid invite attempts throttled');
reset role;
rollback;
select 'PASS: account permissions, verification requirement, class binding, region inheritance and throttling. Fixtures rolled back.' as result;
