-- Storage Policies for 'avatars' and 'chat-images' buckets
-- Run this in Supabase SQL Editor
-- UPDATED: Idempotent (Drops existing policies first)

-- =======================================================
-- 1. Policies for 'avatars' bucket
-- =======================================================

-- Allow public read access to avatars
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
drop policy if exists "Anyone can upload an avatar" on storage.objects;
create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow users to update/delete their own avatars
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );


-- =======================================================
-- 2. Policies for 'chat-images' bucket
-- =======================================================

-- Allow public read access to chat images
drop policy if exists "Chat images are publicly accessible" on storage.objects;
create policy "Chat images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'chat-images' );

-- Allow authenticated users to upload chat images
drop policy if exists "Authenticated users can upload chat images" on storage.objects;
create policy "Authenticated users can upload chat images"
  on storage.objects for insert
  with check ( bucket_id = 'chat-images' AND auth.role() = 'authenticated' );
