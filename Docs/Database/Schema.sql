create extension if not exists pgcrypto;

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  bg TEXT NOT NULL,
  color TEXT NOT NULL,
  keep_zero BOOLEAN NOT NULL DEFAULT FALSE,
  default_expiry_months INTEGER NOT NULL DEFAULT 0 CHECK (default_expiry_months >= 0),
  notify_on_expiry BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE storage_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Archive',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE storage_zone_details (
  id SERIAL PRIMARY KEY,
  zone_id INT NOT NULL REFERENCES storage_zones(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE familly (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  family_id INT NOT NULL REFERENCES familly(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  stock FLOAT NOT NULL,
  expiry DATE,
  zone_id INT REFERENCES storage_zones(id) ON DELETE SET NULL,
  zone_detail_id INT REFERENCES storage_zone_details(id) ON DELETE SET NULL,
  value TEXT,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shopping_list_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);



create table if not exists public.dashboard_quick_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('category', 'family', 'zone', 'status')),
  target_value text not null,
  custom_title text,
  custom_description text,
  icon text not null default 'Package',
  accent_color text not null default '#3345b8',
  order_index integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists dashboard_quick_filters_user_id_order_index_idx
  on public.dashboard_quick_filters (user_id, order_index);

alter table public.dashboard_quick_filters enable row level security;

drop policy if exists "Users can read their quick filters" on public.dashboard_quick_filters;
create policy "Users can read their quick filters"
  on public.dashboard_quick_filters
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their quick filters" on public.dashboard_quick_filters;
create policy "Users can insert their quick filters"
  on public.dashboard_quick_filters
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their quick filters" on public.dashboard_quick_filters;
create policy "Users can update their quick filters"
  on public.dashboard_quick_filters
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their quick filters" on public.dashboard_quick_filters;
create policy "Users can delete their quick filters"
  on public.dashboard_quick_filters
  for delete
  using (auth.uid() = user_id);

ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zone_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE familly               ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON storage_zones
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON storage_zone_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON familly
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON inventory_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON shopping_list_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "authenticated_all" ON inventory_items
  IS 'Shared household data — full access for authenticated users. By design.';

COMMENT ON POLICY "authenticated_all" ON shopping_list_items
  IS 'Shared household data — full access for authenticated users. By design.';

COMMENT ON POLICY "authenticated_all" ON categories
  IS 'Shared household data — full access for authenticated users. By design.';

COMMENT ON POLICY "authenticated_all" ON familly
  IS 'Shared household data — full access for authenticated users. By design.';

COMMENT ON POLICY "authenticated_all" ON storage_zones
  IS 'Shared household data — full access for authenticated users. By design.';

COMMENT ON POLICY "authenticated_all" ON storage_zone_details
  IS 'Shared household data — full access for authenticated users. By design.';