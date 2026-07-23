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
  timetable_status: "published" | "unpublished";

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
  normalized_name: string;
  artist_aliases?: Array<{
    alias_name: string;
  }>;
}

export interface FestivalArtist {
  id: number;
  artist_id: number;
  input_name?: string | null;
  performance_date: string | null;
  performance_time: string | null;
  performance_end_time: string | null;
  stage_name: string | null;
  status: string | null;
  artists: ArtistReference | ArtistReference[] | null;
  alias_text?: string;
  group_date?: string | null;
  group_stage?: string | null;
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
  workflow?: {
    step?: FestivalRegistrationStep;
    confirmed_steps?: FestivalRegistrationStep[];
    timetable_visibility?: "published" | "unpublished";
    base_festival_updated_at?: string | null;
  };
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
    match_status?: "pending" | "matched" | "new" | "excluded";
    aliases: string[];
    performance_date?: string;
    performance_time?: string;
    performance_end_time?: string;
    stage_name?: string;
    status?: string;
    comparison_status?: "existing" | "add" | "remove_candidate";
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

export type FestivalRegistrationStep =
  | "artist_review"
  | "artist_confirmation"
  | "festival_info"
  | "timetable"
  | "final_confirmation";

export type CandidateSourceAsset = {
  type?: string;
  name?: string;
  url?: string;
  storage_path?: string;
};

export type FestivalCandidateWorkType = "new" | "update" | "needs_review";

export type FestivalCandidateComparison = {
  work_type?: FestivalCandidateWorkType;
  existing_festival_id?: number | null;
  possible_festival_ids?: number[];
  counts?: {
    existing: number;
    add: number;
    remove_candidate: number;
  };
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
  work_type: FestivalCandidateWorkType;
  announcement_round: string;
  version_number: number;
  parent_candidate_id: number | null;
  created_by: string | null;
  comparison_json: FestivalCandidateComparison;
}
