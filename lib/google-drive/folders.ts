const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

type DriveFolder = { id: string; name: string };
type Fetcher = typeof fetch;

export function normalizeDriveFolderName(name: string, fallback: string) {
  const normalized = name.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return (normalized || fallback).slice(0, 150);
}

export function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findDriveFolder(accessToken: string, name: string, parentId: string, fetcher: Fetcher): Promise<DriveFolder | null> {
  const query = [
    `name = '${escapeDriveQueryValue(name)}'`,
    `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    "trashed = false",
  ].join(" and ");
  const params = new URLSearchParams({ q: query, spaces: "drive", fields: "files(id,name)", pageSize: "1" });
  const response = await fetcher(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google Drive folder lookup failed: ${response.status}`);
  const result = await response.json() as { files?: DriveFolder[] };
  return result.files?.[0] ?? null;
}

async function createDriveFolder(accessToken: string, name: string, parentId: string, fetcher: Fetcher): Promise<DriveFolder> {
  const response = await fetcher("https://www.googleapis.com/drive/v3/files?fields=id,name", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: DRIVE_FOLDER_MIME_TYPE, parents: [parentId] }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google Drive folder creation failed: ${response.status}`);
  return response.json() as Promise<DriveFolder>;
}

export async function getOrCreateDriveFolder(accessToken: string, name: string, parentId = "root", fetcher: Fetcher = fetch) {
  return await findDriveFolder(accessToken, name, parentId, fetcher)
    ?? await createDriveFolder(accessToken, name, parentId, fetcher);
}

export async function getOrCreateFestivalDriveFolder(
  accessToken: string,
  festivalName: string,
  festivalId: number,
  fetcher: Fetcher = fetch,
) {
  const root = await getOrCreateDriveFolder(accessToken, "Festibom", "root", fetcher);
  const childName = normalizeDriveFolderName(festivalName, `Festival ${festivalId}`);
  const folder = await getOrCreateDriveFolder(accessToken, childName, root.id, fetcher);
  return { ...folder, rootFolderId: root.id };
}
