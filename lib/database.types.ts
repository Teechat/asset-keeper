export type Recurrence =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export interface User {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: string;
  item_name: string | null;
  subcategory: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  asset_id: string;
  due_date: string; // ISO date string YYYY-MM-DD
  recurrence: Recurrence;
  recurrence_value: number;
  recurrence_unit: "days" | "weeks" | "months" | "years";
  advance_notice_days: number[];
  last_sent_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface AssetWithReminder extends Asset {
  reminders: Reminder[];
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Asset, "id" | "created_at" | "updated_at">>;
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, "id" | "created_at">;
        Update: Partial<Omit<Reminder, "id" | "created_at">>;
      };
    };
  };
}
