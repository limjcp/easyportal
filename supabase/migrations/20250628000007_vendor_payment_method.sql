-- Preferred payment method and invoice payment snapshots

CREATE TYPE public.vendor_preferred_payment_method AS ENUM (
  'bank_transfer',
  'interac_etransfer',
  'sparcpay'
);

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS invoice_preferred_payment_method public.vendor_preferred_payment_method NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS invoice_bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_bank_account_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_bank_account_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_bank_institution_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_bank_transit_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_bank_swift_bic text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_interac_recipient_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_interac_email text NOT NULL DEFAULT '';

ALTER TABLE public.vendor_invoices
  ADD COLUMN IF NOT EXISTS billing_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_postal text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_payment_method public.vendor_preferred_payment_method NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS payment_details jsonb NOT NULL DEFAULT '{}'::jsonb;
