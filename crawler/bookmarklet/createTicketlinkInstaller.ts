import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildTicketlinkInstallerHtml } from "./ticketlinkBookmarklet.ts";

const outputDirectory = resolve(process.cwd(), "crawler-output");
const outputPath = resolve(outputDirectory, "ticketlink-bookmarklet-installer.html");
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, buildTicketlinkInstallerHtml(), "utf8");
process.stdout.write(`티켓링크 북마클릿 설치 파일 생성 완료: ${outputPath}\n`);
