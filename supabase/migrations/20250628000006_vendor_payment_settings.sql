-- Vendor payment / invoicing defaults (HST, billing address, logo)

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS invoice_hst_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_billing_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_billing_city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_billing_province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_billing_postal text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_logo_storage_path text;
