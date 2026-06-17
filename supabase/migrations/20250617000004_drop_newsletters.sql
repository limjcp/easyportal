-- Migration 020: remove newsletters module and table

DELETE FROM public.occupancy_portal_modules WHERE module_id = 'newsletters';
DELETE FROM public.resident_type_portal_modules WHERE module_id = 'newsletters';
DELETE FROM public.occupancy_building_admin_modules WHERE module_key = 'newsletters';
DELETE FROM public.building_role_permission_defaults WHERE module_key = 'newsletters';
DELETE FROM public.role_permission_defaults WHERE module_key = 'newsletters';
DELETE FROM public.company_membership_permissions WHERE module_key = 'newsletters';
DELETE FROM public.portal_modules WHERE module_id = 'newsletters';
DELETE FROM public.permission_modules WHERE module_key = 'newsletters';

DROP TABLE IF EXISTS public.newsletters CASCADE;
