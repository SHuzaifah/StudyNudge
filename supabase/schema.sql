-- Study Nudge Database Schema

-- 1. User Profiles
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  check_in_time time default '08:00',
  timezone text default 'UTC',
  theme text default 'light',
  notifications_enabled boolean default true,
  focus_score integer default 0,
  current_streak integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Ensure columns exist if table was created previously without them
alter table public.user_profiles add column if not exists display_name text;
alter table public.user_profiles add column if not exists avatar_url text;
alter table public.user_profiles add column if not exists check_in_time time default '08:00';
alter table public.user_profiles add column if not exists timezone text default 'UTC';
alter table public.user_profiles add column if not exists theme text default 'light';
alter table public.user_profiles add column if not exists notifications_enabled boolean default true;
alter table public.user_profiles add column if not exists focus_score integer default 0;
alter table public.user_profiles add column if not exists current_streak integer default 0;
alter table public.user_profiles add column if not exists updated_at timestamptz;


alter table public.user_profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.user_profiles;
create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Handle new user signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Tasks Table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamptz,
  priority text check (priority in ('low', 'medium', 'high')),
  completed boolean default false,
  image_url text,
  category text,
  recurring text,
  created_at timestamptz default now()
);

-- Ensure columns exist
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists image_url text;
alter table public.tasks add column if not exists category text;
alter table public.tasks add column if not exists recurring text;

alter table public.tasks enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);


-- 3. Chat Messages Table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  sender text check (sender in ('user', 'persona')) not null,
  type text default 'text',
  image_url text,
  created_at timestamptz default now()
);

-- Ensure columns exist
alter table public.messages add column if not exists image_url text;
alter table public.messages add column if not exists type text default 'text';

alter table public.messages enable row level security;

drop policy if exists "Users can view their own messages" on public.messages;
create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own messages" on public.messages;
create policy "Users can insert their own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);


-- 4. Personas Table
create table if not exists public.personas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  tone text,
  avatar_url text,
  is_active boolean default false,
  created_at timestamptz default now()
);

alter table public.personas enable row level security;

drop policy if exists "Users can manage their own personas" on public.personas;
create policy "Users can manage their own personas"
  on public.personas for all
  using (auth.uid() = user_id);

-- Add new columns for Task Enhancements
alter table public.tasks add column if not exists category_color text;
alter table public.tasks add column if not exists is_recurring boolean default false;
alter table public.tasks add column if not exists recurring_interval text;
alter table public.tasks add column if not exists subtasks jsonb default '[]'::jsonb;

