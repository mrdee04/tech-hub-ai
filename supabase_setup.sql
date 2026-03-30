-- Cấu hình cơ sở dữ liệu Supabase cho TechHub AI
-- Bạn có thể dán toàn bộ đoạn mã này vào SQL Editor của Supabase để khởi tạo cấu trúc dữ liệu.

-- --------------------------------------------------------
-- ⚠️ QUAN TRỌNG: LÀM SAO ĐỂ TRỞ THÀNH ADMIN?
-- Sau khi chạy toàn bộ mã bên dưới, bạn hãy chạy lệnh SQL sau:
-- insert into public.profiles (id, full_name, role)
-- values ('ĐIỀN_USER_ID_CỦA_BẠN', 'Admin', 'admin')
-- on conflict (id) do update set role = 'admin';
-- (Bạn có thể lấy user_id trong bảng auth.users hoặc phần Authentication của Supabase)
-- --------------------------------------------------------

-- --------------------------------------------------------
-- TÙY CHỌN: Nếu bạn muốn xóa toàn bộ bảng cũ để tạo lại từ đầu (mất dữ liệu cũ), hãy bỏ comment các dòng này:
-- drop table if exists public.comments cascade;
-- drop table if exists public.reputation_reviews cascade;
-- drop table if exists public.sale_post_responses cascade;
-- drop table if exists public.sale_posts cascade;
-- drop table if exists public.reviews cascade;
-- drop table if exists public.reviewers cascade;
-- drop table if exists public.news cascade;
-- drop table if exists public.site_settings cascade;
-- drop table if exists public.products cascade;
-- drop table if exists public.profiles cascade;
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 1. Kích hoạt extension cho UUID
-- --------------------------------------------------------
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------
-- 2. Tạo Bảng (Tables) và Đảm bảo Cột Hiện Hữu
-- --------------------------------------------------------

-- a. Bảng Profiles (liên kết với auth.users của Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  reputation_score numeric default 0,
  review_count int default 0,
  contact_info text,
  telegram_username text,
  telegram_chat_id text,
  role text default 'user',
  created_at timestamp with time zone default now()
);
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists reputation_score numeric default 0;
alter table public.profiles add column if not exists review_count int default 0;
alter table public.profiles add column if not exists contact_info text;
alter table public.profiles add column if not exists telegram_username text;
alter table public.profiles add column if not exists telegram_chat_id text;
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists created_at timestamp with time zone default now();

-- b. Bảng Products (Sản phẩm)
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image_url text,
  bottom_price numeric,
  rating numeric default 0,
  review_count int default 0,
  top_review text,
  category text,
  shops jsonb,
  bottom_price_time text,
  bottom_price_platform text,
  bottom_price_link text,
  day_vuong text,
  variants jsonb default '{"attributes": [], "variantPrices": []}'::jsonb,
  created_at timestamp with time zone default now()
);
alter table public.products add column if not exists name text;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists bottom_price numeric;
alter table public.products add column if not exists rating numeric default 0;
alter table public.products add column if not exists review_count int default 0;
alter table public.products add column if not exists top_review text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists shops jsonb;
alter table public.products add column if not exists bottom_price_time text;
alter table public.products add column if not exists bottom_price_platform text;
alter table public.products add column if not exists bottom_price_link text;
alter table public.products add column if not exists day_vuong text;
alter table public.products add column if not exists variants jsonb default '{"attributes": [], "variantPrices": []}'::jsonb;
alter table public.products add column if not exists created_at timestamp with time zone default now();

-- c. Bảng Reviewers (Đánh giá viên)
create table if not exists public.reviewers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  avatar_url text,
  facebook_url text,
  youtube_url text,
  created_at timestamp with time zone default now()
);
alter table public.reviewers add column if not exists name text;
alter table public.reviewers add column if not exists avatar_url text;
alter table public.reviewers add column if not exists facebook_url text;
alter table public.reviewers add column if not exists youtube_url text;
alter table public.reviewers add column if not exists created_at timestamp with time zone default now();

-- d. Bảng Reviews (Đánh giá sản phẩm)
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  author text not null,
  content text,
  rating numeric default 0,
  type text check (type in ('user', 'reviewer')),
  "reviewerProfile" jsonb,
  "screenshotUrl" text,
  "postUrl" text,
  created_at timestamp with time zone default now()
);
alter table public.reviews add column if not exists product_id uuid;
alter table public.reviews add column if not exists author text;
alter table public.reviews add column if not exists content text;
alter table public.reviews add column if not exists rating numeric default 0;
alter table public.reviews add column if not exists type text;
alter table public.reviews add column if not exists "reviewerProfile" jsonb;
alter table public.reviews add column if not exists "screenshotUrl" text;
alter table public.reviews add column if not exists "postUrl" text;
alter table public.reviews add column if not exists created_at timestamp with time zone default now();

-- e. Bảng News (Tin tức)
create table if not exists public.news (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  summary text,
  source text,
  url text,
  image_url text,
  category text default 'all',
  published_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);
alter table public.news add column if not exists title text;
alter table public.news add column if not exists summary text;
alter table public.news add column if not exists source text;
alter table public.news add column if not exists url text;
alter table public.news add column if not exists image_url text;
alter table public.news add column if not exists category text default 'all';
alter table public.news add column if not exists published_at timestamp with time zone;
alter table public.news add column if not exists created_at timestamp with time zone default now();

-- f. Bảng Sale Posts (Bài đăng Săn Sale)
create table if not exists public.sale_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  type text check (type in ('request', 'offer', 'pass')),
  product_id uuid references public.products(id) on delete set null,
  custom_product_name text,
  details jsonb,
  target_price numeric,
  status text default 'open' check (status in ('open', 'matched', 'closed')),
  created_at timestamp with time zone default now()
);
alter table public.sale_posts add column if not exists user_id uuid;
alter table public.sale_posts add column if not exists type text;
alter table public.sale_posts add column if not exists product_id uuid;
alter table public.sale_posts add column if not exists custom_product_name text;
alter table public.sale_posts add column if not exists details jsonb;
alter table public.sale_posts add column if not exists target_price numeric;
alter table public.sale_posts add column if not exists status text default 'open';
alter table public.sale_posts add column if not exists created_at timestamp with time zone default now();

-- g. Bảng Sale Post Responses (Phản hồi Bài đăng Săn Sale)
create table if not exists public.sale_post_responses (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.sale_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  message text not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default now()
);
alter table public.sale_post_responses add column if not exists post_id uuid;
alter table public.sale_post_responses add column if not exists user_id uuid;
alter table public.sale_post_responses add column if not exists message text;
alter table public.sale_post_responses add column if not exists status text default 'pending';
alter table public.sale_post_responses add column if not exists created_at timestamp with time zone default now();

-- h. Bảng Reputation Reviews (Đánh giá Uy tín sau chia sẻ giao kèo)
create table if not exists public.reputation_reviews (
  id uuid primary key default uuid_generate_v4(),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewee_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.sale_posts(id) on delete set null,
  rating numeric not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);
alter table public.reputation_reviews add column if not exists reviewer_id uuid;
alter table public.reputation_reviews add column if not exists reviewee_id uuid;
alter table public.reputation_reviews add column if not exists post_id uuid;
alter table public.reputation_reviews add column if not exists rating numeric;
alter table public.reputation_reviews add column if not exists comment text;
alter table public.reputation_reviews add column if not exists created_at timestamp with time zone default now();

-- i. Bảng Comments (Bình luận Bài viết / Sản phẩm)
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  target_id uuid not null, -- Tham chiếu tới products.id hoặc news.id
  target_type text not null check (target_type in ('news', 'product')),
  user_id uuid references public.profiles(id) on delete cascade,
  nickname text not null,
  content text not null,
  created_at timestamp with time zone default now()
);
alter table public.comments add column if not exists target_id uuid;
alter table public.comments add column if not exists target_type text;
alter table public.comments add column if not exists user_id uuid;
alter table public.comments add column if not exists nickname text;
alter table public.comments add column if not exists content text;
alter table public.comments add column if not exists created_at timestamp with time zone default now();

-- j. Bảng Site Settings (Cấu hình chung website)
create table if not exists public.site_settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);
alter table public.site_settings add column if not exists value jsonb;

-- k. Bảng Bottom Price Reports (Báo cáo giá đáy từ người dùng)
create table if not exists public.bottom_price_reports (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  variant_combination jsonb not null, -- e.g. {"Màu sắc": "Xanh", "Dung lượng": "128GB"}
  reported_price numeric not null,
  screenshot_url text,
  shopping_time timestamp with time zone,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default now()
);



-- --------------------------------------------------------
-- 3. Kích hoạt Row Level Security (RLS)
-- --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.reviewers enable row level security;
alter table public.reviews enable row level security;
alter table public.news enable row level security;
alter table public.sale_posts enable row level security;
alter table public.sale_post_responses enable row level security;
alter table public.reputation_reviews enable row level security;
alter table public.comments enable row level security;
alter table public.site_settings enable row level security;
alter table public.bottom_price_reports enable row level security;


-- --------------------------------------------------------
-- 4. RLS Policies (Phân quyền truy cập)
-- --------------------------------------------------------

-- Tạo hàm kiểm tra user có phải là admin không
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;


-- Policies cho Profiles
drop policy if exists "Allow public read on profiles" on public.profiles;
create policy "Allow public read on profiles" on public.profiles for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Admin can insert profiles" on public.profiles;
create policy "Admin can insert profiles" on public.profiles for insert with check (public.is_admin());
drop policy if exists "Admin can update all profiles" on public.profiles;
create policy "Admin can update all profiles" on public.profiles for update using (public.is_admin());
drop policy if exists "Admin can delete profiles" on public.profiles;
create policy "Admin can delete profiles" on public.profiles for delete using (public.is_admin());

-- Policies cho Products
drop policy if exists "Allow public read on products" on public.products;
create policy "Allow public read on products" on public.products for select using (true);
drop policy if exists "Admin can insert products" on public.products;
create policy "Admin can insert products" on public.products for insert with check (public.is_admin());
drop policy if exists "Admin can update products" on public.products;
create policy "Admin can update products" on public.products for update using (public.is_admin());
drop policy if exists "Admin can delete products" on public.products;
create policy "Admin can delete products" on public.products for delete using (public.is_admin());

-- Policies cho Reviewers
drop policy if exists "Allow public read on reviewers" on public.reviewers;
create policy "Allow public read on reviewers" on public.reviewers for select using (true);
drop policy if exists "Admin can insert reviewers" on public.reviewers;
create policy "Admin can insert reviewers" on public.reviewers for insert with check (public.is_admin());
drop policy if exists "Admin can update reviewers" on public.reviewers;
create policy "Admin can update reviewers" on public.reviewers for update using (public.is_admin());
drop policy if exists "Admin can delete reviewers" on public.reviewers;
create policy "Admin can delete reviewers" on public.reviewers for delete using (public.is_admin());

-- Policies cho Reviews
drop policy if exists "Allow public read on reviews" on public.reviews;
create policy "Allow public read on reviews" on public.reviews for select using (true);
drop policy if exists "Authenticated users can write reviews" on public.reviews;
create policy "Authenticated users can write reviews" on public.reviews for insert with check (auth.uid() is not null);
drop policy if exists "Admin can update reviews" on public.reviews;
create policy "Admin can update reviews" on public.reviews for update using (public.is_admin());
drop policy if exists "Admin can delete reviews" on public.reviews;
create policy "Admin can delete reviews" on public.reviews for delete using (public.is_admin());

-- Policies cho News
drop policy if exists "Allow public read on news" on public.news;
create policy "Allow public read on news" on public.news for select using (true);
drop policy if exists "Admin can insert news" on public.news;
create policy "Admin can insert news" on public.news for insert with check (public.is_admin());
drop policy if exists "Admin can update news" on public.news;
create policy "Admin can update news" on public.news for update using (public.is_admin());
drop policy if exists "Admin can delete news" on public.news;
create policy "Admin can delete news" on public.news for delete using (public.is_admin());

-- Policies cho Sale Posts
drop policy if exists "Allow public read on sale posts" on public.sale_posts;
create policy "Allow public read on sale posts" on public.sale_posts for select using (true);
drop policy if exists "Authenticated users can create sale posts" on public.sale_posts;
create policy "Authenticated users can create sale posts" on public.sale_posts for insert with check (auth.uid() = user_id);
drop policy if exists "Owners can update their sale posts" on public.sale_posts;
create policy "Owners can update their sale posts" on public.sale_posts for update using (auth.uid() = user_id);
drop policy if exists "Owners can delete their sale posts" on public.sale_posts;
create policy "Owners can delete their sale posts" on public.sale_posts for delete using (auth.uid() = user_id);
drop policy if exists "Admin can bypass RLS for sale posts" on public.sale_posts;
create policy "Admin can bypass RLS for sale posts" on public.sale_posts for all using (public.is_admin());

