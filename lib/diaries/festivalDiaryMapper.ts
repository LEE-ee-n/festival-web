import type { FestivalDiaryRecord } from "./festivalRecordTypes";

type FestivalDiaryRow = {
  id: number;
  festival_id: number;
  attended_date: string;
  attended_dates?: string[];
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export function toFestivalDiaryRecord(row: FestivalDiaryRow): FestivalDiaryRecord {
  return {
    id: row.id,
    festivalId: row.festival_id,
    attendedDate: row.attended_date,
    attendedDates: row.attended_dates ?? [row.attended_date],
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
