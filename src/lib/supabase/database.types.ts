// Generated placeholder. Regenerate with `npm run db:types`.
// This is the manual mirror of supabase/migrations/*.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Plan = "trial" | "family_monthly" | "family_yearly" | "school" | "expired";
export type OrgType = "family" | "school";
export type StaffRole = "admin" | "teacher";
export type LeadStatus = "new" | "contacted" | "won" | "lost";
export type PaymentProvider = "lemonsqueezy" | "stripe" | "paddle" | "mercadopago" | "flow";
export type Skill = "vocabulary" | "grammar" | "listening" | "speaking" | "writing" | "reading";

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          owner_user_id: string;
          family_name: string;
          org_type: OrgType;
          seats: number | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          comuna: string | null;
          region: string | null;
          payment_provider: PaymentProvider;
          payment_customer_id: string | null;
          payment_subscription_id: string | null;
          plan: Plan;
          trial_ends_at: string;
          subscription_status: string | null;
          parental_consent_at: string | null;
          privacy_accepted_at: string | null;
          tos_accepted_at: string | null;
          parent_pin_hash: string | null;
          payment_failed_at: string | null;
          marketing_opt_out: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["families"]["Row"]> & {
          owner_user_id: string;
          family_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["families"]["Row"]>;
      };
      kid_profiles: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          birth_date: string | null;
          emoji: string;
          avatar_url: string | null;
          color_hex: string;
          gradient: string | null;
          hobbies: string | null;
          tone: string | null;
          grade: string | null;
          course_id: string | null;
          total_xp: number;
          cefr_level: CEFRLevel;
          current_world: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["kid_profiles"]["Row"]> & {
          family_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["kid_profiles"]["Row"]>;
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          relation: string;
          name: string;
          age: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["family_members"]["Row"]> & {
          family_id: string;
          relation: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["family_members"]["Row"]>;
      };
      lesson_sessions: {
        Row: {
          id: string;
          kid_id: string;
          world_key: string | null;
          lesson_type: string;
          topic: string | null;
          skill: Skill | null;
          score_pct: number | null;
          xp_gained: number;
          attempts: number | null;
          duration_seconds: number | null;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lesson_sessions"]["Row"]> & {
          kid_id: string;
          lesson_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_sessions"]["Row"]>;
      };
      srs_cards: {
        Row: {
          id: string;
          kid_id: string;
          word_en: string;
          translation_es: string | null;
          example_sentence: string | null;
          interval_days: number;
          ease_factor: number;
          repetition: number;
          due_at: string;
          last_quality: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["srs_cards"]["Row"]> & {
          kid_id: string;
          word_en: string;
        };
        Update: Partial<Database["public"]["Tables"]["srs_cards"]["Row"]>;
      };
      trophies_earned: {
        Row: {
          id: string;
          kid_id: string;
          trophy_key: string;
          earned_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trophies_earned"]["Row"]> & {
          kid_id: string;
          trophy_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["trophies_earned"]["Row"]>;
      };
      usage_events: {
        Row: {
          id: string;
          family_id: string;
          kid_id: string | null;
          event_type: string;
          tokens_used: number | null;
          cost_usd_cents: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["usage_events"]["Row"]> & {
          family_id: string;
          event_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["usage_events"]["Row"]>;
      };
      staff_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          full_name: string | null;
          role: StaffRole;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff_members"]["Row"]> & {
          org_id: string;
          user_id: string;
          role: StaffRole;
        };
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Row"]>;
      };
      courses: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          grade_label: string | null;
          current_theme: string | null;
          current_context: string | null;
          context_updated_at: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
      };
      course_teachers: {
        Row: {
          course_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["course_teachers"]["Row"]> & {
          course_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["course_teachers"]["Row"]>;
      };
      school_leads: {
        Row: {
          id: string;
          institution_name: string;
          address: string | null;
          comuna: string | null;
          region: string | null;
          contact_name: string;
          contact_role: string | null;
          phone: string | null;
          email: string;
          num_students: number | null;
          levels: string | null;
          has_english_teacher: boolean | null;
          message: string | null;
          status: LeadStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["school_leads"]["Row"]> & {
          institution_name: string;
          contact_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["school_leads"]["Row"]>;
      };
      trial_registry: {
        Row: {
          email: string;
          first_trial_at: string;
          retrial_authorized: boolean;
          retrial_authorized_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["trial_registry"]["Row"]> & {
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["trial_registry"]["Row"]>;
      };
      email_log: {
        Row: {
          id: string;
          family_id: string | null;
          email: string;
          kind: string;
          sent_at: string;
          meta: Record<string, unknown> | null;
        };
        Insert: Partial<Database["public"]["Tables"]["email_log"]["Row"]> & {
          email: string;
          kind: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_log"]["Row"]>;
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          reason: string;
          message: string | null;
          file_path: string | null;
          status: "new" | "answered" | "closed";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contact_messages"]["Row"]> & {
          name: string;
          email: string;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Row"]>;
      };
      app_admins: {
        Row: {
          user_id: string;
          totp_secret: string | null;
          totp_verified: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["app_admins"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_admins"]["Row"]>;
      };
      admin_audit: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          detail: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_audit"]["Row"]> & {
          user_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_audit"]["Row"]>;
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          percent: number;
          duration: "once" | "repeating" | "forever";
          duration_months: number | null;
          max_redemptions: number;
          expires_at: string | null;
          ls_discount_id: string | null;
          active: boolean;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["discount_codes"]["Row"]> & {
          code: string;
          percent: number;
        };
        Update: Partial<Database["public"]["Tables"]["discount_codes"]["Row"]>;
      };
    };
    Views: {
      leaderboard_weekly: {
        Row: {
          kid_id: string;
          family_id: string;
          name: string;
          emoji: string;
          color_hex: string;
          cefr_level: CEFRLevel;
          week_xp: number;
          total_xp: number;
        };
      };
    };
    Functions: {
      current_family_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      user_staff_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      user_admin_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      user_teacher_course_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: Record<string, never>;
  };
}
