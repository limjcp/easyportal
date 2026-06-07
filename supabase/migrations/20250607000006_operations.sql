-- Migration 006: operations

CREATE TABLE public.service_request_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (building_id, name)
);

CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Open',
  resident text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT '',
  permission_to_enter text NOT NULL DEFAULT '',
  permission_notes text NOT NULL DEFAULT '',
  admin_severity text,
  admin_category text,
  assigned_to text NOT NULL DEFAULT '',
  action_required boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  pending_reply boolean NOT NULL DEFAULT false,
  resolved_by text,
  resolved_at timestamptz,
  unread boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.service_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text,
  kind attachment_kind NOT NULL DEFAULT 'file',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.incident_report_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (building_id, name)
);

CREATE TABLE public.incident_contact_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  email text NOT NULL,
  label text NOT NULL DEFAULT ''
);

CREATE TABLE public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  incident_number text NOT NULL DEFAULT '',
  incident_date date NOT NULL,
  incident_time text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT '',
  report_type text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Open',
  unit text NOT NULL DEFAULT '',
  resident text,
  assigned_to text,
  view_permission text,
  submitted_at timestamptz,
  pending_reply_label text NOT NULL DEFAULT 'N/A',
  resolution_time text,
  resolved_by text,
  resolved_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  unread boolean NOT NULL DEFAULT false,
  created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.incident_report_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text,
  preview_url text,
  kind attachment_kind NOT NULL DEFAULT 'file',
  uploaded_by text NOT NULL DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  text text NOT NULL,
  status text NOT NULL DEFAULT 'Submitted',
  admin_notes text NOT NULL DEFAULT '',
  unread boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.certificate_settings (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.status_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  request_number text NOT NULL DEFAULT '',
  certificate_type text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  requested_by_name text NOT NULL DEFAULT '',
  requested_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text NOT NULL DEFAULT '',
  rush_processing boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Submitted',
  delivery_type text NOT NULL DEFAULT '',
  date_due date,
  closing_date date,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived boolean NOT NULL DEFAULT false,
  unread boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.certificate_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES public.status_certificates(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  label text NOT NULL,
  file_name text NOT NULL,
  storage_path text,
  size_label text NOT NULL DEFAULT '',
  kind certificate_file_kind NOT NULL DEFAULT 'pdf',
  excluded boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.certificate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES public.status_certificates(id) ON DELETE CASCADE,
  event_date timestamptz NOT NULL DEFAULT now(),
  actor_name text NOT NULL,
  action text NOT NULL
);

CREATE TABLE public.parking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resident_name text NOT NULL,
  unit text NOT NULL,
  request_type parking_request_type NOT NULL,
  status parking_request_status NOT NULL DEFAULT 'waiting',
  assigned_spot text,
  approved_at timestamptz,
  payment_amount text,
  monthly_cost text,
  payment_type_label text,
  payment_at timestamptz,
  resident_decision_at timestamptz,
  requested_for_nights text,
  waitlist_position integer,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fire_safety_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  unit text NOT NULL,
  photo_url text,
  storage_path text,
  notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (profile_id, building_id, label)
);
