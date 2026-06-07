-- Migration 008: resident profile, company ops, chat, master report views

CREATE TABLE public.resident_key_fobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupancy_id uuid NOT NULL REFERENCES public.unit_occupancies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  fob_number text NOT NULL,
  description text
);

CREATE TABLE public.resident_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupancy_id uuid NOT NULL REFERENCES public.unit_occupancies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  make text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  plate text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT ''
);

CREATE TABLE public.resident_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupancy_id uuid NOT NULL REFERENCES public.unit_occupancies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text,
  notes text
);

CREATE TABLE public.resident_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupancy_id uuid NOT NULL REFERENCES public.unit_occupancies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  pet_type text NOT NULL DEFAULT '',
  breed text,
  weight text
);

CREATE TABLE public.resident_maint_fees (
  occupancy_id uuid PRIMARY KEY REFERENCES public.unit_occupancies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  purchase_date date,
  monthly_fee text,
  notes text,
  quickbooks_balance text,
  next_payment_amount text,
  next_payment_date date,
  minimum_one_time_payment text,
  last_payment_amount text,
  last_payment_date date,
  paid_months text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  po_number text NOT NULL,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  source_kind purchase_order_source_kind,
  source_request_id uuid,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  created_by_name text NOT NULL DEFAULT '',
  created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_at timestamptz,
  responded_at timestamptz,
  decline_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_order_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE public.company_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  notification_type company_notification_type NOT NULL,
  message text NOT NULL,
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  notification_type vendor_notification_type NOT NULL,
  message text NOT NULL,
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.building_external_integrations (
  building_id uuid PRIMARY KEY REFERENCES public.buildings(id) ON DELETE CASCADE,
  stripe_connected boolean NOT NULL DEFAULT false,
  stripe_country text,
  stripe_currency text,
  stripe_account_ref text,
  stripe_secret_ref text,
  qbo_connected boolean NOT NULL DEFAULT false,
  qbo_company_id text,
  qbo_secret_ref text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  sender_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_conversation_idx ON public.chat_messages(conversation_id, created_at);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Master report views
CREATE OR REPLACE VIEW public.v_master_report_service_requests AS
SELECT
  sr.id,
  'service-requests'::text AS report_type,
  sr.building_id,
  b.name AS building_label,
  sr.created_at::date AS report_date,
  sr.description AS title,
  sr.status,
  sr.admin_severity AS severity,
  sr.unit,
  sr.resident AS owner,
  sr.pending_reply AS pending_reply,
  sr.archived,
  sr.unread
FROM public.service_requests sr
JOIN public.buildings b ON b.id = sr.building_id;

CREATE OR REPLACE VIEW public.v_master_report_incidents AS
SELECT
  ir.id,
  'incident-reports'::text AS report_type,
  ir.building_id,
  b.name AS building_label,
  ir.incident_date AS report_date,
  ir.description AS title,
  ir.status,
  ir.severity,
  ir.unit,
  ir.resident AS owner,
  (ir.pending_reply_label = 'Yes') AS pending_reply,
  ir.archived,
  ir.unread,
  ir.incident_number,
  ir.location,
  ir.resolution_time
FROM public.incident_reports ir
JOIN public.buildings b ON b.id = ir.building_id;

CREATE OR REPLACE VIEW public.v_master_report_certificates AS
SELECT
  sc.id,
  'certificates'::text AS report_type,
  sc.building_id,
  b.name AS building_label,
  sc.created_at::date AS report_date,
  sc.certificate_type AS title,
  sc.status,
  sc.unit,
  sc.requested_by_name AS owner,
  sc.archived,
  sc.unread,
  sc.request_number,
  sc.delivery_type AS processing,
  sc.date_due AS due_date,
  sc.closing_date
FROM public.status_certificates sc
JOIN public.buildings b ON b.id = sc.building_id;

CREATE OR REPLACE VIEW public.v_master_report_board_approvals AS
SELECT
  ba.id,
  'board-approvals'::text AS report_type,
  ba.building_id,
  b.name AS building_label,
  ba.created_at::date AS report_date,
  ba.title,
  ba.status::text AS status,
  ba.archived,
  ba.unread,
  ba.approved_votes AS approved_count,
  ba.disapproved_votes AS disapproved_count,
  ba.votes_collected,
  ba.votes_required
FROM public.board_approvals ba
JOIN public.buildings b ON b.id = ba.building_id;

CREATE OR REPLACE VIEW public.v_master_report_users_pending AS
SELECT
  uo.id,
  'users-pending'::text AS report_type,
  uo.building_id,
  b.name AS building_label,
  uo.date_created AS report_date,
  uo.resident_name AS title,
  uo.account_status::text AS status,
  u.label AS unit,
  uo.email AS owner,
  false AS archived,
  false AS unread
FROM public.unit_occupancies uo
JOIN public.buildings b ON b.id = uo.building_id
JOIN public.units u ON u.id = uo.unit_id
WHERE uo.account_status IN ('Awaiting Activation', 'Pending Unit Assignment');
