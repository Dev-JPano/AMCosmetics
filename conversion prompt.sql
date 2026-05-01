-- =========================================================
-- AM Cosmetic Hub - Supabase PostgreSQL Schema + Sample Data
-- Converted from XML database files
--
-- IMPORTANT IMAGE NOTE:
-- Local images from your project like:
-- images/brand/avon.png
-- images/product/qr.png
-- images/product/True Colour Perfectly Matte.png
-- images/product/Ultra Matte Lipstick - Ravishing Rose.png
--
-- must NOT be stored as local paths in Supabase.
-- Upload them to Cloudinary, Supabase Storage, Imgur, or another host,
-- then replace the placeholder URLs below.
-- =========================================================


-- Optional cleanup while testing.
-- Remove this section if you already have real data.
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists payments cascade;
drop table if exists product_reviews cascade;
drop table if exists product_images cascade;
drop table if exists products cascade;
drop table if exists brands cascade;
drop table if exists admins cascade;
drop table if exists app_config cascade;


-- =========================================================
-- ADMINS
-- Source: database/admins.xml
-- NOTE: Do not store plain passwords in production.
-- Store hashed passwords only.
-- =========================================================

create table admins (
    id text primary key,
    name text not null,
    username text unique not null,
    password_hash text not null,
    role text not null default 'admin',
    status text not null default 'offline',
    created_at timestamp with time zone default now()
);

insert into admins (
    id,
    name,
    username,
    password_hash,
    role,
    status,
    created_at
) values
(
    'ADM-0001',
    'Mae Ann Laurel',
    'annie',
    'REPLACE_WITH_HASHED_PASSWORD_FOR_--admin',
    'admin',
    'offline',
    '2026-04-07T00:00:00+08:00'
),
(
    'ADM-0002',
    'Alixa Rose Gudelosao',
    'lexie',
    'REPLACE_WITH_HASHED_PASSWORD_FOR_--admin',
    'admin',
    'offline',
    '2026-04-07T00:00:00+08:00'
);


-- =========================================================
-- APP CONFIG
-- Source: database/config.xml
-- Local image filenames converted to URL placeholders.
-- =========================================================

