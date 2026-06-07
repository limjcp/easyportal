-- Migration 023: news item image and attachment columns

ALTER TABLE public.news_items
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_url text;
