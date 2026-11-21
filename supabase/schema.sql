-- Banaras store: full data model.
-- Run this once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.
-- Row Level Security is ON for every table. The website server uses the service role key
-- (which bypasses RLS); the public "anon" key can only read live catalogue rows.

create extension if not exists "pgcrypto";

create table if not exists weavers (
  id text primary key,
  name text not null,
  village text not null default '',
  story text not null default '',
  placeholder boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists drops (
  id int primary key,               -- drop number, e.g. 7
  title text not null default '',
  opens_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null check (category in ('saree','suit_set','anarkali','suit_fabric','dupatta')),
  weave text not null default '',
  colour text not null default '',
  colour_hex text not null default '',
  colour_family text not null default '',
  occasion text[] not null default '{}',
  price int not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  -- Copy may say "pure silk", "handloom" or "Silk Mark" ONLY when this is true.
  silk_mark boolean not null default false,
  weaver_id text references weavers(id),
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','live','sold_out')),
  drop_id int references drops(id),
  featured boolean not null default false,
  on_model boolean not null default false,
  cover jsonb,                       -- optional card image {url,width,height,widths}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,                -- base path (with variants) or a full URL
  type text not null default 'photo' check (type in ('photo','video')),
  width int not null,
  height int not null,
  variants int[] not null default '{}',  -- pre-built webp widths, e.g. {480,800,1200}
  sort int not null default 0
);
create index if not exists product_media_product_idx on product_media(product_id);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null default '',
  -- Consent (India DPDP Act): when, where from, and the exact words shown.
  opt_in_at timestamptz,
  opt_in_source text not null default '',   -- qr | trunk_show | website | referral | trial_form | checkout
  consent_text text not null default '',
  society text not null default '',
  segments text[] not null default '{}',
  unsubscribed_at timestamptz,
  last_read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  status text not null default 'ai' check (status in ('ai','human','closed')),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  kind text not null default 'text',
  body text not null default '',
  wa_message_id text unique,
  status text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,              -- e.g. ZL-482913
  created_at timestamptz not null default now(),
  status text not null check (status in ('pending_payment','new','packed','shipped','delivered','cancelled')),
  customer_name text not null,
  phone text not null,
  email text not null default '',
  address jsonb not null,
  slot text not null default '',
  subtotal int not null,
  discount int not null default 0,
  offer_code text not null default '',
  shipping int not null default 0,
  total int not null,
  payment_method text not null check (payment_method in ('upi','card','cod')),
  payment_status text not null check (payment_status in ('pending','paid','cod_due','failed')),
  payment_ref text not null default '',
  gateway_order_id text not null default '',
  stock_taken boolean not null default false
);
create index if not exists orders_phone_idx on orders(phone);
create index if not exists orders_gateway_idx on orders(gateway_order_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  product_code text not null,
  name text not null,
  qty int not null check (qty > 0),
  unit_price int not null,
  line_total int not null,
  image text not null default ''
);
create index if not exists order_items_order_idx on order_items(order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  gateway text not null,
  gateway_payment_id text not null default '',
  amount int not null,
  status text not null,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  courier text not null default '',
  awb text not null default '',
  status text not null default '',
  tracking_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists trials (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  society text not null default '',
  tower text not null default '',
  pincode text not null default '',
  slot text not null default '',
  pieces text not null default '',
  status text not null default 'booked' check (status in ('booked','done','cancelled'))
);

create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  segment text not null default '',
  scheduled_at timestamptz,
  status text not null default 'draft',
  estimated_cost numeric(10,2),
  created_at timestamptz not null default now()
);

create table if not exists broadcast_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references broadcasts(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  status text not null default 'queued',
  delivered_at timestamptz,
  read_at timestamptz,
  clicked_at timestamptz
);

create table if not exists escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  reason text not null,
  note text not null default '',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ai_rules (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

-- Take (or give back, with a negative qty) stock in one atomic step.
create or replace function take_stock(p_code text, p_qty int) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update products
     set stock = stock - p_qty,
         status = case when stock - p_qty <= 0 then 'sold_out'
                       when status = 'sold_out' and stock - p_qty > 0 then 'live'
                       else status end,
         updated_at = now()
   where code = p_code and stock - p_qty >= 0;
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function take_stock(text, int) from public, anon, authenticated;

-- Row Level Security on every table.
do $$
declare t text;
begin
  foreach t in array array['weavers','drops','products','product_media','contacts','conversations','messages',
    'orders','order_items','payments','shipments','trials','broadcasts','broadcast_recipients','escalations',
    'ai_rules','audit_log']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- The public may read only what the storefront shows. Everything else has no policy,
-- so it is reachable only by the server (service role).
drop policy if exists "public reads live products" on products;
create policy "public reads live products" on products for select to anon, authenticated
  using (status = 'live' and stock > 0);

drop policy if exists "public reads media of live products" on product_media;
create policy "public reads media of live products" on product_media for select to anon, authenticated
  using (exists (select 1 from products p where p.id = product_id and p.status = 'live' and p.stock > 0));

drop policy if exists "public reads weavers" on weavers;
create policy "public reads weavers" on weavers for select to anon, authenticated using (true);

drop policy if exists "public reads drops" on drops;
create policy "public reads drops" on drops for select to anon, authenticated using (true);

-- Public bucket for product photos uploaded from the dashboard (webp variants, never cropped).
-- Writes happen only on the server with the service role key; the public can only read.
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;
