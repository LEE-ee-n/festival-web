import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GatewayIntentBits,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";

import {
  compareLineup,
  findFestivalConnection,
  getAnnouncementRound,
  normalizeDraftDates,
  uniqueStrings,
} from "./candidateComparison.js";
import {
  normalizeAsciiName,
  normalizeFestivalName,
} from "./nameNormalization.js";
import {
  excludeTicketCandidates,
  formatTicketExclusionResult,
} from "./ticketExclusion.js";

const required = [
  "DISCORD_BOT_TOKEN", "DISCORD_ALLOWED_USER_ID", "SUPABASE_URL",
  "SUPABASE_ANON_KEY", "SUPABASE_BOT_EMAIL", "SUPABASE_BOT_PASSWORD",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} 환경 변수가 필요합니다.`);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const retryRoot = resolve(root, "work", "retry");
const jobsRoot = resolve(root, "work", "jobs");
const chromePath = process.env.INSTAGRAM_CHROME_PATH || resolve(root, "chrome", "chrome.exe");
const profilePath = process.env.INSTAGRAM_PROFILE_PATH || resolve(root, "work", "instagram-chrome-profile");
const codexBin = resolve(root, "node_modules", "@openai", "codex", "bin", "codex.js");
const schemaPath = resolve(root, "src", "codex-output.schema.json");
const allowedUserId = process.env.DISCORD_ALLOWED_USER_ID;
const crawlerRoot = process.env.FESTIVAL_CRAWLER_ROOT
  || resolve(root, "..", "..", "crawler-output", "ticket-discovery");
const adminBaseUrl = (process.env.FESTIBOM_ADMIN_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
let browser;
let catalogCache;

async function signInBot() {
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.SUPABASE_BOT_EMAIL,
    password: process.env.SUPABASE_BOT_PASSWORD,
  });
  if (error) throw new Error(`Supabase Bot 로그인 실패: ${error.message}`);
}

async function fetchAll(table, columns, configure = (query) => query) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const query = configure(supabase.from(table).select(columns)).range(from, from + 999);
    const { data, error } = await query;
    if (error) throw new Error(`${table} 조회 실패: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}

async function getArtistCatalog() {
  if (catalogCache?.expiresAt > Date.now()) return catalogCache;
  const [artists, aliases] = await Promise.all([
    fetchAll("artists", "id,name,normalized_name"),
    fetchAll("artist_aliases", "artist_id,alias_name,normalized_alias"),
  ]);
  const byId = new Map(artists.map((artist) => [Number(artist.id), { ...artist, aliases: [] }]));
  for (const alias of aliases) byId.get(Number(alias.artist_id))?.aliases.push(alias.alias_name);
  const normalized = new Map();
  for (const artist of byId.values()) {
    normalized.set(artist.normalized_name, artist.id);
  }
  catalogCache = { byId, normalized, expiresAt: Date.now() + 600_000 };
  return catalogCache;
}

async function matchArtists(draft) {
  const catalog = await getArtistCatalog();
  draft.artists = draft.artists.map((artist) => {
    artist.normalized_name = normalizeAsciiName(
      artist.normalized_name || artist.display_name || artist.input_name,
    );
    const id = catalog.normalized.get(artist.normalized_name);
    if (!id) return { ...artist, matched_artist_id: null, match_status: "pending" };
    const existing = catalog.byId.get(Number(id));
    return {
      ...artist,
      display_name: existing.name,
      normalized_name: existing.normalized_name,
      // Existing artist aliases are protected. Incoming aliases require a
      // separate operator review and are not merged during festival ingestion.
      aliases: uniqueStrings(existing.aliases || []),
      matched_artist_id: existing.id,
      match_status: "matched",
    };
  });
}

async function compareWithDatabase(draft) {
  const festivals = await fetchAll("festivals", "id,name,normalized_name,search_aliases,start_date,end_date");
  const connection = findFestivalConnection(draft.festival, festivals);
  let existingArtistIds = [];
  if (connection.type === "update") {
    const lineup = await fetchAll(
      "festival_artists",
      "artist_id",
      (query) => query.eq("festival_id", connection.festival.id).neq("status", "cancelled"),
    );
    existingArtistIds = lineup.map((row) => row.artist_id);
  }
  draft.artists = compareLineup(draft.artists, existingArtistIds);
  return {
    work_type: connection.type,
    existing_festival_id: connection.festival?.id ?? null,
    possible_festival_ids: connection.possible?.map((item) => item.id) ?? [],
    counts: {
      existing: draft.artists.filter((item) => item.comparison_status === "existing").length,
      add: draft.artists.filter((item) => item.comparison_status === "add").length,
      remove_candidate: draft.artists.filter((item) => item.comparison_status === "remove_candidate").length,
    },
  };
}

