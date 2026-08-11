export type FestivalDiaryRecord = {
  id: number;
  festivalId: number;
  attendedDate: string;
  attendedDates: string[];
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type FestivalDiaryListItem = FestivalDiaryRecord & {
  festivalName: string;
  festivalLocation: string | null;
  festivalStartDate: string;
  festivalEndDate: string;
  festivalThumbnailUrl: string | null;
  summary: string;
  coverImageUrl: string | null;
};

export type FestivalRecordOption = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  thumbnailUrl: string | null;
};

export type FestivalLineupOption = {
  id: number;
  performanceDate: string | null;
  performanceTime: string | null;
  performanceEndTime: string | null;
  stageName: string | null;
  artistId: number;
  artistName: string;
};

export type FestivalExperienceStatus = "watched" | "briefly" | "missed";

export type FestivalRecordPerformance = FestivalLineupOption & {
  recordPerformanceId: number;
  experienceStatus: FestivalExperienceStatus | null;
  rating: number | null;
  memo: string | null;
  artistImageUrl: string | null;
  songs: Array<{ id: number; songName: string }>;
  media: Array<{
    id: number;
    provider: string;
    externalFileId: string | null;
    previewUrl: string | null;
    fileType: string;
  }>;
};

export type FestivalRecordDetail = FestivalDiaryListItem & {
  favoritePerformanceId: number | null;
  performances: FestivalRecordPerformance[];
};

export type FestivalDiaryInput = {
  attendedDate: string;
  title: string;
  content: string;
};
