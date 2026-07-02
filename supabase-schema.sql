-- ============================================================
-- Nordic Media Engine — Supabase schema
-- Kør i SQL Editor på et nyt Supabase-projekt (vælg EU-region)
-- ============================================================

-- 1) PROFILER OG ROLLER --------------------------------------
create type user_role as enum ('administrator', 'redaktoer', 'bidragyder');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role user_role not null default 'bidragyder',
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2) KATEGORIER -------------------------------------------------
create table if not exists categories (
  id serial primary key,
  slug text unique not null,
  label text not null,
  color_key text not null default 'accent' -- accent | accent2 | accent3 | accent4
);

insert into categories (slug, label, color_key) values
  ('nyheder', 'Nyheder', 'accent'),
  ('aktiviteter', 'Aktiviteter', 'accent2'),
  ('arrangementer', 'Arrangementer', 'accent3'),
  ('video', 'Video', 'accent4'),
  ('information', 'Information', 'accent')
on conflict (slug) do nothing;

-- 3) OPSLAG (POSTS) ----------------------------------------------
create type post_status as enum ('kladde', 'afventer', 'planlagt', 'udgivet', 'skjult');

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  category_id int references categories(id),
  title text not null,
  excerpt text,
  body text,
  media_url text,
  media_type text check (media_type in ('billede', 'video')),
  -- felter til kalenderkort (kun udfyldt for arrangementer)
  event_date date,
  event_time text,
  event_location text,
  status post_status not null default 'kladde',
  comments_enabled boolean not null default true,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_published_idx on posts (status, published_at desc);
create index if not exists posts_category_idx on posts (category_id);
create index if not exists posts_event_date_idx on posts (event_date);

-- 4) KOMMENTARER --------------------------------------------------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- 5) FAVORITTER ---------------------------------------------------
create table if not exists favorites (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- 6) PUSH-ABONNEMENTER ---------------------------------------------
-- Afsendelse kræver en Supabase Edge Function server-side (VAPID private key).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

-- 7) STORAGE (billeder/video) --------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- ============================================================
-- REALTIME — aktivér broadcast af ændringer på posts
-- ============================================================
alter publication supabase_realtime add table posts;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table favorites enable row level security;
alter table push_subscriptions enable row level security;

create policy "profiler er læsbare for godkendte brugere"
  on profiles for select using (auth.role() = 'authenticated');
create policy "brugere kan opdatere egen profil"
  on profiles for update using (auth.uid() = id);
create policy "administratorer kan opdatere alle profiler"
  on profiles for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrator')
  );

create policy "udgivne opslag er offentlige"
  on posts for select using (status = 'udgivet' and published_at <= now());
create policy "forfattere ser egne opslag"
  on posts for select using (auth.uid() = author_id);
create policy "redaktoerer og administratorer ser alt"
  on posts for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('redaktoer','administrator'))
  );
create policy "godkendte brugere kan oprette opslag"
  on posts for insert with check (auth.uid() = author_id);
create policy "forfattere kan redigere egne kladder"
  on posts for update using (auth.uid() = author_id and status in ('kladde','afventer'));
create policy "redaktoerer og administratorer kan redigere alt"
  on posts for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('redaktoer','administrator'))
  );
create policy "redaktoerer og administratorer kan slette"
  on posts for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('redaktoer','administrator'))
  );

create policy "kommentarer er offentligt læsbare"
  on comments for select using (true);
create policy "godkendte brugere kan kommentere"
  on comments for insert with check (auth.uid() = author_id);
create policy "ejer eller admin kan slette kommentar"
  on comments for delete using (
    auth.uid() = author_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('redaktoer','administrator'))
  );

create policy "brugere administrerer egne favoritter"
  on favorites for all using (auth.uid() = user_id);
create policy "brugere administrerer eget push-abonnement"
  on push_subscriptions for all using (auth.uid() = user_id);

-- ============================================================
-- STATISTIK-VIEW (admin-dashboard)
-- ============================================================
create or replace view post_stats as
select
  c.label as kategori,
  count(*) filter (where p.status = 'udgivet') as udgivet,
  count(*) filter (where p.status = 'afventer') as afventer,
  count(*) filter (where p.status = 'planlagt') as planlagt
from posts p
left join categories c on c.id = p.category_id
group by c.label;
