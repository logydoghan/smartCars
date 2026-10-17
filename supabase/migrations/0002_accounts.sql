-- Reader accounts (Supabase Auth, email and password): each reader's saved cars and the
-- comments on each car page.
--
-- Saves and comments point at a car by its slug, with no foreign key, so a car the agents
-- drop from the list simply stops showing instead of deleting everyone's comments.

create table if not exists profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now()
);

-- Every new account gets a profile, named from the sign-up form (or the email's first part).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 40)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists bookmarks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  car_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, car_slug)
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  car_slug text not null,
  user_id    uuid not null references profiles (id) on delete cascade,
  body       text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists bookmarks_user_idx on bookmarks (user_id, created_at desc);
create index if not exists comments_car_idx on comments (car_slug, created_at);

alter table profiles  enable row level security;
alter table bookmarks enable row level security;
alter table comments  enable row level security;

-- Names show next to comments, so anyone can read them; each reader edits only their own.
create policy "Public read" on profiles for select using (true);
create policy "Own profile" on profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Saved cars are private to their reader.
create policy "Own saves" on bookmarks for select using ((select auth.uid()) = user_id);
create policy "Save a car" on bookmarks for insert
  with check ((select auth.uid()) = user_id and exists (select 1 from cars c where c.slug = car_slug));
create policy "Unsave" on bookmarks for delete using ((select auth.uid()) = user_id);

-- Anyone can read comments; signed-in readers comment on cars the site covers and delete their own.
create policy "Public read" on comments for select using (true);
create policy "Comment" on comments for insert
  with check ((select auth.uid()) = user_id and exists (select 1 from cars c where c.slug = car_slug));
create policy "Delete own comment" on comments for delete using ((select auth.uid()) = user_id);
