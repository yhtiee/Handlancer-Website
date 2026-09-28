/**
 * Row types for the admin console.
 *
 * Mirrors the mobile app's `src/services/database.types.ts` (itself a hand copy
 * of Handlancer-Mobile-Application/supabase/migrations). If a migration there
 * changes a column, change it here too. Once the project is linked, replace this
 * file with `supabase gen types typescript` output.
 *
 * Only what the admin reads is typed. The admin also reaches tables the app
 * never can (`wallet_security`, `waitlist`, `admin_users`) and the
 * service-role-only settlement functions from 0009.
 */

export type UserRole = 'user' | 'provider';
export type JobStatus =
  | 'draft'
  | 'posted'
  | 'hiring'
  | 'in_progress'
  | 'completed'
  | 'disputed'
  | 'cancelled';
export type QuoteStatus = 'submitted' | 'approved' | 'rejected' | 'revised';
export type EscrowStatus = 'pending' | 'funded' | 'materials_released' | 'completed' | 'refunded';
export type TxnType = 'fund' | 'withdraw' | 'escrow_hold' | 'escrow_release' | 'payout';
export type TxnStatus = 'pending' | 'success' | 'failed';
export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'rejected';
export type AdminRole = 'owner' | 'support';

export type Profile = {
  id: string;
  role: UserRole;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  business_name: string | null;
  availability: 'available' | 'busy' | 'on_call' | 'offline' | null;
  is_verified: boolean | null;
  services: string[] | null;
  rating: number | null;
  hourly_rate: number | null;
  years_experience: number | null;
  created_at: string;
};

export type Job = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget: number | null;
  location: string | null;
  is_direct: boolean;
  hired_provider_id: string | null;
  status: JobStatus;
  scheduled_for: string | null;
  created_at: string;
};

export type Quote = {
  id: string;
  job_id: string;
  provider_id: string;
  line_items: { label: string; type: 'material' | 'labor'; amount: number }[];
  materials_cost: number;
  labor_cost: number;
  total: number;
  message: string | null;
  status: QuoteStatus;
  created_at: string;
};

export type Escrow = {
  id: string;
  job_id: string;
  total: number;
  materials_amount: number;
  materials_released: boolean;
  workmanship_released: boolean;
  status: EscrowStatus;
  materials_requested_at: string | null;
  completion_requested_at: string | null;
  created_at: string;
};

export type Wallet = {
  id: string;
  owner_id: string;
  balance: number;
  currency: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  wallet_id: string;
  job_id: string | null;
  type: TxnType;
  status: TxnStatus;
  amount: number;
  reference: string | null;
  created_at: string;
};

export type Dispute = {
  id: string;
  job_id: string;
  opened_by: string;
  reason: string | null;
  category: string | null;
  desired_outcome: string | null;
  reference: string | null;
  status: DisputeStatus;
  resolution: string | null;
  resolved_at: string | null;
  refunded_amount: number | null;
  released_amount: number | null;
  created_at: string;
};

/**
 * 0012. RLS on with no policies — only the service role can read it. The PIN
 * hash and full account number live here too; admin queries never select them.
 */
export type WalletSecurity = {
  user_id: string;
  pin_set_at: string | null;
  pin_failed_attempts: number | null;
  pin_locked_until: string | null;
  bank_code: string | null;
  bank_name: string | null;
  account_name: string | null;
  bank_verified_at: string | null;
  updated_at: string;
};

export type WaitlistEntry = {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  city: string;
  category: string;
  years_experience: number | null;
  referral: string | null;
  created_at: string;
};

export type AdminUser = {
  user_id: string;
  email: string;
  role: AdminRole;
  created_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      jobs: Table<Job>;
      quotes: Table<Quote>;
      escrows: Table<Escrow>;
      wallets: Table<Wallet>;
      transactions: Table<Transaction>;
      disputes: Table<Dispute>;
      wallet_security: Table<WalletSecurity>;
      waitlist: Table<WaitlistEntry>;
      admin_users: Table<AdminUser>;
    };
    Views: Record<string, never>;
    Functions: {
      /** 0009. `p_release_amount` is the provider's share; the rest is refunded. */
      admin_resolve_dispute: {
        Args: { p_job_id: string; p_release_amount: number; p_note: string | null };
        Returns: undefined;
      };
      admin_refund_dispute: {
        Args: { p_job_id: string; p_note: string | null };
        Returns: undefined;
      };
      admin_release_dispute: {
        Args: { p_job_id: string; p_note: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      quote_status: QuoteStatus;
      escrow_status: EscrowStatus;
      txn_type: TxnType;
      txn_status: TxnStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
