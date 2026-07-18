import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

interface FileCandidate {
  path: string;
  modifiedAtMs: number;
}

export function isNolTicketInputFilename(filename: string): boolean {
  return (
    /^nol-tickets(?:-[0-9]{4}-[0-9]{2}-[0-9]{2})?(?: \([0-9]+\))?\.json$/i.test(filename) ||
    /^[0-9]{6}-NOL-crwal(?: \([0-9]+\))?\.json$/i.test(filename)
  );
}

export function selectLatestNolTicketFile(files: FileCandidate[]): string | undefined {
  return [...files].sort((a, b) => b.modifiedAtMs - a.modifiedAtMs)[0]?.path;
}

export async function findLatestNolTicketInput(extraDirectories: string[] = []): Promise<string> {
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
        if (!entry.isFile() || !isNolTicketInputFilename(entry.name)) continue;
        const path = resolve(directory, entry.name);
        const information = await stat(path);
        candidates.push({ path, modifiedAtMs: information.mtimeMs });
      }
    } catch {
      // 다운로드 또는 바탕화면 폴더가 없는 환경은 건너뛴다.
    }
  }

  const latest = selectLatestNolTicketFile(candidates);
  if (!latest) {
    throw new Error("다운로드 폴더나 바탕화면에서 nol-tickets JSON을 찾지 못했습니다.");
  }
  return latest;
}
