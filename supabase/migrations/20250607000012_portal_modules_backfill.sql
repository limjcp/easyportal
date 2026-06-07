-- Migration 012: backfill default portal modules for buildings with none

INSERT INTO public.portal_modules (
  building_id,
  module_id,
  name,
  tile_label,
  enabled,
  message,
  sort_order,
  layout_zone,
  locked
)
SELECT
  b.id,
  defaults.module_id,
  defaults.name,
  defaults.tile_label,
  defaults.enabled,
  defaults.message,
  defaults.sort_order,
  defaults.layout_zone::portal_tile_layout_zone,
  defaults.locked
FROM public.buildings b
CROSS JOIN (
  VALUES
    ('home', 'Home Page', '', true, '', 1, 'primary', true),
    ('documents', 'Documents', 'Documents', true, '', 2, 'primary', false),
    ('events', 'Events', 'Events', true, '', 3, 'primary', false),
    ('faq', 'FAQ', 'Frequently Asked Questions', true, '', 4, 'primary', false),
    ('galleries', 'Galleries', 'Photo Gallery', true, '', 5, 'primary', false),
    ('incidentReport', 'Incident Reports', 'Incident Reports', true, '', 6, 'primary', false),
    ('news', 'News & Notices', 'News / Notices', true, '', 7, 'primary', false),
    ('newsletters', 'Newsletters', 'Newsletters', false, '', 8, 'primary', false),
    ('serviceRequest', 'Service Requests', 'Service Requests', true, '', 1, 'compact', false),
    ('statusCerts', 'Status Certificates', 'Status Certificates', false, '', 2, 'compact', false),
    ('suggestion', 'Suggestion Box', 'Suggestions', true, '', 3, 'compact', false),
    ('polls', 'Polls', 'Polls', true, '', 4, 'compact', false),
    ('parkingSpots', 'Parking', 'Parking', true, '', 5, 'compact', false),
    ('lockers', 'Lockers', 'Lockers', true, '', 6, 'compact', false),
    ('keyFobs', 'Key Fobs', 'Key Fobs', true, '', 7, 'compact', false),
    ('vehicles', 'Vehicles', 'Vehicles', true, '', 8, 'compact', false),
    ('guestList', 'Guest List', 'Guest List', true, '', 9, 'compact', false),
    ('bikeSpaces', 'Bike Spaces', 'Bike Spaces', true, '', 10, 'compact', false),
    ('pets', 'Pets', 'Pets', true, '', 11, 'compact', false),
    ('purchaseDateMaintFees', 'Condo Fees', 'Condo Fees', true, '', 12, 'compact', false),
    ('boardMember', 'Become a Board Member', 'Become a Board Member', true, '', 13, 'compact', false),
    ('boardElections', 'Board Elections', 'Board Elections', true, '', 14, 'compact', false),
    ('fireSafetyPlan', 'Fire Safety Plan', 'Fire Safety Plan', true, '', 15, 'compact', false),
    ('chat', 'Chat', 'Chat', true, '', 16, 'compact', false)
) AS defaults(module_id, name, tile_label, enabled, message, sort_order, layout_zone, locked)
WHERE NOT EXISTS (
  SELECT 1 FROM public.portal_modules pm WHERE pm.building_id = b.id
);
