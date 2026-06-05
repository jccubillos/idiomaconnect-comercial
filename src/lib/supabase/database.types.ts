// Generated placeholder. Regenerate with `npm run db:types`.
// This is the manual mirror of supabase/migrations/*.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Plan = "trial" | "family_monthly" | "family_yearly" | "expired";
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
          payment_provider: PaymentProvider;
          payment_customer_id: string | null;
          payment_subscription_id: string | null;
          plan: Plan;
          trial_ends_at: string;
          subscription_status: string | null;
          parental_consent_at: string | null;
          privacy_accepted_at: string | null;
          tos_accepted_at: string | null;
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
    };
    Enums: Record<string, never>;
  };
}
