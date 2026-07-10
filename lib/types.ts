export type FestivalCategory =
  | "music_festival"
  | "local_festival"
  | "food_festival"
  | "culture_festival"
  | "other";

export interface Festival {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  category: FestivalCategory;
  description: string | null;
}

export interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}