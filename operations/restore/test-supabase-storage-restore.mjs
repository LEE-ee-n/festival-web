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

async function findLatestManifest(storageBackupRoot) {
  const snapshotRoot = path.join(storageBackupRoot, "snapshots");
  const entries = await fs.readdir(snapshotRoot, { withFileTypes: true });
  const manifests = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("festibom-") && !entry.name.endsWith(".tmp"))
    .map((entry) => path.join(snapshotRoot, entry.name, "manifest.json"))
    .sort()
    .reverse();
  if (manifests.length === 0) throw new Error(`No completed Storage backup snapshot found: ${snapshotRoot}`);
  return { manifestPath: manifests[0], manifest: JSON.parse(await fs.readFile(manifests[0], "utf8")) };
}

function selectSamples(objects, sampleCount) {
  const samples = [];
  const usedBuckets = new Set();
  for (const object of objects) {
    if (!usedBuckets.has(object.bucket_id)) {
      samples.push(object);
      usedBuckets.add(object.bucket_id);
      if (samples.length === sampleCount) return samples;
    }
  }
  for (const object of objects) {
    if (!samples.includes(object)) samples.push(object);
    if (samples.length === sampleCount) return samples;
  }
  return samples;
}

function hash(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function testBucketName() {
  const timestamp = new Date().toISOString().replace(/\D/gu, "").slice(0, 14);
  return `festibom-restore-test-${timestamp}-${crypto.randomBytes(3).toString("hex")}`;
}

const testBucketPrefix = "festibom-restore-test-";

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function deleteTestBucket(supabase, bucketId, knownPaths = []) {
  if (!bucketId.startsWith(testBucketPrefix)) {
    throw new Error(`Refusing to delete a non-test bucket: ${bucketId}`);
  }

  if (knownPaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(bucketId).remove(knownPaths);
    if (removeError) throw new Error(`Cannot remove test objects: ${removeError.message}`);
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const { error: emptyError } = await supabase.storage.emptyBucket(bucketId);
    if (emptyError && !emptyError.message.toLowerCase().includes("not found")) {
      throw new Error(`Cannot empty test bucket: ${emptyError.message}`);
    }

    await delay(attempt * 500);
    const { error: deleteError } = await supabase.storage.deleteBucket(bucketId);
    if (!deleteError || deleteError.message.toLowerCase().includes("not found")) return;
    if (!deleteError.message.toLowerCase().includes("not empty")) {
      throw new Error(`Cannot delete test bucket: ${deleteError.message}`);
    }
  }

  throw new Error("Test bucket remained non-empty after five cleanup attempts.");
}

async function cleanStaleTestBuckets(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Cannot inspect stale test buckets: ${error.message}`);
  const staleBuckets = (buckets ?? []).filter((bucket) => bucket.id.startsWith(testBucketPrefix));
  for (const bucket of staleBuckets) {
    await deleteTestBucket(supabase, bucket.id);
    console.log(`Stale test bucket deleted: ${bucket.id}`);
  }
}

async function writeResult(resultRoot, result) {
  await fs.mkdir(resultRoot, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
  const resultPath = path.join(resultRoot, `storage-restore-${timestamp}-${result.status}.json`);
  const latestPath = path.join(resultRoot, "latest-storage-restore-test.json");
  const body = `${JSON.stringify(result, null, 2)}\n`;
  await fs.writeFile(resultPath, body, "utf8");
  await fs.writeFile(latestPath, body, "utf8");
  return resultPath;
}

async function main() {
  await loadEnvironment();
  const storageBackupRoot = path.resolve(process.argv[2] ?? path.join(process.env.USERPROFILE ?? "", "Documents", "FestibomOperations", "backups", "storage"));
  const resultRoot = path.resolve(process.argv[3] ?? path.join(process.env.USERPROFILE ?? "", "Documents", "FestibomOperations", "restore-tests"));
  const sampleCount = Number(process.argv[4] ?? 3);
  if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 10) throw new Error("Sample count must be an integer from 1 to 10.");

  const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceKey = requiredEnvironment("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await cleanStaleTestBuckets(supabase);
  const { manifestPath, manifest } = await findLatestManifest(storageBackupRoot);
  const samples = selectSamples(manifest.objects ?? [], sampleCount);
  if (samples.length < sampleCount) throw new Error(`Backup contains only ${samples.length} objects; ${sampleCount} samples requested.`);

  const bucketId = testBucketName();
  const verified = [];
  let bucketCreated = false;
  let testError = null;

  console.log(`Snapshot: ${manifestPath}`);
  console.log(`Test bucket: ${bucketId} (private)`);
  try {
    const { error: createError } = await supabase.storage.createBucket(bucketId, { public: false });
    if (createError) throw new Error(`Cannot create test bucket: ${createError.message}`);
    bucketCreated = true;

    for (const sample of samples) {
      const blobPath = path.join(storageBackupRoot, sample.blob_path.replaceAll("/", path.sep));
      const bytes = await fs.readFile(blobPath);
      const localHash = hash(bytes);
      if (localHash !== sample.sha256) throw new Error(`Local backup hash mismatch before restore: ${sample.bucket_id}/${sample.object_path}`);

      const restoredPath = `${sample.bucket_id}/${sample.object_path}`;
      const { error: uploadError } = await supabase.storage.from(bucketId).upload(restoredPath, bytes, {
        upsert: false,
        contentType: sample.content_type ?? "application/octet-stream",
        cacheControl: "3600",
      });
      if (uploadError) throw new Error(`Cannot restore ${restoredPath}: ${uploadError.message}`);

      const { data: downloaded, error: downloadError } = await supabase.storage.from(bucketId).download(restoredPath);
      if (downloadError) throw new Error(`Cannot verify ${restoredPath}: ${downloadError.message}`);
      const restoredHash = hash(Buffer.from(await downloaded.arrayBuffer()));
      if (restoredHash !== sample.sha256) throw new Error(`Restored object hash mismatch: ${restoredPath}`);

      verified.push({ source_bucket: sample.bucket_id, source_path: sample.object_path, restored_path: restoredPath, bytes: sample.bytes, sha256: sample.sha256 });
      console.log(`[OK] ${restoredPath} - ${sample.bytes.toLocaleString("en-US")} bytes - SHA-256 matched`);
    }
  } catch (error) {
    testError = error;
  } finally {
    if (bucketCreated) {
      try {
        await deleteTestBucket(supabase, bucketId, verified.map((item) => item.restored_path));
        console.log(`Test bucket deleted: ${bucketId}`);
      } catch (cleanupError) {
        const cleanupMessage = `Test bucket cleanup failed: ${cleanupError.message}`;
        testError = testError ? new Error(`${testError.message}; ${cleanupMessage}`) : new Error(cleanupMessage);
      }
    }
  }

  const result = {
    tested_at: new Date().toISOString(),
    status: testError ? "failure" : "success",
    source_snapshot: manifestPath,
    test_bucket: bucketId,
    test_bucket_deleted: bucketCreated && !testError,
    verified_count: verified.length,
    verified,
    error: testError?.message ?? null,
  };
  const resultPath = await writeResult(resultRoot, result);
  console.log(`Result: ${resultPath}`);
  if (testError) throw testError;
  console.log(`Storage restore test: OK (${verified.length} objects)`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
