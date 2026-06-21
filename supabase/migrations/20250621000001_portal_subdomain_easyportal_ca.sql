-- Backfill lobby display URLs from mvpcondos.com to easyportal.ca

UPDATE public.public_portal_settings
SET lobby_display_url = regexp_replace(
  lobby_display_url,
  '\.mvpcondos\.com',
  '.easyportal.ca',
  'g'
)
WHERE lobby_display_url LIKE '%.mvpcondos.com%';
