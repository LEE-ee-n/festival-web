import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

interface FileCandidate {
  path: string;
  modifiedAtMs: number;
}

export function isTicketlinkInputFilename(filename: string) {
  return /^\d{6}-TICKETLINK-crwal(?: \(\d+\))?\.json$/i.test(filename);
}

export async function findLatestTicketlinkInput(extraDirectories: string[] = []) {
  const directories = [
    resolve(homedir(), "Downloads"),
    resolve(homedir(), "Desktop"),
    ...extraDirectories,
  ];
  const candidates: FileCandidate[] = [];

  for (const directory of directories) {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !isTicketlinkInputFilename(entry.name)) continue;
        const path = resolve(directory, entry.name);
        const information = await stat(path);
        candidates.push({ path, modifiedAtMs: information.mtimeMs });
      }
    } catch {
      // 존재하지 않거나 접근할 수 없는 검색 폴더는 건너뛴다.
    }
  }

  const latest = candidates.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs)[0]?.path;
  if (!latest) throw new Error("다운로드 또는 수집 폴더에서 TICKETLINK-crwal JSON을 찾지 못했습니다.");
  return latest;
}