async function getBrowser() {
  if (browser?.connected) return browser;
  browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: profilePath,
    defaultViewport: null,
  });
  return browser;
}

async function runCodex(imagePaths, source, jobDir) {
  const outputPath = resolve(jobDir, "codex-result.json");
  const prompt = `Instagram 포스터와 캡션에서 페스티봄 DB 후보 JSON을 만드세요.
보이는 정보만 사용하고 추측하지 마세요. 모르는 시간과 무대는 빈 문자열로 두세요.
candidate.raw_text에는 OCR 원문과 유용한 캡션 근거를 보존하세요.
normalized_name은 영문 소문자와 숫자만 사용하세요. 포스터 원문은 input_name에 보존하세요.
축제 normalized_name에서는 20XX 연도와 festival 단어를 제거하세요.
아티스트 normalized_name에서는 특수문자를 제거하고 영문 소문자와 숫자만 남기세요.
영문 아티스트의 통용 한글 독음은 aliases에 추가하세요. 취소나 제외가 명시된 아티스트만 status=cancelled로 두세요.
POST URL: ${source.post_url}\nCAPTION:\n${source.caption}`;
  const args = [codexBin, "exec", "--sandbox", "read-only", "--ephemeral", "--skip-git-repo-check",
    "--cd", jobDir, "--output-schema", schemaPath, "--output-last-message", outputPath, "--color", "never"];
  for (const path of imagePaths) args.push("--image", path);
  args.push("-");
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, { cwd: jobDir, windowsHide: true, stdio: ["pipe", "ignore", "pipe"] });
    let errors = "";
    child.stderr.on("data", (chunk) => { errors += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise() : reject(new Error(errors.trim() || `Codex 종료 코드 ${code}`)));
    child.stdin.end(prompt);
  });
  return JSON.parse(await readFile(outputPath, "utf8"));
}

