export type FestivalCategory =
  | "music_festival"
  | "local_festival"
  | "food_festival"
  | "culture_festival"
  | "other";

export type FestivalStatus =
  | "scheduled"
  | "ongoing"
  | "ended"
  | "cancelled";

export type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected";

export type PriceType =
  | "free"
  | "paid"
  | "partial_free"
  | "unknown";

export interface Festival {
  id: number;
  name: string;
  start_date: string;
  end_date: string;

  location: string | null;
  address: string | null;
  region: string | null;

  category: FestivalCategory;
  description: string | null;

  official_url: string | null;
  thumbnail_url: string | null;

  price_info: string | null;
  price_type: PriceType | null;
  program_info: string | null;

  source_url: string | null;
  slug: string | null;

  status: FestivalStatus | null;
  confidence_score: number | null;
  verification_status: VerificationStatus | null;

  created_at: string | null;
  updated_at: string | null;
}

export interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}