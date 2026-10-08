-- InnerCircle database setup.
-- Paste all of this into Supabase: SQL Editor -> New query -> Run.
-- Safe to run more than once.

create extension if not exists pgcrypto;

-- One row per team. The team's content (players, posts, matches, subscribers, …)
-- is stored as one JSON document, the same shape the app uses.
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_code text not null unique,
  coach_code text not null unique,
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nobody reads the table directly. Everything goes through the functions below,
-- which check the team code or coach code.
alter table public.teams enable row level security;
revoke all on public.teams from anon, authenticated;

create or replace function public.ic_norm(p text) returns text
language sql immutable as $$ select upper(regexp_replace(coalesce(p, ''), '\s', '', 'g')) $$;

-- What a member or coach gets back: the stored document plus the codes they may see.
create or replace function public.ic_payload(t public.teams, p_role text) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'role', p_role,
    'version', t.version,
    'data', t.data
      || jsonb_build_object('teamName', t.name, 'teamCode', t.team_code)
      || case when p_role = 'coach' then jsonb_build_object('coachCode', t.coach_code) else '{}'::jsonb end
  )
$$;

create or replace function public.ic_insert_team(p_name text, p_team_code text, p_coach_code text, p_data jsonb)
returns jsonb
language sql security definer set search_path = public as $$
  with ins as (
    insert into teams (name, team_code, coach_code, data)
    values (trim(p_name), p_team_code, p_coach_code, coalesce(p_data, '{}'::jsonb) - 'coachCode' - 'teamCode')
    returning *
  )
  select ic_payload(ins, 'coach') from ins
$$;

create or replace function public.create_team(p_name text, p_coach_code text, p_team_code text, p_data jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cc text := ic_norm(p_coach_code);
  tc text := ic_norm(p_team_code);
begin
  if length(cc) < 4 or length(tc) < 4 or cc = tc then
    raise exception 'invalid_codes';
  end if;
  if exists (select 1 from teams where team_code in (cc, tc) or coach_code in (cc, tc)) then
    raise exception 'code_taken';
  end if;
  return ic_insert_team(p_name, tc, cc, p_data);
end $$;

create or replace function public.join_team(p_code text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  c text := ic_norm(p_code);
  t teams;
begin
  t := (select x from teams x where x.coach_code = c);
  if t.id is not null then return ic_payload(t, 'coach'); end if;
  t := (select x from teams x where x.team_code = c);
  if t.id is not null then return ic_payload(t, 'member'); end if;
  return null;
end $$;

create or replace function public.team_version(p_code text)
returns integer
language sql stable security definer set search_path = public as $$
  select version from teams where team_code = ic_norm(p_code) or coach_code = ic_norm(p_code) limit 1
$$;

-- Saves a new version of the team document.
-- Coaches may change everything. Members (players, parents, subscribers) may only change
-- likes, consent, their own subscription and payments; everything else is kept as it was.
-- Returns ok=false with the current document if someone else saved first.
create or replace function public.save_team(p_code text, p_version integer, p_data jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c text := ic_norm(p_code);
  t teams;
  r text;
  prev jsonb;
  merged jsonb;
  k text;
begin
  t := (select x from teams x where x.coach_code = c for update);
  if t.id is not null then
    r := 'coach';
  else
    t := (select x from teams x where x.team_code = c for update);
    if t.id is null then raise exception 'unknown_team'; end if;
    r := 'member';
  end if;

  if t.version <> p_version then
    return ic_payload(t, r) || jsonb_build_object('ok', false);
  end if;

  merged := coalesce(p_data, '{}'::jsonb) - 'coachCode' - 'teamCode' - 'teamName';

  if r = 'member' then
    prev := t.data;
    foreach k in array array['matches', 'price', 'payout', 'coachConsents', 'notifs', 'reminders', 'reports', 'ytdBase', 'account'] loop
      if (prev -> k) is not null then merged := jsonb_set(merged, array[k], prev -> k); else merged := merged - k; end if;
    end loop;

    -- Posts: same posts as before; only hearts and tags (a parent removing their child) may change.
    merged := jsonb_set(merged, '{posts}', coalesce((
      select jsonb_agg(
        case when np.v is null then op.v
        else op.v || jsonb_build_object(
          'likedBy', coalesce(np.v -> 'likedBy', op.v -> 'likedBy', '[]'::jsonb),
          'tagged', coalesce(np.v -> 'tagged', op.v -> 'tagged', '[]'::jsonb))
        end order by op.ord)
      from jsonb_array_elements(coalesce(prev -> 'posts', '[]'::jsonb)) with ordinality op(v, ord)
      left join jsonb_array_elements(coalesce(p_data -> 'posts', '[]'::jsonb)) np(v) on np.v ->> 'id' = op.v ->> 'id'
    ), '[]'::jsonb));

    -- Players: same players as before; only consent fields may change.
    merged := jsonb_set(merged, '{players}', coalesce((
      select jsonb_agg(
        case when np.v is null then op.v
        else op.v || coalesce((
          select jsonb_object_agg(e.key, e.value) from jsonb_each(np.v) e
          where e.key in ('consent', 'declined', 'selfLogin')), '{}'::jsonb)
        end order by op.ord)
      from jsonb_array_elements(coalesce(prev -> 'players', '[]'::jsonb)) with ordinality op(v, ord)
      left join jsonb_array_elements(coalesce(p_data -> 'players', '[]'::jsonb)) np(v) on np.v ->> 'id' = op.v ->> 'id'
    ), '[]'::jsonb));
  end if;

  update teams set data = merged, version = version + 1, updated_at = now() where id = t.id;
  t := (select x from teams x where x.id = t.id);
  return ic_payload(t, r) || jsonb_build_object('ok', true);
end $$;

revoke all on function public.ic_insert_team(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.create_team(text, text, text, jsonb) from public;
revoke all on function public.join_team(text) from public;
revoke all on function public.team_version(text) from public;
revoke all on function public.save_team(text, integer, jsonb) from public;
grant execute on function public.create_team(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.join_team(text) to anon, authenticated;
grant execute on function public.team_version(text) to anon, authenticated;
grant execute on function public.save_team(text, integer, jsonb) to anon, authenticated;

-- Photos and signatures. Files get random names, so a link can't be guessed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "InnerCircle upload media" on storage.objects;
create policy "InnerCircle upload media" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'media');
