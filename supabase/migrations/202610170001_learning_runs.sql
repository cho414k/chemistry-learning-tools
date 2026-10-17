create table public.learning_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 run_id uuid not null,
 completed_at timestamptz not null default now(),
 coins integer not null check(coins=500),
 first_correct integer not null check(first_correct between 0 and 5),
 attempts integer not null check(attempts between 5 and 500),
 unique(user_id,run_id)
);
alter table public.learning_runs enable row level security;
revoke all on public.learning_runs from anon, authenticated;
grant select,insert on public.learning_runs to authenticated;
create policy own_runs_read on public.learning_runs for select to authenticated using((select auth.uid())=user_id);
create policy own_runs_insert on public.learning_runs for insert to authenticated with check((select auth.uid())=user_id);
create table public.signup_limits (bucket text primary key, hits integer not null, window_start timestamptz not null);
alter table public.signup_limits enable row level security;
revoke all on public.signup_limits from public,anon,authenticated;
grant all on public.signup_limits to service_role;
create function public.consume_signup_quota(bucket_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 delete from public.signup_limits where window_start < now()-interval '1 day';
 insert into public.signup_limits(bucket,hits,window_start) values(bucket_key,1,date_trunc('hour',now()))
 on conflict(bucket) do update set hits=case when public.signup_limits.window_start < date_trunc('hour',now()) then 1 else public.signup_limits.hits+1 end,window_start=date_trunc('hour',now())
 returning hits into n;
 return n<=60;
end $$;
revoke all on function public.consume_signup_quota(text) from public,anon,authenticated;
grant execute on function public.consume_signup_quota(text) to service_role;
