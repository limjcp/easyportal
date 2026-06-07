-- Migration 004: portal configuration

CREATE TABLE public.portal_settings (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  enable_documents boolean NOT NULL DEFAULT true,
  enable_events boolean NOT NULL DEFAULT true,
  enable_gallery boolean NOT NULL DEFAULT true,
  enable_faq boolean NOT NULL DEFAULT true,
  enable_service_requests boolean NOT NULL DEFAULT true,
  enable_suggestions boolean NOT NULL DEFAULT true,
  enable_incident_reports boolean NOT NULL DEFAULT true,
  default_language text NOT NULL DEFAULT 'English',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.public_portal_settings (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  portal_theme_color text NOT NULL DEFAULT '#3476ef',
  subdomain text NOT NULL DEFAULT '',
  about_building text NOT NULL DEFAULT '',
  building_logo_url text,
  enable_lobby_display boolean NOT NULL DEFAULT false,
  lobby_display_url text NOT NULL DEFAULT '',
  twitter_url text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  insta_url text NOT NULL DEFAULT '',
  youtube_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.portal_tile_settings (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  portal_tile_opacity numeric(3, 2) NOT NULL DEFAULT 1.0,
  default_language text NOT NULL DEFAULT 'English',
  primary_tile_limit integer NOT NULL DEFAULT 12,
  use_master_layout boolean NOT NULL DEFAULT false,
  tile_layout_source portal_tile_layout_source NOT NULL DEFAULT 'building'
);

CREATE TABLE public.portal_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  name text NOT NULL,
  tile_label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  message text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  layout_zone portal_tile_layout_zone NOT NULL DEFAULT 'primary',
  locked boolean NOT NULL DEFAULT false,
  UNIQUE (building_id, module_id)
);

CREATE TABLE public.custom_portal_tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  action_type text NOT NULL DEFAULT 'link',
  target text,
  sort_order integer NOT NULL DEFAULT 0,
  layout_zone portal_tile_layout_zone NOT NULL DEFAULT 'primary'
);

CREATE TABLE public.portal_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  kind portal_image_kind NOT NULL,
  url text NOT NULL,
  storage_path text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.public_portal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  filename text NOT NULL,
  storage_path text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.registration_field_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  include_field boolean NOT NULL DEFAULT true,
  required_field boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  note text,
  UNIQUE (building_id, field_key)
);

CREATE TABLE public.profile_field_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  show_field boolean NOT NULL DEFAULT true,
  editable_field boolean NOT NULL DEFAULT true,
  locked boolean NOT NULL DEFAULT false,
  note text,
  UNIQUE (building_id, field_key)
);