create table app_config (
    id bigint generated always as identity primary key,
    title text not null,
    currency text not null default 'PHP',
    theme text not null default 'light',
    accept_mode text not null default 'MANUAL',

    cod_percent numeric(10, 2) not null default 0,
    ewallet_percent numeric(10, 2) not null default 0,
    counter_percent numeric(10, 2) not null default 0,
    card_percent numeric(10, 2) not null default 0,

    qr_code_url text,
    product_fallback_url text,
    brand_fallback_url text,

    tracking_prefix text not null default 'AMCH',

    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

insert into app_config (
    title,
    currency,
    theme,
    accept_mode,
    cod_percent,
    ewallet_percent,
    counter_percent,
    card_percent,
    qr_code_url,
    product_fallback_url,
    brand_fallback_url,
    tracking_prefix
) values (
    'AM Cosmetic Hub',
    'PHP',
    'light',
    'MANUAL',
    3,
    2,
    2,
    0,

    -- Original local file: images/product/qr.png
    'https://YOUR_IMAGE_HOST_HERE/qr.png',

    -- Original local file from config.xml: product_fallback.png
    'https://YOUR_IMAGE_HOST_HERE/product_fallback.png',

    -- Original local file from config.xml: brand_fallback.png
    'https://YOUR_IMAGE_HOST_HERE/brand_fallback.png',

    'AMCH'
);


-- =========================================================
-- BRANDS
-- Source: database/brands.xml
-- Local image filename converted to image_url.
-- =========================================================

create table brands (
    id text primary key,
    name text not null,
    image_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

insert into brands (
    id,
    name,
    image_url
) values (
    'B0001',
    'Avon Cosmetics',

    -- Original local file: images/brand/avon.png
    'https://YOUR_IMAGE_HOST_HERE/avon.png'
);


-- =========================================================
-- PRODUCTS
-- Source: database/products.xml
-- =========================================================

create table products (
    id text primary key,
    brand_id text not null references brands(id) on delete cascade,
    name text not null,
    description text,
    real_price numeric(10, 2) not null default 0,
    display_price numeric(10, 2) not null default 0,
    stock integer not null default 0,
    sold integer not null default 0,
    cart_added_count integer not null default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

insert into products (
    id,
    brand_id,
    name,
    description,
    real_price,
    display_price,
    stock,
    sold,
    cart_added_count,
    created_at,
    updated_at
) values
(
    'P0001',
    'B0001',
    'Ultra Matte Lipstick - Ravishing Rose',
    '--add me--',
    399.00,
    279.00,
    444,
    6,
    2,
    '2026-04-07T00:00:00+08:00',
    '2026-04-07T14:22:20.153+08:00'
),
(
    'P0002',
    'B0001',
    'True Colour Perfectly Matte',
    '--add me--',
    279.00,
    224.00,
    185,
    15,
    5,
    '2026-04-07T00:00:00+08:00',
    '2026-04-07T00:00:00+08:00'
);


-- =========================================================
-- PRODUCT IMAGES
-- Local image filenames converted to image_url.
-- =========================================================

create table product_images (
    id bigint generated always as identity primary key,
    product_id text not null references products(id) on delete cascade,
    image_url text not null,
    alt_text text,
    sort_order integer not null default 1,
    created_at timestamp with time zone default now()
);

insert into product_images (
    product_id,
    image_url,
    alt_text,
    sort_order
) values
(
    'P0001',

    -- Original local file:
    -- images/product/Ultra Matte Lipstick - Ravishing Rose.png
    'https://YOUR_IMAGE_HOST_HERE/Ultra-Matte-Lipstick-Ravishing-Rose.png',

    'Ultra Matte Lipstick - Ravishing Rose',
    1
),
(
    'P0002',

    -- Original local file:
    -- images/product/True Colour Perfectly Matte.png
    'https://YOUR_IMAGE_HOST_HERE/True-Colour-Perfectly-Matte.png',

    'True Colour Perfectly Matte',
    1
);


-- =========================================================
-- PRODUCT REVIEWS
-- Source: nested reviews inside database/products.xml
-- Empty XML review fields are stored as NULL where useful.
-- =========================================================

create table product_reviews (
    id text primary key,
    product_id text not null references products(id) on delete cascade,
    order_id text,
    customer_name text default 'Anonymous',
    visible boolean not null default false,
    rating integer default 0 check (rating >= 0 and rating <= 5),
    text text,
    reply text,
    reply_admin text,
    like_count integer not null default 0,
    dislike_count integer not null default 0,
    review_date date,
    review_time time,
    created_at timestamp with time zone default now(),
    status text default 'visible'
);

insert into product_reviews (
    id,
    product_id,
    order_id,
    customer_name,
    visible,
    rating,
    text,
    reply,
    reply_admin,
    like_count,
    dislike_count,
    review_date,
    review_time,
    created_at,
    status
) values
(
    'REV-P0001-0001',
    'P0001',
    null,
    'Anonymous',
    false,
    0,
    null,
    null,
    null,
    0,
    0,
    null,
    null,
    null,
    'visible'
),
(
    'REV-P0002-0001',
    'P0002',
    null,
    'Anonymous',
    false,
    0,
    null,
    null,
    null,
    0,
    0,
    null,
    null,
    null,
    null
);


-- =========================================================
-- PAYMENTS
-- Source: database/payments.xml
--
-- NOTE:
-- One payment in the XML has repeated <status> values.
-- For clean SQL, only one final status column is used.
-- I used the last meaningful/current status from each payment.
-- =========================================================

create table payments (
    id text primary key,
    amount numeric(10, 2) not null default 0,
    method text not null,
    status text not null default 'Pending',
    paid numeric(10, 2) not null default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

insert into payments (
    id,
    amount,
    method,
    status,
    paid
) values
(
    'PAY-1775570393086',
    224.00,
    'GCash',
    'Pending',
    228.48
),
(
    'PAY-1775571858064',
    224.00,
    'Cash On Delivery',
    'Pending',
    230.72
),
(
    'PAY-1775572637479',
    951.00,
    'GCash',
    'Accepted',
    970.02
),
(
    'PAY-1775573134994',
    279.00,
    'GCash',
    'Accepted',
    284.58
);


-- =========================================================
-- ORDERS
-- Source: database/orders.xml
-- =========================================================

create table orders (
    id text primary key,
    payment_id text references payments(id) on delete set null,
    reference text unique not null,

    customer_ip text,
    customer_name text not null,
    customer_address text,
    customer_landmark text,
    customer_number text,
    customer_email text,

    order_date date,
    order_time time,

    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

insert into orders (
    id,
    payment_id,
    reference,
    customer_ip,
    customer_name,
    customer_address,
    customer_landmark,
    customer_number,
    customer_email,
    order_date,
    order_time
) values
(
    'ORD-1775572637479',
    'PAY-1775572637479',
    'AMCH-DY4T98G4',
    '127.0.0.1',
    'asd',
    'asd',
    'asd',
    'asd',
    'asd',
    '2026-04-07',
    '22:37:17'
),
(
    'ORD-1775573134994',
    'PAY-1775573134994',
    'AMCH-1OZZ4GR7',
    '127.0.0.1',
    'Jhon Anthony Pano',
    'St. Napo',
    'asd',
    'ads',
    'jpano487023@gmail.com',
    '2026-04-07',
    '22:45:34'
);


-- =========================================================
-- ORDER ITEMS
-- Source: products inside database/orders.xml
-- =========================================================

create table order_items (
    id bigint generated always as identity primary key,
    order_id text not null references orders(id) on delete cascade,
    product_id text not null references products(id) on delete restrict,
    quantity integer not null default 1,
    price numeric(10, 2) not null default 0,
    total numeric(10, 2) not null default 0,
    request text,
    created_at timestamp with time zone default now()
);

insert into order_items (
    order_id,
    product_id,
    quantity,
    price,
    total,
    request
) values
(
    'ORD-1775572637479',
    'P0002',
    3,
    224.00,
    672.00,
    'asd'
),
(
    'ORD-1775572637479',
    'P0001',
    1,
    279.00,
    279.00,
    'asd'
),
(
    'ORD-1775573134994',
    'P0001',
    1,
    279.00,
    279.00,
    'd123'
);


-- =========================================================
-- HELPFUL INDEXES
-- =========================================================

create index idx_products_brand_id on products(brand_id);
create index idx_product_images_product_id on product_images(product_id);
create index idx_product_reviews_product_id on product_reviews(product_id);
create index idx_orders_payment_id on orders(payment_id);
create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_product_id on order_items(product_id);


-- =========================================================
-- OPTIONAL UPDATED_AT AUTO UPDATE FUNCTION
-- =========================================================

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_admins_updated_at
before update on admins
for each row
execute function set_updated_at();

create trigger set_app_config_updated_at
before update on app_config
for each row
execute function set_updated_at();

create trigger set_brands_updated_at
before update on brands
for each row
execute function set_updated_at();

create trigger set_products_updated_at
before update on products
for each row
execute function set_updated_at();

create trigger set_payments_updated_at
before update on payments
for each row
execute function set_updated_at();

create trigger set_orders_updated_at
before update on orders
for each row
execute function set_updated_at();

-- =========================================================
-- FIX: updated_at trigger error on admins table
-- ERROR:
-- record "new" has no field "updated_at"
-- =========================================================

-- 1. Make sure admins table has updated_at column
alter table admins
add column if not exists updated_at timestamp with time zone default now();

-- 2. Recreate the updated_at function safely
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 3. Remove old admins trigger if it exists
drop trigger if exists set_admins_updated_at on admins;

-- 4. Recreate admins trigger
create trigger set_admins_updated_at
before update on admins
for each row
execute function set_updated_at();

-- 5. Set your development admin password to plain --admin
-- Your current Flask login supports plain text temporarily.
update admins
set password_hash = '--admin'
where username in ('annie', 'lexie');

-- 6. Check result
select
    id,
    name,
    username,
    role,
    status,
    password_hash,
    created_at,
    updated_at
from admins
order by id;