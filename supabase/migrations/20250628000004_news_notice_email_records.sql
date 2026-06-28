-- Link email_records to news/notice blast sends and store recipient email for reporting

ALTER TABLE public.email_records
  ADD COLUMN IF NOT EXISTS news_item_id uuid REFERENCES public.news_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_email text;

CREATE INDEX IF NOT EXISTS email_records_news_item_idx
  ON public.email_records(news_item_id)
  WHERE news_item_id IS NOT NULL;
