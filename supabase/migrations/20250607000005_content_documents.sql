-- Migration 005: content and documents

CREATE TABLE public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  news_date date NOT NULL DEFAULT CURRENT_DATE,
  status content_status NOT NULL DEFAULT 'draft',
  expires date,
  email_delivered integer NOT NULL DEFAULT 0,
  email_total integer NOT NULL DEFAULT 0,
  email_stats jsonb,
  notice_history_id text,
  post_time text,
  no_notifications boolean NOT NULL DEFAULT false,
  resident_types text[] NOT NULL DEFAULT '{}',
  admin_cc_types text[] NOT NULL DEFAULT '{}',
  show_to_filter text NOT NULL DEFAULT '',
  edit_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_updated_by text,
  last_updated_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  unread boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  newsletter_date date NOT NULL DEFAULT CURRENT_DATE,
  attachment_name text,
  status content_status NOT NULL DEFAULT 'draft',
  email_delivered integer NOT NULL DEFAULT 0,
  email_total integer NOT NULL DEFAULT 0,
  email_stats jsonb,
  notice_history_id text,
  post_time text,
  no_notifications boolean NOT NULL DEFAULT true,
  edit_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_updated_by text,
  last_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  section document_folder_section NOT NULL DEFAULT 'resident-portal'
);

CREATE TABLE public.document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.document_folders(id) ON DELETE CASCADE,
  file_type text NOT NULL DEFAULT '',
  title text NOT NULL,
  file_date date NOT NULL DEFAULT CURRENT_DATE,
  filename text NOT NULL,
  storage_path text,
  size_label text NOT NULL DEFAULT '',
  shown_to text NOT NULL DEFAULT 'All',
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.board_faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.gallery_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  cover_url text,
  cover_storage_path text,
  photo_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  description text,
  event_type admin_event_type,
  status admin_event_status,
  location text,
  show_to text,
  admin_only boolean NOT NULL DEFAULT false,
  occurrence text,
  day_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_title text NOT NULL,
  rsvp_date date NOT NULL,
  status text NOT NULL DEFAULT 'Attending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agm_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status agm_meeting_status NOT NULL DEFAULT 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id uuid NOT NULL,
  author_name text NOT NULL,
  author_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  visibility comment_visibility NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_entity_idx ON public.comments(entity_type, entity_id);

CREATE TABLE public.email_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_date timestamptz NOT NULL DEFAULT now(),
  subject text NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  body text NOT NULL DEFAULT ''
);
