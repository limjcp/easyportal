-- Vendor insurance & WSIB compliance documents, reminders, storage, RLS

CREATE TYPE public.vendor_compliance_document_type AS ENUM ('insurance', 'wsib');
CREATE TYPE public.vendor_compliance_reminder_type AS ENUM ('expiring_soon', 'expired');

ALTER TYPE public.vendor_notification_type ADD VALUE IF NOT EXISTS 'compliance_expiring';
ALTER TYPE public.vendor_notification_type ADD VALUE IF NOT EXISTS 'compliance_expired';

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS wsib_required boolean NOT NULL DEFAULT true;

CREATE TABLE public.vendor_compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  document_type public.vendor_compliance_document_type NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  expiry_date date NOT NULL,
  carrier text,
  policy_number text,
  coverage_amount text,
  ai_suggestions jsonb,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  superseded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vendor_compliance_documents_vendor_type_idx
  ON public.vendor_compliance_documents (vendor_id, document_type)
  WHERE superseded_at IS NULL;

CREATE INDEX vendor_compliance_documents_expiry_idx
  ON public.vendor_compliance_documents (expiry_date)
  WHERE superseded_at IS NULL;

CREATE TRIGGER vendor_compliance_documents_updated_at
  BEFORE UPDATE ON public.vendor_compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.vendor_compliance_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.vendor_compliance_documents(id) ON DELETE CASCADE,
  reminder_type public.vendor_compliance_reminder_type NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipient_emails text[] NOT NULL DEFAULT '{}',
  UNIQUE (document_id, reminder_type)
);

-- Helper: vendor IDs linked to current user
CREATE OR REPLACE FUNCTION public.get_user_vendor_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_id FROM public.vendor_users WHERE profile_id = p_user_id;
$$;

-- Vendors: company admins can manage vendors in their company
CREATE POLICY vendors_company_manage ON public.vendors
  FOR ALL TO authenticated
  USING (
    public.has_company_permission(
      (SELECT auth.uid()),
      company_id,
      'company-vendors',
      'view'
    )
  )
  WITH CHECK (
    public.has_company_permission(
      (SELECT auth.uid()),
      company_id,
      'company-vendors',
      'edit'
    )
  );

-- Vendors: linked vendor users can update contact fields on their own record
CREATE POLICY vendors_self_update ON public.vendors
  FOR UPDATE TO authenticated
  USING (id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid()))))
  WITH CHECK (id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid()))));

-- Vendor compliance documents RLS
ALTER TABLE public.vendor_compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_compliance_super ON public.vendor_compliance_documents
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY vendor_compliance_vendor ON public.vendor_compliance_documents
  FOR ALL TO authenticated
  USING (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  )
  WITH CHECK (
    vendor_id IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
  );

CREATE POLICY vendor_compliance_company ON public.vendor_compliance_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'view'
        )
    )
  );

CREATE POLICY vendor_compliance_company_insert ON public.vendor_compliance_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'edit'
        )
    )
  );

CREATE POLICY vendor_compliance_company_update ON public.vendor_compliance_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'edit'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id
        AND public.has_company_permission(
          (SELECT auth.uid()),
          v.company_id,
          'company-vendors',
          'edit'
        )
    )
  );

-- Reminder log: service role / super admin only (written by edge function)
ALTER TABLE public.vendor_compliance_reminder_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_compliance_reminder_super ON public.vendor_compliance_reminder_log
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

-- Storage bucket for vendor documents (path: {vendor_id}/{uuid}/{filename})
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('vendor-documents', 'vendor-documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_vendor_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = (storage.foldername(name))[1]::uuid
          AND public.has_company_permission(
            (SELECT auth.uid()),
            v.company_id,
            'company-vendors',
            'view'
          )
      )
    )
  );

CREATE POLICY storage_vendor_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = (storage.foldername(name))[1]::uuid
          AND public.has_company_permission(
            (SELECT auth.uid()),
            v.company_id,
            'company-vendors',
            'edit'
          )
      )
    )
  );

CREATE POLICY storage_vendor_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = (storage.foldername(name))[1]::uuid
          AND public.has_company_permission(
            (SELECT auth.uid()),
            v.company_id,
            'company-vendors',
            'edit'
          )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = (storage.foldername(name))[1]::uuid
          AND public.has_company_permission(
            (SELECT auth.uid()),
            v.company_id,
            'company-vendors',
            'edit'
          )
      )
    )
  );

CREATE POLICY storage_vendor_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vendor-documents'
    AND (
      (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_vendor_ids((SELECT auth.uid())))
      OR public.is_super_admin((SELECT auth.uid()))
    )
  );
