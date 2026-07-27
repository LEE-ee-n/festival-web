import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildInstagramFirstImageInstallerHtml } from "./instagramFirstImageBookmarklet.ts";

const outputDirectory = resolve(process.cwd(), "crawler-output");
const outputPath = resolve(
  outputDirectory,
  "instagram-first-image-bookmarklet-installer.html",
);

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, buildInstagramFirstImageInstallerHtml(), "utf8");
process.stdout.write(`Instagram 북마클릿 설치 파일 생성 완료: ${outputPath}\n`);
