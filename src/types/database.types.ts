export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          display_name: string;
          phone: string;
          timezone: string;
          avatar_url: string | null;
          tel_home: string | null;
          tel_mobile: string | null;
          tel_business: string | null;
          birth_month: number | null;
          birth_day: number | null;
          is_super_admin: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      management_companies: {
        Row: {
          id: string;
          company_name: string;
          address: string;
          city: string;
          postal_zip: string;
          country: string;
          province_state: string;
          timezone: string;
          company_email: string;
          tel1: string;
          tel2: string;
          fax: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["management_companies"]["Row"]> & {
          company_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["management_companies"]["Row"]>;
      };
      buildings: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name: string;
          condo_name: string;
          corporation: string;
          corp_number: string;
          address: string;
          condo_line: string | null;
          city_province_postal: string | null;
          city: string;
          postal_zip: string;
          country: string;
          province: string;
          multi_address_property: boolean;
          property_phone: string;
          property_email: string;
          accounting_email: string;
          billing_email: string;
          visitor_parking_overnight_email: string | null;
          building_types: string[];
          building_features: string[];
          amenities: string[];
          common_areas: string[];
          subscription_package: string;
          status: "active" | "inactive";
          subdomain: string;
          image_url: string | null;
          units_count: number;
          admins_count: number;
          users_count: number;
          last_activity: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["buildings"]["Row"]> & {
          company_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["buildings"]["Row"]>;
      };
      company_memberships: {
        Row: {
          id: string;
          profile_id: string;
          company_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_memberships"]["Row"]> & {
          profile_id: string;
          company_id: string;
          role: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_memberships"]["Row"]>;
      };
      building_memberships: {
        Row: {
          id: string;
          profile_id: string;
          building_id: string;
          role_code: string;
          role_label: string;
          status: "active" | "inactive";
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["building_memberships"]["Row"]> & {
          profile_id: string;
          building_id: string;
          role_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["building_memberships"]["Row"]>;
      };
      unit_occupancies: {
        Row: {
          id: string;
          profile_id: string | null;
          unit_id: string;
          building_id: string;
          resident_name: string;
          resident_type: string;
          account_status: string;
          status_tags: string[];
          email: string;
          phone: string | null;
          parking: string | null;
          lockers: string | null;
          fobs: string | null;
          vehicles: string | null;
          pets: string | null;
          buzzer_code: string | null;
          date_created: string;
          last_login_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["unit_occupancies"]["Row"]> & {
          unit_id: string;
          building_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["unit_occupancies"]["Row"]>;
      };
      units: {
        Row: {
          id: string;
          building_id: string;
          label: string;
          floor: string;
          buzzer_code: string | null;
          parking_spots: string[];
          lockers: string[];
          bike_spaces: string[];
          is_occupied: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["units"]["Row"]> & {
          building_id: string;
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Row"]>;
      };
      vendors: {
        Row: {
          id: string;
          company_id: string;
          company_name: string;
          trade_category: string;
          contact_name: string;
          phone: string;
          email: string;
          notes: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendors"]["Row"]> & {
          company_id: string;
          company_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Row"]>;
      };
      vendor_users: {
        Row: { profile_id: string; vendor_id: string };
        Insert: { profile_id: string; vendor_id: string };
        Update: Partial<Database["public"]["Tables"]["vendor_users"]["Row"]>;
      };
      news_items: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      polls: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      poll_questions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      poll_attachments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      poll_responses: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      agm_meetings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      document_folders: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      document_files: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      calendar_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      faq_items: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      gallery_albums: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      gallery_photos: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      comments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      service_requests: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      service_request_categories: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      service_request_attachments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      suggestions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      certificate_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      status_certificates: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      certificate_files: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      certificate_history: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      incident_reports: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      incident_report_categories: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      incident_contact_emails: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      parking_requests: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      fire_safety_submissions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      board_approvals: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      board_members: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      board_member_applications: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      board_elections: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      election_positions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      election_candidates: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      election_ballots: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      portal_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      public_portal_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      portal_tile_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      portal_modules: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      custom_portal_tiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      portal_images: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      public_portal_documents: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      registration_field_options: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      profile_field_options: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_links: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_tax_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_unit_groups: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_unit_group_units: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_parking_groups: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_locker_groups: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_parking_pricing: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_reminders: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_external_integrations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      resident_maint_fees: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      email_records: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      notification_preferences: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      building_role_permission_defaults: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      occupancy_building_admin_modules: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      permission_modules: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      role_permission_defaults: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      consultation_submissions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      purchase_orders: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      chat_conversations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      chat_messages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_marketing_stats: {
        Args: Record<string, never>;
        Returns: {
          communities: number;
          owners: number;
          activated_users: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};
