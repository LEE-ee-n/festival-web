import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

export function isYes24InputFilename(filename: string) {
  return /^\d{6}-YES24-crwal(?: \(\d+\))?\.json$/i.test(filename);
}

export async function findLatestYes24Input(extraDirectories: string[] = []) {
  const directories = [resolve(homedir(), "Downloads"), resolve(homedir(), "Desktop"), ...extraDirectories];
  const candidates: Array<{ path: string; modifiedAtMs: number }> = [];
  for (const directory of directories) {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !isYes24InputFilename(entry.name)) continue;
        const path = resolve(directory, entry.name);
        candidates.push({ path, modifiedAtMs: (await stat(path)).mtimeMs });
      }
    } catch {
      // 존재하지 않거나 접근할 수 없는 검색 폴더는 건너뛴다.
    }
  }
  const latest = candidates.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs)[0]?.path;
  if (!latest) throw new Error("다운로드 또는 수집 폴더에서 YES24-crwal JSON을 찾지 못했습니다.");
  return latest;
}
