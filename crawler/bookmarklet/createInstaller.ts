import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildNolBookmarkletInstallerHtml } from "./nolTicketBookmarklet.ts";

const outputDirectory = resolve(process.cwd(), "crawler-output");
const outputPath = resolve(outputDirectory, "nol-bookmarklet-installer.html");
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, buildNolBookmarkletInstallerHtml(), "utf8");
process.stdout.write(`북마클릿 설치 파일 생성 완료: ${outputPath}\n`);
