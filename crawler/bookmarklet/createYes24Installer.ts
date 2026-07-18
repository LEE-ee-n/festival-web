import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildYes24InstallerHtml } from "./yes24TicketBookmarklet.ts";

const outputDirectory = resolve(process.cwd(), "crawler-output");
const outputPath = resolve(outputDirectory, "yes24-bookmarklet-installer.html");
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, buildYes24InstallerHtml(), "utf8");
process.stdout.write(`YES24 북마클릿 설치 파일 생성 완료: ${outputPath}\n`);
