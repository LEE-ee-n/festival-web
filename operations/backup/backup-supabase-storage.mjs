import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");

function parseEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

async function loadEnvironment() {
  for (const fileName of [".env", ".env.local"]) {
    try {
      const environmentPath = path.join(repositoryRoot, fileName);
      const stat = await fs.stat(environmentPath);
      if (!stat.isFile()) continue;
      const values = parseEnv(await fs.readFile(environmentPath, "utf8"));
      for (const [key, value] of Object.entries(values)) if (!process.env[key]) process.env[key] = value;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function requiredEnvironment(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${names.join(" or ")}`);
}

function safeTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
}

async function listObjects(storage, bucketId, prefix = "") {
  const objects = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await storage.from(bucketId).list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`Cannot list ${bucketId}/${prefix}: ${error.message}`);
    for (const item of data ?? []) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null && item.metadata === null) objects.push(...(await listObjects(storage, bucketId, objectPath)));
      else objects.push({ ...item, objectPath });
    }
    if (!data || data.length < pageSize) break;
  }
  return objects;
}

async function findLatestManifest(snapshotRoot) {
  try {
    const entries = await fs.readdir(snapshotRoot, { withFileTypes: true });
    const candidates = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("festibom-")).map((entry) => path.join(snapshotRoot, entry.name, "manifest.json")).sort().reverse();
    for (const candidate of candidates) {
      try { return JSON.parse(await fs.readFile(candidate, "utf8")); } catch { /* Skip incomplete snapshots. */ }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return null;
}

function objectKey(bucketId, objectPath) { return `${bucketId}\n${objectPath}`; }

async function writeBlob(destination, blobRoot, bytes, sha256) {
  const directory = path.join(blobRoot, sha256.slice(0, 2));
  const blobPath = path.join(directory, sha256);
  await fs.mkdir(directory, { recursive: true });
  try { await fs.access(blobPath); }
  catch {
    const temporaryPath = `${blobPath}.tmp-${crypto.randomUUID()}`;
    await fs.writeFile(temporaryPath, bytes, { flag: "wx" });
    try { await fs.rename(temporaryPath, blobPath); }
    catch (error) {
      await fs.rm(temporaryPath, { force: true });
      if (error?.code !== "EEXIST") throw error;
    }
  }
  return path.relative(destination, blobPath).replaceAll("\\", "/");
}

async function main() {
  await loadEnvironment();
  const destinationArgument = process.argv[2];
  if (!destinationArgument) throw new Error("Usage: node backup-supabase-storage.mjs <destination>");
  const destination = path.resolve(destinationArgument);
  if (destination === repositoryRoot || destination.startsWith(`${repositoryRoot}${path.sep}`)) throw new Error("Storage backup destination must be outside the Git repository.");

  const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceKey = requiredEnvironment("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const blobRoot = path.join(destination, "blobs", "sha256");
  const snapshotRoot = path.join(destination, "snapshots");
  await fs.mkdir(blobRoot, { recursive: true });
  await fs.mkdir(snapshotRoot, { recursive: true });

  const previousManifest = await findLatestManifest(snapshotRoot);
  const previousObjects = new Map((previousManifest?.objects ?? []).map((object) => [objectKey(object.bucket_id, object.object_path), object]));
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) throw new Error(`Cannot list Storage buckets: ${bucketError.message}`);

  const manifestObjects = [];
  let downloadedCount = 0, reusedCount = 0, totalBytes = 0;
  for (const bucket of (buckets ?? []).sort((a, b) => a.id.localeCompare(b.id))) {
    const objects = await listObjects(supabase.storage, bucket.id);
    console.log(`[BUCKET] ${bucket.id}: ${objects.length} objects`);
    for (const [index, object] of objects.entries()) {
      const size = Number(object.metadata?.size ?? 0);
      const previous = previousObjects.get(objectKey(bucket.id, object.objectPath));
      let sha256, blobPath;
      if (previous && previous.updated_at === object.updated_at && previous.bytes === size && previous.sha256 && previous.blob_path) {
        try {
          await fs.access(path.join(destination, previous.blob_path.replaceAll("/", path.sep)));
          sha256 = previous.sha256; blobPath = previous.blob_path; reusedCount += 1;
        } catch { /* Missing local blob: download again. */ }
      }
      if (!sha256) {
        const { data, error } = await supabase.storage.from(bucket.id).download(object.objectPath);
        if (error) throw new Error(`Cannot download ${bucket.id}/${object.objectPath}: ${error.message}`);
        const bytes = Buffer.from(await data.arrayBuffer());
        sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
        blobPath = await writeBlob(destination, blobRoot, bytes, sha256);
        downloadedCount += 1;
      }
      totalBytes += size;
      manifestObjects.push({ bucket_id: bucket.id, object_path: object.objectPath, bytes: size, sha256, blob_path: blobPath, content_type: object.metadata?.mimetype ?? object.metadata?.contentType ?? null, created_at: object.created_at ?? null, updated_at: object.updated_at ?? null });
      if ((index + 1) % 100 === 0) console.log(`  ${index + 1}/${objects.length}`);
    }
  }

  const snapshotName = `festibom-${safeTimestamp()}`;
  const temporarySnapshot = path.join(snapshotRoot, `${snapshotName}.tmp`);
  const snapshotDirectory = path.join(snapshotRoot, snapshotName);
  await fs.mkdir(temporarySnapshot, { recursive: false });
  const manifest = {
    version: 1, created_at: new Date().toISOString(), source: supabaseUrl,
    storage_scope: "all buckets and original objects", bucket_count: buckets?.length ?? 0,
    object_count: manifestObjects.length, total_bytes: totalBytes, downloaded_count: downloadedCount, reused_count: reusedCount,
    buckets: (buckets ?? []).map((bucket) => ({ id: bucket.id, name: bucket.name, public: bucket.public, file_size_limit: bucket.file_size_limit, allowed_mime_types: bucket.allowed_mime_types })),
    objects: manifestObjects,
  };
  await fs.writeFile(path.join(temporarySnapshot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fs.rename(temporarySnapshot, snapshotDirectory);
  console.log("Storage backup complete.");
  console.log(`Snapshot: ${snapshotDirectory}`);
  console.log(`Buckets: ${manifest.bucket_count}`);
  console.log(`Objects: ${manifest.object_count}`);
  console.log(`Downloaded: ${downloadedCount}, reused: ${reusedCount}`);
  console.log(`Logical bytes: ${totalBytes.toLocaleString("en-US")}`);
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });
