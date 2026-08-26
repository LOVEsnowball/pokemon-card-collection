-- =============================================================
-- Supabase Storage: user-assets bucket 配置脚本
-- 用途：存放用户头像 (avatars/) 与自定义背景 (backgrounds/)
-- 路径约定：<folder>/<user_id>.<ext>，folder ∈ {avatars, backgrounds}
-- 使用方式：Supabase Dashboard → SQL Editor → 新建查询 → 粘贴执行
-- 可重复执行（幂等）
-- =============================================================

-- 1) 创建 bucket：public = true（允许无需登录通过 getPublicUrl 访问）
--    file_size_limit = 5MB（前端头像 256px / 背景 1280px 均远小于此）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-assets',
  'user-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) 公开读取：任何人都可查看桶内对象
drop policy if exists "user-assets: public read" on storage.objects;
create policy "user-assets: public read"
  on storage.objects
  for select
  using (bucket_id = 'user-assets');

-- 3) 已登录用户可上传自己目录下的文件
--    第一段必须是 avatars 或 backgrounds，第二段文件名去掉扩展名后 = 当前用户 uid
drop policy if exists "user-assets: auth insert own" on storage.objects;
create policy "user-assets: auth insert own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'user-assets'
    and (regexp_split_to_array(name, '/'))[1] in ('avatars', 'backgrounds')
    and auth.uid()::text = split_part((regexp_split_to_array(name, '/'))[2], '.', 1)
  );

-- 4) 已登录用户可覆盖（upsert）自己的文件
drop policy if exists "user-assets: auth update own" on storage.objects;
create policy "user-assets: auth update own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'user-assets'
    and auth.uid()::text = split_part((regexp_split_to_array(name, '/'))[2], '.', 1)
  )
  with check (
    bucket_id = 'user-assets'
    and auth.uid()::text = split_part((regexp_split_to_array(name, '/'))[2], '.', 1)
  );

-- 5) 已登录用户可删除自己的文件
drop policy if exists "user-assets: auth delete own" on storage.objects;
create policy "user-assets: auth delete own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'user-assets'
    and auth.uid()::text = split_part((regexp_split_to_array(name, '/'))[2], '.', 1)
  );