async function extractInstagramPost(url, jobId, update) {
  const page = await (await getBrowser()).newPage();
  const jobDir = resolve(jobsRoot, jobId);
  await mkdir(jobDir, { recursive: true });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector("img", { timeout: 30_000 });
    await new Promise((done) => setTimeout(done, 2500));
    const source = await page.evaluate(() => {
      const dialog = [...document.querySelectorAll('[role="dialog"]')].find((element) => element.querySelector("img"));
      const scope = dialog || document.querySelector("article") || document.querySelector("main");
      const rawCandidates = [...scope.querySelectorAll("img")]
        .map((img) => {
          const rect = img.getBoundingClientRect();
          const sourceSet = (img.srcset || "").split(",").map((item) => item.trim().split(/\s+/)[0]).filter(Boolean);
          const url = sourceSet.at(-1) || img.currentSrc || img.src;
          return {
            url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            area: rect.width * rect.height,
            top: rect.top,
            bottom: rect.bottom,
          };
        })
        .filter((item) => item.width >= 300 && item.height >= 300)
        .filter((item) => item.url && item.area > 0);
      const primary = rawCandidates.toSorted((a, b) => a.top - b.top || b.area - a.area)[0];
      const morePostsTop = [...scope.querySelectorAll("h1, h2, h3, span")]
        .map((element) => ({ text: element.innerText?.trim() || "", top: element.getBoundingClientRect().top }))
        .filter((item) => /게시물 더 보기|more posts from/i.test(item.text) && item.top > (primary?.top || 0))
        .sort((a, b) => a.top - b.top)[0]?.top;
      const postBottom = morePostsTop || (primary ? primary.bottom + 40 : Number.POSITIVE_INFINITY);
      const candidates = rawCandidates.filter((item) => item.top < postBottom);
      const max = Math.max(0, ...candidates.map((item) => item.area));
      const metaImage = document.querySelector('meta[property="og:image"]')?.content || "";
      const images = [...new Set([
        ...candidates.filter((item) => item.area >= max * 0.40).map((item) => item.url),
        metaImage,
      ].filter((item) => /^https?:/i.test(item)))];
      const genericText = /이용 약관|개인정보처리방침|가입하기|로그인|terms of use|privacy policy|sign up|log in/i;
      const captionOptions = [
        ...[...scope.querySelectorAll("h1, span")]
          .filter((element) => element.getBoundingClientRect().top < postBottom)
          .map((element) => element.innerText?.trim() || ""),
        document.querySelector('meta[property="og:description"]')?.content || "",
      ].filter((text) => text.length > 25 && !genericText.test(text));
      const caption = captionOptions.sort((a, b) => b.length - a.length)[0] || "";
      const visibleDialogText = [...document.querySelectorAll('[role="dialog"]')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((element) => element.innerText || "").join("\n");
      const login_required = /가입하기|로그인|sign up|log in/i.test(visibleDialogText);
      return { post_url: location.href, caption, images, candidate_count: candidates.length, login_required };
    });
    if (source.login_required) {
      throw new Error("Instagram 로그인이 필요합니다. Bot이 연 Chrome에서 로그인한 뒤 다시 보내주세요.");
    }
    const images = [];
    const downloadErrors = [];
    const userAgent = await page.evaluate(() => navigator.userAgent);
    for (let index = 0; index < source.images.length; index += 1) {
      await update(`사진 다운로드 ${index + 1}/${source.images.length}`);
      try {
        const response = await fetch(source.images[index], {
          headers: { referer: "https://www.instagram.com/", "user-agent": userAgent },
          signal: AbortSignal.timeout(60_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const original = Buffer.from(await response.arrayBuffer());
        const buffer = await sharp(original)
          .rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 88, effort: 4 }).toBuffer();
        const path = resolve(jobDir, `image-${index + 1}.webp`);
        await writeFile(path, buffer);
        images.push({ path, buffer });
      } catch (error) {
        downloadErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (images.length === 0) {
      throw new Error(
        `포스터 이미지를 다운로드하지 못했습니다. 후보 ${source.images.length}개`
        + ` (화면 이미지 ${source.candidate_count}개)`
        + (downloadErrors.length ? ` · ${downloadErrors.join(", ").slice(0, 300)}` : " · Instagram 로그인 상태를 확인하세요."),
      );
    }
    await update("이미지 OCR 및 JSON 생성 중");
    const draft = await runCodex(images.map((image) => image.path), source, jobDir);
    draft.festival.normalized_name = normalizeFestivalName(
      draft.festival.normalized_name || draft.festival.name,
    );
    draft.candidate.source_type = "instagram_discord";
    draft.candidate.source_url = source.post_url;
    draft.festival.source_url = source.post_url;
    draft.festival.thumbnail_url = "";
    await update("DB 아티스트와 축제를 비교하는 중");
    await matchArtists(draft);
    const dateResult = normalizeDraftDates(draft);
    const comparison = await compareWithDatabase(draft);
    if (!dateResult.hasCompleteFestivalDates) {
      comparison.work_type = "needs_review";
      comparison.date_review_required = true;
    }
    return {
      draft,
      comparison,
      announcementRound: getAnnouncementRound(`${draft.candidate.raw_text}\n${source.caption}`),
      poster: images[0].buffer,
      sourceUrl: source.post_url,
    };
  } finally {
    await page.close();
    await rm(jobDir, { recursive: true, force: true });
  }
}

async function uploadPoster(jobId, poster) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Supabase Bot 세션이 없습니다.");
  const path = `${userId}/${jobId}.webp`;
  const { error } = await supabase.storage.from("festival-candidate-posters").upload(path, poster, {
    contentType: "image/webp", upsert: false,
  });
  if (error && !/already exists/i.test(error.message)) throw error;
  return path;
}

async function saveRegistrationDraft(result, jobId) {
  const storagePath = await uploadPoster(jobId, result.poster);
  const assets = [{ type: "image/webp", name: "festival-poster.webp", storage_path: storagePath }];
  result.draft.candidate.source_assets = assets;
  const isUpdate = result.comparison.work_type === "update";
  const { data, error } = isUpdate
    ? await supabase.rpc("create_discord_festival_update_draft", {
        p_festival_id: result.comparison.existing_festival_id,
        p_source_url: result.sourceUrl,
        p_draft: result.draft,
        p_comparison: result.comparison,
        p_announcement_round: result.announcementRound,
        p_regenerate: false,
      })
    : await supabase.rpc("create_discord_festival_registration_draft", {
        p_source_url: result.sourceUrl,
        p_draft: result.draft,
        p_source_assets: assets,
        p_announcement_round: result.announcementRound,
        p_comparison: result.comparison,
      });
  if (error) throw error;
  return data;
}

async function saveResult(result, jobId, regenerate) {
  void regenerate;
  return saveRegistrationDraft(result, jobId);
}

async function keepRetry(jobId, result, regenerate) {
  const dir = resolve(retryRoot, jobId);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, "result.json"), JSON.stringify({
    ...result, poster: undefined, regenerate,
  }, null, 2));
  await writeFile(resolve(dir, "poster.webp"), result.poster);
}

