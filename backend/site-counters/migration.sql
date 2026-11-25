
create schema cc_counters;
revoke all on schema cc_counters from public, anon, authenticated;
grant usage on schema cc_counters to service_role;
create table cc_counters.totals (
 key text primary key,
 legacy_value bigint check(legacy_value>=0),
 new_value bigint not null default 0 check(new_value>=0),
 retry_after timestamptz not null default '-infinity',
 restored_at timestamptz not null default now()
);
alter table cc_counters.totals enable row level security;
grant select,insert,update on cc_counters.totals to service_role;


create or replace function public.cc_site_counter(p_key text,p_increment boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r cc_counters.totals; sync boolean:=false;
begin
 insert into cc_counters.totals(key,legacy_value)
 values(p_key,case when p_key ~ '_day_[0-9]{8}$' and right(p_key,8)>'20261125' then 0 else null end)
 on conflict do nothing;
 select * into r from cc_counters.totals where key=p_key for update;
 if p_increment then r.new_value:=r.new_value+1; end if;
 if r.legacy_value is null and r.retry_after<now() then
  sync:=true; r.retry_after:=now()+interval '5 minutes';
 end if;
 update cc_counters.totals set new_value=r.new_value,retry_after=r.retry_after where key=p_key;
 return jsonb_build_object('key',p_key,'value',coalesce(r.legacy_value,0)+r.new_value,
  'historical_pending',r.legacy_value is null,'sync',sync);
end; $$;
revoke all on function public.cc_site_counter(text,boolean) from public,anon,authenticated;
grant execute on function public.cc_site_counter(text,boolean) to service_role;

create function public.cc_site_counter_seed(p_key text,p_value bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r cc_counters.totals;
begin
 if p_value<0 then raise exception 'Invalid count'; end if;
 update cc_counters.totals set legacy_value=coalesce(legacy_value,p_value) where key=p_key returning * into r;
 return jsonb_build_object('key',p_key,'value',r.legacy_value+r.new_value,'historical_pending',false);
end; $$;
revoke all on function public.cc_site_counter_seed(text,bigint) from public,anon,authenticated;
grant execute on function public.cc_site_counter_seed(text,bigint) to service_role;
