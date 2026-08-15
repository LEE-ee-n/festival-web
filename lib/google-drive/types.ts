export const GOOGLE_DRIVE_PROVIDER = "google_drive" as const;

export type GoogleDriveConnectionStatus = {
  connected: boolean;
  connectedAt: string | null;
  lastUsedAt: string | null;
};

export type GoogleDrivePickedFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  fileType: "image" | "video";
};