async function readRetry(jobId) {
  const dir = resolve(retryRoot, jobId);
  const meta = JSON.parse(await readFile(resolve(dir, "result.json"), "utf8"));
  return { ...meta, poster: await readFile(resolve(dir, "poster.webp")) };
}

async function cleanupRetries() {
  await mkdir(retryRoot, { recursive: true });
  const cutoff = Date.now() - 7 * 86_400_000;
  for (const name of await readdir(retryRoot)) {
    const path = resolve(retryRoot, name);
    if ((await stat(path)).mtimeMs < cutoff) await rm(path, { recursive: true, force: true });
  }
}

function retryButton(jobId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`db-retry:${jobId}`).setLabel("DB 저장 재시도").setStyle(ButtonStyle.Primary),
  );
}

function resultMessage(result, saved) {
  const { counts } = result.comparison;
  const type = result.comparison.work_type === "new" ? "신규" : result.comparison.work_type === "update" ? "업데이트" : "연결 확인 필요";
  const url = saved?.id
    ? result.comparison.work_type === "update"
      ? `${adminBaseUrl}/admin/festivals/import-json?festivalId=${saved.festival_id}&updateDraftId=${saved.id}`
      : `${adminBaseUrl}/admin/festival-candidates`
    : null;
  return `${saved ? "✅ 임시 작업 생성 완료" : "⚠️ 임시 작업 저장 실패"} · ${type}\n`
    + `${url ? `${url}\n` : ""}`
    + `기존 ${counts.existing}, +추가 ${counts.add}, 확인 ${counts.remove_candidate}`;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.author.id !== allowedUserId) return;
  try {
    const exclusionResult = await excludeTicketCandidates({
      content: message.content,
      crawlerRoot,
      now: () => new Date(),
    });
    if (exclusionResult) {
      await message.reply(formatTicketExclusionResult(exclusionResult));
      return;
    }
  } catch (error) {
    if (message.content.trim().toLowerCase().startsWith("!티켓제외")) {
      await message.reply(`티켓 제외 실패: ${error.message}`);
      return;
    }
  }
  const url = message.content.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/?/i)?.[0];
  if (!url) return;
  const regenerate = false;
  const jobId = message.id;
  const status = await message.reply("Instagram 게시물을 확인하는 중입니다.");
  try {
    const [candidateResult, updateResult] = await Promise.all([
      supabase.from("festival_candidates").select("id").eq("source_url", url).limit(1),
      supabase.from("festival_update_drafts").select("id,festival_id").eq("source_url", url).limit(1),
    ]);
    const existingCandidate = candidateResult.data?.[0];
    const existingUpdate = updateResult.data?.[0];
    if (existingCandidate || existingUpdate) {
      const existingUrl = existingUpdate
        ? `${adminBaseUrl}/admin/festivals/import-json?festivalId=${existingUpdate.festival_id}&updateDraftId=${existingUpdate.id}`
        : `${adminBaseUrl}/admin/festival-candidates`;
      await status.edit(`이미 처리했거나 진행 중인 URL입니다.\n${existingUrl}`);
      return;
    }
    const result = await extractInstagramPost(url, jobId, (text) => status.edit(text));
    try {
      const saved = await saveResult(result, jobId, regenerate);
      await status.edit({
        content: resultMessage(result, saved),
      });
    } catch (error) {
      await keepRetry(jobId, result, regenerate);
      await status.edit({ content: `${resultMessage(result, null)}\n${error.message}`, components: [retryButton(jobId)] });
    }
  } catch (error) {
    await status.edit(`처리 실패: ${error.message}`);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith("db-retry:")) return;
  if (interaction.user.id !== allowedUserId) {
    await interaction.reply({ content: "권한이 없습니다.", ephemeral: true });
    return;
  }
  const jobId = interaction.customId.slice("db-retry:".length);
  await interaction.deferReply({ ephemeral: true });
  try {
    const result = await readRetry(jobId);
    await saveResult(result, jobId, result.regenerate);
    await rm(resolve(retryRoot, jobId), { recursive: true, force: true });
    await interaction.editReply("DB 저장이 완료되었습니다.");
    await interaction.message.edit({ components: [] });
  } catch (error) {
    await interaction.editReply(`DB 저장 실패: ${error.message}`);
  }
});

client.once("clientReady", async () => {
  await cleanupRetries();
  console.log(`Festibom Discord Bot 로그인: ${client.user.tag}`);
});

await mkdir(jobsRoot, { recursive: true });
await signInBot();
await client.login(process.env.DISCORD_BOT_TOKEN);
