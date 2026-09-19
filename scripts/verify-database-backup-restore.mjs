#!/usr/bin/env node
import { randomBytes, createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (!argument.startsWith("--")) continue;
  const [key, value] = argument.slice(2).split("=", 2);
  args.set(key, value ?? process.argv[index + 1]);
  if (value === undefined) index += 1;
}

const postgresContainer = args.get("postgres-container") ?? process.env.POSTGRES_CONTAINER ?? "hassad_db";
const postgresUser = args.get("postgres-user") ?? process.env.POSTGRES_USER ?? "hassad";
const backupId = args.get("backup-id") ?? process.env.BACKUP_ID;
const backupFolderId = args.get("backup-folder") ?? process.env.BACKUP_FOLDER_ID;
const isolatedConfirmation = args.get("isolated-confirmation") ?? process.env.RESTORE_VERIFY_CONFIRM;
const isolatedTarget = args.get("isolated-target") ?? process.env.RESTORE_VERIFY_ISOLATED;
const allowedLocalContainers = new Set(["hassad_db"]);
const tempDatabase = `hassad_restore_verify_${Date.now()}_${randomBytes(4).toString("hex")}`;
const prisma = new PrismaClient();
let tempDirectory;
let tempDump;
let dumpCopied = false;
let databaseCreated = false;

function docker(...parameters) {
  return execFileSync("docker", parameters, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function psql(database, sql) {
  return docker(
    "exec",
    postgresContainer,
    "psql",
    "-U",
    postgresUser,
    "-d",
    database,
    "-v",
    "ON_ERROR_STOP=1",
    "-At",
    "-c",
    sql,
  );
}

async function findDatabaseObject(s3, bucket, folderId) {
  if (!/^[0-9a-f-]{36}$/i.test(folderId)) {
    throw new Error("BACKUP_FOLDER_ID_INVALID");
  }
  const response = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: `backups/${folderId}/` }),
  );
  const candidates = (response.Contents ?? [])
    .filter((object) => object.Key?.endsWith("/database.dump"))
    .sort((left, right) => Number(right.LastModified ?? 0) - Number(left.LastModified ?? 0));
  if (!candidates[0]?.Key) {
    throw new Error(`DATABASE_DUMP_NOT_FOUND_IN_BACKUP_FOLDER: ${folderId}`);
  }
  return candidates[0].Key;
}

async function downloadAndVerify(s3, bucket, key, expectedSize, expectedChecksum, destination) {
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (expectedSize !== null && Number(head.ContentLength) !== Number(expectedSize)) {
    throw new Error(`BACKUP_SIZE_MISMATCH: expected ${expectedSize}, received ${head.ContentLength}`);
  }

  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error("BACKUP_OBJECT_EMPTY");
  await pipeline(response.Body, createWriteStream(destination));

  const hash = createHash("sha256");
  await pipeline(
    createReadStream(destination),
    new Writable({
      write(chunk, _encoding, callback) {
        hash.update(chunk);
        callback();
      },
    }),
  );
  const actualChecksum = hash.digest("hex");
  if (expectedChecksum && actualChecksum !== expectedChecksum) {
    throw new Error(`BACKUP_CHECKSUM_MISMATCH: expected ${expectedChecksum}, received ${actualChecksum}`);
  }

  return { size: Number(head.ContentLength), checksum: actualChecksum };
}

async function main() {
  if (isolatedTarget !== "local") {
    throw new Error("RESTORE_VERIFY_ISOLATED must be explicitly set to local");
  }
  if (!allowedLocalContainers.has(postgresContainer)) {
    throw new Error(`BACKUP_RESTORE_VERIFY_CONTAINER_NOT_ALLOWLISTED: ${postgresContainer}`);
  }
  if (isolatedConfirmation !== "I_UNDERSTAND_ISOLATED_RESTORE_ONLY") {
    throw new Error("RESTORE_VERIFY_CONFIRM must equal I_UNDERSTAND_ISOLATED_RESTORE_ONLY");
  }
  if (process.env.NODE_ENV !== "development") {
    throw new Error("BACKUP_RESTORE_VERIFY_REQUIRES_DEVELOPMENT_ENV");
  }
  if (/(prod|production)/i.test(postgresContainer)) {
    throw new Error("BACKUP_RESTORE_VERIFY_PRODUCTION_CONTAINER_BLOCKED");
  }
  if (!backupFolderId && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is required unless BACKUP_FOLDER_ID is provided");
  if (!backupFolderId) {
    const metadataHost = new URL(process.env.DATABASE_URL).hostname;
    if (!["localhost", "127.0.0.1", "::1"].includes(metadataHost)) {
      throw new Error("BACKUP_METADATA_DATABASE_MUST_BE_LOCAL");
    }
  }
  for (const variable of ["CLOUDFLARE_R2_BUCKET", "CLOUDFLARE_R2_ENDPOINT", "CLOUDFLARE_R2_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_KEY"]) {
    if (!process.env[variable]) throw new Error(`${variable} is required`);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
    },
  });
  const backup = backupFolderId
    ? {
        id: backupFolderId,
        databaseKey: await findDatabaseObject(s3, process.env.CLOUDFLARE_R2_BUCKET, backupFolderId),
        checksum: null,
        sizeBytes: null,
      }
    : await prisma.backup.findFirst({
        where: {
          ...(backupId ? { id: backupId } : {}),
          scope: "DATABASE_ONLY",
          status: "COMPLETED",
          databaseKey: { not: null },
          checksum: { not: null },
        },
        orderBy: { completedAt: "desc" },
        select: { id: true, databaseKey: true, checksum: true, sizeBytes: true },
      });
  if (!backup?.databaseKey || (!backupFolderId && !backup.checksum)) {
    throw new Error(backupId ? `COMPLETED_DATABASE_BACKUP_NOT_FOUND: ${backupId}` : "COMPLETED_DATABASE_BACKUP_NOT_FOUND");
  }

  const serverVersion = psql("postgres", "SHOW server_version_num");
  if (!serverVersion.startsWith("17")) {
    throw new Error(`POSTGRES_MAJOR_VERSION_MISMATCH: expected 17, received ${serverVersion}`);
  }

  tempDirectory = await mkdtemp(join(tmpdir(), "hassad-restore-verify-"));
  tempDump = join(tempDirectory, "database.dump");

  const object = await downloadAndVerify(
    s3,
    process.env.CLOUDFLARE_R2_BUCKET,
    backup.databaseKey,
    backup.sizeBytes === null ? null : Number(backup.sizeBytes),
    backup.checksum,
    tempDump,
  );

  try {
    dumpCopied = true;
    docker("cp", tempDump, `${postgresContainer}:/tmp/${tempDatabase}.dump`);
    psql("postgres", `CREATE DATABASE "${tempDatabase}"`);
    databaseCreated = true;
    docker(
      "exec",
      postgresContainer,
      "pg_restore",
      "--exit-on-error",
      "--no-owner",
      "--no-acl",
      "-U",
      postgresUser,
      "-d",
      tempDatabase,
      `/tmp/${tempDatabase}.dump`,
    );

    const validation = psql(
      tempDatabase,
      "SELECT json_build_object('database', current_database(), 'publicTables', (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public'), 'users', (SELECT count(*) FROM users), 'prismaMigrations', EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations'), 'appliedMigrations', (SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL))::text",
    );
    const result = JSON.parse(validation);
    if (!result.prismaMigrations || Number(result.publicTables) === 0 || Number(result.appliedMigrations) === 0) {
      throw new Error("BACKUP_RESTORE_VALIDATION_FAILED");
    }

    console.log(JSON.stringify({
      status: "RESTORE_VERIFIED",
      backupId: backup.id,
      databaseKey: backup.databaseKey,
      dumpSize: object.size,
      checksum: object.checksum,
      isolatedDatabase: tempDatabase,
      validation: result,
    }, null, 2));
  } finally {
    if (databaseCreated) {
      try {
        psql("postgres", `DROP DATABASE IF EXISTS "${tempDatabase}"`);
      } catch (error) {
        console.error("RESTORE_VERIFY_DATABASE_CLEANUP_FAILED");
      }
    }
    if (dumpCopied) {
      try {
        docker("exec", postgresContainer, "rm", "-f", `/tmp/${tempDatabase}.dump`);
      } catch (error) {
        console.error("RESTORE_VERIFY_DUMP_CLEANUP_FAILED");
      }
    }
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
  if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
}
