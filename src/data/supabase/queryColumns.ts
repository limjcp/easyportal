/** Shared PostgREST column lists — list views and read paths; mutations may still return `*`. */

export const BUILDING_LIST_COLUMNS =
  "id, code, name, address, condo_line, city_province_postal, subscription_package, status, units_count, admins_count, users_count, image_url, last_activity";

export const SERVICE_REQUEST_LIST_COLUMNS =
  "id, created_by_name, created_at, contact, location, severity, category, description, status, assigned_to, resident, unit, visibility, permission_to_enter, permission_notes, admin_severity, admin_category, action_required, archived, pending_reply, unread";

export const INCIDENT_REPORT_LIST_COLUMNS =
  "id, incident_date, incident_time, severity, report_type, location, description, status, archived, created_by_name, submitted_at, created_at, unit, resident, view_permission, assigned_to, pending_reply_label, resolution_time, unread";

export const RESIDENT_INCIDENT_LIST_COLUMNS =
  "id, incident_date, incident_time, severity, report_type, location, description, status, archived, submitted_at, created_by_profile_id";

export const CHAT_MESSAGE_COLUMNS =
  "id, conversation_id, sender_profile_id, body, created_at";

export const PROFILE_CONTACT_COLUMNS = "id, display_name, email";

export const AUTH_PROFILE_COLUMNS =
  "id, first_name, last_name, display_name, email, must_change_password, is_super_admin, last_login_at";

export const ADMIN_USER_PROFILE_COLUMNS =
  "id, first_name, last_name, display_name, email, phone, timezone, tel_home, tel_mobile, tel_business, avatar_url";

export const RESIDENT_SERVICE_REQUEST_LIST_COLUMNS =
  "id, created_by_name, created_at, contact, location, severity, category, description, status, unread, pending_reply";

export const SUGGESTION_LIST_COLUMNS = "id, text, created_at, status, unread";

export const NEWS_LIST_COLUMNS =
  "id, title, news_date, body, image_url, attachment_name, attachment_url, status, archived";

export const OCCUPANCY_LIST_COLUMNS =
  "id, unit_id, account_status, status_tags, resident_name, resident_type, email, phone, date_created, last_login_at, parking, lockers, fobs, vehicles, pets, buzzer_code, archived_at, updated_at";

export const OCCUPANCY_LIST_WITH_UNIT = `${OCCUPANCY_LIST_COLUMNS}, units(label)`;

export const PORTAL_MODULE_COLUMNS =
  "module_id, name, tile_label, enabled, message, sort_order, layout_zone, locked";

export const CUSTOM_PORTAL_TILE_COLUMNS =
  "id, title, enabled, action_type, target, sort_order, layout_zone";

export const PORTAL_TILE_SETTINGS_COLUMNS =
  "portal_tile_opacity, default_language, primary_tile_limit, use_master_layout";

export const PUBLIC_PORTAL_SETTINGS_COLUMNS =
  "portal_theme_color, subdomain, about_building, building_logo_url, enable_lobby_display, lobby_display_url, twitter_url, facebook_url, insta_url, youtube_url";

export const PORTAL_IMAGE_COLUMNS = "id, kind, url, sort_order";

export const PUBLIC_PORTAL_DOCUMENT_COLUMNS = "id, title, filename, uploaded_at";

export const COMMENT_COLUMNS = "id, author_name, body, created_at, visibility";

export const INCIDENT_ATTACHMENT_COLUMNS =
  "id, file_name, storage_path, preview_url, kind, uploaded_by, uploaded_at";

export const SERVICE_ATTACHMENT_COLUMNS = "id, filename, storage_path, kind, uploaded_at";

export const DOCUMENT_FOLDER_LIST_COLUMNS = "id, name, section, sort_order";

export const DOCUMENT_FILE_LIST_COLUMNS =
  "id, folder_id, file_type, title, filename, file_size, shown_to, uploaded_at";

export const INCIDENT_CATEGORY_COLUMNS = "id, name, sort_order";
