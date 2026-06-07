-- Migration 007: governance

CREATE TABLE public.board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  term_end_date date,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.board_member_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resident_name text NOT NULL,
  unit text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  statement text NOT NULL DEFAULT '',
  status board_application_status NOT NULL DEFAULT 'Submitted',
  unread boolean NOT NULL DEFAULT true,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.board_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  vendor text NOT NULL DEFAULT '',
  approval_type text NOT NULL DEFAULT '',
  amount text NOT NULL DEFAULT '',
  items text NOT NULL DEFAULT '',
  status board_approval_vote_status NOT NULL DEFAULT 'Pending',
  approved_votes integer NOT NULL DEFAULT 0,
  disapproved_votes integer NOT NULL DEFAULT 0,
  votes_required integer NOT NULL DEFAULT 0,
  votes_collected integer NOT NULL DEFAULT 0,
  created_by text NOT NULL DEFAULT '',
  closed_by text,
  closed_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  unread boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.board_approval_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL REFERENCES public.board_approvals(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  board_member text NOT NULL,
  vote_kind board_approval_vote_kind NOT NULL DEFAULT 'pending',
  vote_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.board_approval_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL REFERENCES public.board_approvals(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  label text NOT NULL,
  file_name text NOT NULL,
  storage_path text
);

CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  status poll_status NOT NULL DEFAULT 'draft',
  response_count integer NOT NULL DEFAULT 0,
  no_notifications boolean NOT NULL DEFAULT true,
  privacy text NOT NULL DEFAULT 'not-anonymous',
  resident_types text[] NOT NULL DEFAULT '{}',
  show_to_filter text NOT NULL DEFAULT 'No filter',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'single',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.poll_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  label text NOT NULL,
  file_name text NOT NULL,
  storage_path text,
  kind poll_attachment_kind NOT NULL DEFAULT 'pdf',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  answer jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.board_elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status election_status NOT NULL DEFAULT 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  resident_types text[] NOT NULL DEFAULT '{}',
  anonymous boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.election_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid NOT NULL REFERENCES public.board_elections(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  seats_available integer NOT NULL DEFAULT 1
);

CREATE TABLE public.election_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.election_positions(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT ''
);

CREATE TABLE public.election_ballots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid NOT NULL REFERENCES public.board_elections(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES public.election_positions(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.election_candidates(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cast_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (election_id, position_id, unit_id)
);
