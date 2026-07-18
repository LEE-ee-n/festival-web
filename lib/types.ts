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

export interface ArtistReference {
  id: number;
  name: string;
}

export interface FestivalArtist {
  artist_id: number;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string;
  artists: ArtistReference | ArtistReference[] | null;
}

export interface FestivalTicketRound {
  id: number;
  round_type: string | null;
  round_name: string;
  open_at: string | null;
  price_info: string | null;
  ticket_url: string | null;
  ticket_platform: string | null;
}

export type FestivalCandidateStatus =
  | "pending"
  | "approved"
  | "rejected";

export type FestivalDraftJson = {
  candidate?: {
    title?: string;
    source_type?: string;
    source_url?: string;
    raw_text?: string;
    score?: number;
    source_assets?: CandidateSourceAsset[];
  };
  festival: {
    name: string;
    normalized_name: string;
    search_aliases?: string;
    start_date: string;
    end_date: string;
    location?: string;
    address?: string;
    region?: string;
    category?: string;
    description?: string;
    price_info?: string;
    program_info?: string;
    source_url?: string;
    official_url?: string;
    thumbnail_url?: string;
    price_type?: string;
    status?: string;
  };
  artists: Array<{
    input_name: string;
    display_name: string;
    normalized_name: string;
    matched_artist_id?: number | null;
    match_status?: "pending" | "matched" | "new";
    aliases: string[];
    performance_date?: string;
    performance_time?: string;
    performance_end_time?: string;
    stage_name?: string;
    status?: string;
  }>;
  tickets?: Array<{
    round_type?: string;
    round_name?: string;
    open_at?: string;
    close_at?: string;
    price_info?: string;
    ticket_url?: string;
    ticket_platform?: string;
    status?: string;
  }>;
};

export type CandidateSourceAsset = {
  type?: string;
  name?: string;
  url?: string;
};

export interface FestivalCandidate {
  id: number;
  title: string;
  source_url: string | null;
  source_type: string | null;
  raw_text: string | null;
  festival_name: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  category: string | null;
  score: number | null;
  status: FestivalCandidateStatus;
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  festival_id: number | null;
  draft_json: FestivalDraftJson | null;
  source_assets: CandidateSourceAsset[];
  review_notes: string | null;
  reviewed_by: string | null;
}
