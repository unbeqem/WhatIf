export type PlanTier = "free" | "pro" | "creator";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          plan: PlanTier;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          plan?: PlanTier;
          stripe_customer_id?: string | null;
        };
        Update: Partial<{
          plan: PlanTier;
          stripe_customer_id: string | null;
          updated_at: string;
        }>;
      };
      simulation_usage: {
        Row: {
          id: number;
          user_id: string | null;
          anon_id: string | null;
          ip_hash: string;
          input_length: number;
          blocked_reason: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          anon_id?: string | null;
          ip_hash: string;
          input_length: number;
          blocked_reason?: string | null;
        };
        Update: Partial<{
          blocked_reason: string | null;
        }>;
      };
    };
    Enums: { plan_tier: PlanTier };
  };
};