-- Policies cho Sale Post Responses
drop policy if exists "Allow public read on sale post responses" on public.sale_post_responses;
create policy "Allow public read on sale post responses" on public.sale_post_responses for select using (true);
drop policy if exists "Authenticated users can respond to posts" on public.sale_post_responses;
create policy "Authenticated users can respond to posts" on public.sale_post_responses for insert with check (auth.uid() = user_id);
drop policy if exists "Owners can update responses" on public.sale_post_responses;
create policy "Owners can update responses" on public.sale_post_responses for update using (auth.uid() = user_id);
drop policy if exists "Admin can bypass RLS for responses" on public.sale_post_responses;
create policy "Admin can bypass RLS for responses" on public.sale_post_responses for all using (public.is_admin());

-- Policies cho Reputation Reviews
drop policy if exists "Allow public read on reputation reviews" on public.reputation_reviews;
create policy "Allow public read on reputation reviews" on public.reputation_reviews for select using (true);
drop policy if exists "Authenticated users can submit reputation reviews" on public.reputation_reviews;
create policy "Authenticated users can submit reputation reviews" on public.reputation_reviews for insert with check (auth.uid() = reviewer_id);
drop policy if exists "Admin can bypass RLS for repo reviews" on public.reputation_reviews;
create policy "Admin can bypass RLS for repo reviews" on public.reputation_reviews for all using (public.is_admin());

-- Policies cho Comments
drop policy if exists "Allow public read on comments" on public.comments;
create policy "Allow public read on comments" on public.comments for select using (true);
drop policy if exists "Authenticated users can insert comments" on public.comments;
create policy "Authenticated users can insert comments" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "Owners can update their comments" on public.comments;
create policy "Owners can update their comments" on public.comments for update using (auth.uid() = user_id);
drop policy if exists "Owners can delete their comments" on public.comments;
create policy "Owners can delete their comments" on public.comments for delete using (auth.uid() = user_id);
drop policy if exists "Admin can bypass RLS for comments" on public.comments;
create policy "Admin can bypass RLS for comments" on public.comments for all using (public.is_admin());

-- Policies cho Site Settings
drop policy if exists "Allow public read on site settings" on public.site_settings;
create policy "Allow public read on site settings" on public.site_settings for select using (true);
drop policy if exists "Admin can manage site settings" on public.site_settings;
create policy "Admin can manage site settings" on public.site_settings for all using (public.is_admin());

-- Policies cho Bottom Price Reports
drop policy if exists "Allow public read on reports" on public.bottom_price_reports;
create policy "Allow public read on reports" on public.bottom_price_reports for select using (true);

drop policy if exists "Authenticated users can submit reports" on public.bottom_price_reports;
create policy "Authenticated users can submit reports" on public.bottom_price_reports for insert with check (auth.uid() is not null);

drop policy if exists "Admin can manage all reports" on public.bottom_price_reports;
create policy "Admin can manage all reports" on public.bottom_price_reports for all using (public.is_admin());


-- (Replaced by the chunk above)
-- --------------------------------------------------------
-- 5. Trigger Tự động Thêm User vào Profiles
-- --------------------------------------------------------
-- Trigger này đảm bảo khi người dùng đăng ký vào auth.users, một record tự động tạo ở public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Thành viên TechHub'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Xóa trigger nếu tồn tại để tránh lỗi
drop trigger if exists on_auth_user_created on auth.users;

-- Tạo trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- --------------------------------------------------------
-- 6. Default Data Seeding
-- --------------------------------------------------------

-- Giá trị mặc định cho global_banner
insert into public.site_settings (id, value)
values (
  'global_banner',
  '{"isActive": true, "text": "🎉 Kèo thơm: Nhập mã TECHHUB giảm 50% tất cả Tivi màn hình phẳng!", "link": "/sale-hunting"}'
) on conflict (id) do nothing;

-- --------------------------------------------------------
-- 7. CẤP QUYỀN TRUY CẬP CƠ BẢN (TABLE GRANTS) - Sửa lỗi "Permission Denied" 403
-- Trong Supabase, các bảng tạo mới cần cấp quyền cho role anon và authenticated
-- để API có thể gọi truy vấn. Nếu không có quyền này, DÙ BẬT RLS CŨNG BỊ 403.
-- --------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all routines in schema public to anon, authenticated, service_role;
