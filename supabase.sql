-- QMUL BA Politics – International Relations Timetable
-- Supabase schema, RLS policies, indexes, and seed data

-- Tables --------------------------------------------------------------------
create table if not exists public.timetable_events (
  id bigserial primary key,
  day text not null check (day in ('Wednesday','Thursday','Friday')),
  start_time time not null,
  end_time time not null,
  constraint chk_time_order check (end_time > start_time),
  module_name text not null,
  module_code text,
  event_type text not null check (event_type in ('lecture','seminar','dissertation')),
  location text not null,
  lecturer text,
  color_code text default '#3366cc',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_profile (
  id bigserial primary key,
  student_code text unique not null,
  programme text not null,
  course text not null,
  school text not null,
  academic_year text,
  created_at timestamptz not null default now()
);

-- Indexes -------------------------------------------------------------------
create index if not exists timetable_events_day_time_idx on public.timetable_events (day, start_time);
create index if not exists timetable_events_module_code_idx on public.timetable_events (module_code);

-- Updated_at trigger ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_timetable_events_updated_at on public.timetable_events;
create trigger set_timetable_events_updated_at
before update on public.timetable_events
for each row execute function public.set_updated_at();

-- RLS -----------------------------------------------------------------------
alter table public.timetable_events enable row level security;
alter table public.student_profile enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'timetable_events' and policyname = 'Allow public read access'
  ) then
    create policy "Allow public read access" on public.timetable_events for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'student_profile' and policyname = 'Allow public read access'
  ) then
    create policy "Allow public read access" on public.student_profile for select using (true);
  end if;
end $$;

-- Initial student profile ----------------------------------------------------
insert into public.student_profile (student_code, programme, course, school, academic_year)
values ('210693391/1', 'BA FT POLITICS', 'International Relations', 'School of Politics and International Relations', '2024/25')
on conflict (student_code) do nothing;

-- Sample timetable events (optional) ----------------------------------------
-- Wednesday
insert into public.timetable_events (day, start_time, end_time, module_name, module_code, event_type, location, lecturer, color_code) values
('Wednesday','13:00','14:00','International Relations Theory','POL123','lecture','Francis Bancroft Building, Room 2.14','Dr. Smith','#8B1A3D'),
('Wednesday','15:00','16:00','International Relations Theory','POL123','seminar','Graduate Centre, Room 4.25','Dr. Smith','#00539B');

-- Thursday
insert into public.timetable_events (day, start_time, end_time, module_name, module_code, event_type, location, lecturer, color_code) values
('Thursday','10:00','11:00','Global Political Economy','POL456','lecture','People\'s Palace, Lecture Theatre A','Prof. Johnson','#8B1A3D'),
('Thursday','11:00','12:00','Foreign Policy Analysis','POL789','lecture','Arts Two, Room 3.16','Dr. Brown','#8B1A3D'),
('Thursday','13:00','14:00','Global Political Economy','POL456','seminar','Mile End Campus, Room 1.12','Prof. Johnson','#00539B'),
('Thursday','14:00','15:00','Foreign Policy Analysis','POL789','seminar','Queens\' Building, Room 2.08','Dr. Brown','#00539B'),
('Thursday','15:00','16:00','Dissertation Supervision','POL999','dissertation','School of Politics Office','Student Advisor','#2E8B57');

-- Friday
insert into public.timetable_events (day, start_time, end_time, module_name, module_code, event_type, location, lecturer, color_code) values
('Friday','11:00','12:00','International Security','POL321','lecture','Bancroft Building, Lecture Theatre 1','Dr. Wilson','#8B1A3D'),
('Friday','13:00','14:00','International Security','POL321','seminar','Graduate Centre, Room 3.14','Dr. Wilson','#00539B'),
('Friday','15:00','16:00','Research Methods in Politics','POL654','seminar','Arts Two, Computer Lab 2','Dr. Davis','#00539B');

