-- Migration 001: extensions, enums, profiles, super admin helpers

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE content_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE company_role AS ENUM (
  'Company Owner',
  'Company Administrator',
  'Company Accountant',
  'Property Manager',
  'Property Administrator',
  'Board Member',
  'Resident (Admin)',
  'Concierge',
  'Gatehouse Keeper',
  'Superintendent',
  'Resident'
);
CREATE TYPE building_membership_status AS ENUM ('active', 'inactive');
CREATE TYPE account_status AS ENUM (
  'Record-Only',
  'Awaiting Activation',
  'Pending Unit Assignment',
  'Activated',
  'Archived',
  'Deleted'
);
CREATE TYPE resident_type AS ENUM (
  'Owner',
  'Tenant',
  'Absentee Owner',
  'Occupant',
  'Unit Manager'
);
CREATE TYPE status_tag AS ENUM ('QB Linked', 'CC Linked');
CREATE TYPE vendor_status AS ENUM ('active', 'pending_invite', 'inactive');
CREATE TYPE purchase_order_status AS ENUM ('draft', 'sent', 'accepted', 'declined');
CREATE TYPE poll_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE election_status AS ENUM ('draft', 'scheduled', 'active', 'closed', 'archived');
CREATE TYPE agm_meeting_status AS ENUM ('draft', 'active', 'ended');
CREATE TYPE building_status AS ENUM ('active', 'inactive');
CREATE TYPE document_folder_section AS ENUM ('resident-portal', 'admin-only');
CREATE TYPE comment_visibility AS ENUM ('admin', 'public');
CREATE TYPE email_status AS ENUM ('delivered', 'bounced', 'pending');
CREATE TYPE portal_image_kind AS ENUM ('public', 'resident');
CREATE TYPE portal_tile_layout_zone AS ENUM ('primary', 'compact');
CREATE TYPE portal_tile_layout_source AS ENUM ('building', 'master');
CREATE TYPE parking_request_type AS ENUM ('parking', 'visitor');
CREATE TYPE parking_request_status AS ENUM (
  'waiting',
  'approvedAwaitingPayment',
  'paidAccepted',
  'declined'
);
CREATE TYPE board_application_status AS ENUM ('Submitted', 'Under Review', 'Approved', 'Declined');
CREATE TYPE board_approval_vote_status AS ENUM (
  'Approved',
  'Disapproved',
  'Tie Vote',
  'Pending',
  'No Votes Required'
);
CREATE TYPE board_approval_vote_kind AS ENUM ('approved', 'disapproved', 'pending');
CREATE TYPE admin_event_type AS ENUM ('once', 'recurring', 'paid');
CREATE TYPE admin_event_status AS ENUM ('Draft', 'Active');
CREATE TYPE consultation_submission_status AS ENUM ('new', 'contacted');
CREATE TYPE permission_action AS ENUM ('create', 'view', 'edit', 'delete', 'archive');
CREATE TYPE chat_contact_kind AS ENUM ('resident', 'building_admin', 'company');
CREATE TYPE company_notification_type AS ENUM ('po_accepted', 'po_declined');
CREATE TYPE vendor_notification_type AS ENUM ('po_received', 'po_reminder');
CREATE TYPE purchase_order_source_kind AS ENUM ('company-service-request', 'admin-service-request');
CREATE TYPE certificate_file_kind AS ENUM ('pdf', 'zip', 'image');
CREATE TYPE poll_attachment_kind AS ENUM ('pdf', 'image');
CREATE TYPE attachment_kind AS ENUM ('image', 'pdf', 'file');
CREATE TYPE entity_type AS ENUM (
  'service_request',
  'incident_report',
  'board_approval',
  'suggestion',
  'status_certificate'
);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'America/Toronto',
  avatar_url text,
  tel_home text,
  tel_mobile text,
  tel_business text,
  birth_month smallint,
  birth_day smallint,
  is_super_admin boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_super_admin_idx ON public.profiles(is_super_admin) WHERE is_super_admin = true;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Super admin helper (used by all RLS policies)
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = p_user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Marketing consultation leads
CREATE TABLE public.consultation_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  corporation_number text NOT NULL DEFAULT '',
  municipal_address text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  survey jsonb NOT NULL DEFAULT '{}'::jsonb,
  status consultation_submission_status NOT NULL DEFAULT 'new',
  unread boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER consultation_submissions_updated_at
  BEFORE UPDATE ON public.consultation_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
