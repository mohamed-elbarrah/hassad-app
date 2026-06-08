import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";
import { extname } from "path";
import {
  StorageCategory,
  STORAGE_CONFIG,
  PRESIGNED_URL_EXPIRY_SECONDS,
  EXTENSION_MIME_MAP,
} from "./storage.constants";

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface UploadOptions {
  category: StorageCategory;
  entityId: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  subPath?: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET || "";

    if (!endpoint || !accessKey || !secretKey || !this.bucket) {
      this.logger.warn(
        "CLOUDFLARE_R2_* environment variables are not fully configured. File storage will not work until they are set.",
      );
    }

    this.s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: accessKey || "",
        secretAccessKey: secretKey || "",
      },
    });
  }

  async onModuleInit() {
    if (!process.env.CLOUDFLARE_R2_ENDPOINT) {
      this.logger.warn(
        "R2 storage is not configured. Skipping connectivity check.",
      );
      return;
    }

    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log("R2 storage connected successfully");
    } catch (error) {
      this.logger.error(
        `Failed to connect to R2 storage: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  generateKey(
    category: StorageCategory,
    entityId: string,
    fileName: string,
    subPath?: string,
  ): string {
    const config = STORAGE_CONFIG[category];
    const unique = randomBytes(16).toString("hex");
    const ext = extname(fileName).toLowerCase();
    const prefix = config.keyPrefix;

    if (subPath) {
      return `${prefix}/${entityId}/${subPath}/${unique}${ext}`;
    }

    return `${prefix}/${entityId}/${unique}${ext}`;
  }

  generateKeyForSubEntity(
    category: StorageCategory,
    parentId: string,
    subEntity: string,
    subId: string,
    fileName: string,
  ): string {
    const config = STORAGE_CONFIG[category];
    const ext = extname(fileName).toLowerCase();
    const prefix = config.keyPrefix;

    return `${prefix}/${parentId}/${subEntity}/${subId}${ext}`;
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { category, entityId, file, subPath } = options;
    const config = STORAGE_CONFIG[category];

    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      const ext = extname(file.originalname).toLowerCase();
      const mappedMime = EXTENSION_MIME_MAP[ext];
      if (!mappedMime || !config.allowedMimeTypes.includes(mappedMime)) {
        throw new Error(
          `File type "${file.mimetype}" is not allowed for category "${category}". Allowed types: ${config.allowedMimeTypes.join(", ")}`,
        );
      }
    }

    if (file.size > config.maxFileSize) {
      throw new Error(
        `File size ${file.size} bytes exceeds maximum ${config.maxFileSize} bytes for category "${category}"`,
      );
    }

    const key = this.generateKey(
      category,
      entityId,
      file.originalname,
      subPath,
    );
    const contentType =
      file.mimetype ||
      EXTENSION_MIME_MAP[extname(file.originalname).toLowerCase()] ||
      "application/octet-stream";

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
      }),
    );

    const url = await this.getPresignedUrl(key);

    return {
      key,
      url,
      size: file.size,
      mimeType: contentType,
      originalName: file.originalname,
    };
  }

  async uploadForSubEntity(
    category: StorageCategory,
    parentId: string,
    subEntity: string,
    subId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ): Promise<UploadResult> {
    const config = STORAGE_CONFIG[category];

    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      const ext = extname(file.originalname).toLowerCase();
      const mappedMime = EXTENSION_MIME_MAP[ext];
      if (!mappedMime || !config.allowedMimeTypes.includes(mappedMime)) {
        throw new Error(
          `File type "${file.mimetype}" is not allowed for category "${category}".`,
        );
      }
    }

    if (file.size > config.maxFileSize) {
      throw new Error(`File size exceeds maximum for category "${category}".`);
    }

    const key = this.generateKeyForSubEntity(
      category,
      parentId,
      subEntity,
      subId,
      file.originalname,
    );
    const contentType =
      file.mimetype ||
      EXTENSION_MIME_MAP[extname(file.originalname).toLowerCase()] ||
      "application/octet-stream";

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
      }),
    );

    const url = await this.getPresignedUrl(key);

    return {
      key,
      url,
      size: file.size,
      mimeType: contentType,
      originalName: file.originalname,
    };
  }

  async deleteByKey(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete R2 object "${key}": ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
      const listResponse = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
        }),
      );

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return;
      }

      const objects = listResponse.Contents.map((obj) => ({ Key: obj.Key! }));

      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: objects },
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete R2 objects with prefix "${prefix}": ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async getPresignedUrl(
    key: string,
    expiresInSeconds: number = PRESIGNED_URL_EXPIRY_SECONDS.DOWNLOAD,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number = PRESIGNED_URL_EXPIRY_SECONDS.UPLOAD,
  ): Promise<string> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async getMultiplePresignedUrls(
    keys: string[],
    expiresInSeconds: number = PRESIGNED_URL_EXPIRY_SECONDS.DOWNLOAD,
  ): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();
    await Promise.all(
      keys.map(async (key) => {
        const url = await this.getPresignedUrl(key, expiresInSeconds);
        urlMap.set(key, url);
      }),
    );
    return urlMap;
  }

  isConfigured(): boolean {
    return !!(
      process.env.CLOUDFLARE_R2_ENDPOINT &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_SECRET_KEY &&
      process.env.CLOUDFLARE_R2_BUCKET
    );
  }
}
