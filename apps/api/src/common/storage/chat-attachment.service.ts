import { BadRequestException, Injectable } from "@nestjs/common";
import { extname } from "path";
import {
  StorageCategory,
  STORAGE_CONFIG,
  EXTENSION_MIME_MAP,
} from "./storage.constants";
import { StorageService } from "./storage.service";

export const CHAT_MAX_FILES = 5;
export const CHAT_MAX_TOTAL_SIZE = 50 * 1024 * 1024;
export const CHAT_MAX_FILE_SIZE = Math.floor(
  CHAT_MAX_TOTAL_SIZE / CHAT_MAX_FILES,
);
export const CHAT_UPLOAD_LIMITS = {
  files: CHAT_MAX_FILES,
  fileSize: CHAT_MAX_FILE_SIZE,
  fields: 3,
  fieldSize: 256 * 1024,
  parts: CHAT_MAX_FILES + 3,
} as const;

export interface ChatAttachment {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ChatAttachmentService {
  private readonly allowedExtensions = new Set(
    Object.entries(EXTENSION_MIME_MAP)
      .filter(([, mime]) =>
        STORAGE_CONFIG[
          StorageCategory.CHAT_ATTACHMENT
        ].allowedMimeTypes.includes(mime),
      )
      .map(([extension]) => extension),
  );

  constructor(private readonly storage: StorageService) {}

  /**
   * Remove objects which were uploaded for a message that was not persisted.
   * Cleanup is best effort per key so one storage failure does not prevent the
   * remaining uploaded objects from being attempted.
   */
  async deleteUploadedAttachments(keys: string[]): Promise<void> {
    await Promise.all(
      [...new Set(keys.filter((key) => Boolean(key)))].map((key) =>
        this.storage.deleteByKey(key).catch(() => undefined),
      ),
    );
  }

  async upload(
    conversationId: string,
    files: Express.Multer.File[] | undefined,
  ): Promise<ChatAttachment[]> {
    if (!files?.length) return [];

    const totalSize = files.reduce((total, file) => total + file.size, 0);
    if (totalSize > CHAT_MAX_TOTAL_SIZE) {
      throw new BadRequestException({
        code: "CHAT_ATTACHMENTS_TOO_LARGE",
        details: { maxBytes: CHAT_MAX_TOTAL_SIZE },
      });
    }

    const uploadedKeys: string[] = [];
    try {
      const attachments: ChatAttachment[] = [];
      for (const file of files) {
        this.validate(file);
        const result = await this.storage.upload({
          category: StorageCategory.CHAT_ATTACHMENT,
          entityId: conversationId,
          file: {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
          subPath: "messages",
        });
        uploadedKeys.push(result.key);
        attachments.push({
          key: result.key,
          originalName: file.originalname,
          mimeType: result.mimeType,
          size: file.size,
        });
      }
      return attachments;
    } catch (error) {
      await this.deleteUploadedAttachments(uploadedKeys);
      throw error;
    }
  }

  private validate(file: Express.Multer.File): void {
    const extension = extname(file.originalname).toLowerCase();
    const expectedMime = EXTENSION_MIME_MAP[extension];

    // SVG is never accepted for chat attachments: it can carry active content.
    if (file.mimetype === "image/svg+xml" || extension === ".svg") {
      throw new BadRequestException({
        code: "CHAT_SVG_NOT_ALLOWED",
        details: {},
      });
    }
    if (!file.buffer?.length) {
      throw new BadRequestException({ code: "EMPTY_FILE", details: {} });
    }
    if (file.size > CHAT_MAX_FILE_SIZE) {
      throw new BadRequestException({
        code: "FILE_TOO_LARGE",
        details: { maxBytes: CHAT_MAX_FILE_SIZE },
      });
    }
    if (
      !expectedMime ||
      !this.allowedExtensions.has(extension) ||
      file.mimetype !== expectedMime
    ) {
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        details: { mimeType: file.mimetype, extension },
      });
    }

    const header = file.buffer;
    const hasSignature =
      (file.mimetype === "image/png" &&
        header.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) ||
      (file.mimetype === "image/jpeg" &&
        header.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) ||
      (file.mimetype === "image/gif" &&
        ["GIF87a", "GIF89a"].includes(header.subarray(0, 6).toString())) ||
      (file.mimetype === "application/pdf" &&
        header.subarray(0, 5).toString() === "%PDF-") ||
      ([
        "application/zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.mimetype) &&
        header.subarray(0, 4).equals(Buffer.from("504b0304", "hex"))) ||
      (file.mimetype === "application/msword" &&
        header.subarray(0, 4).equals(Buffer.from("d0cf11e0", "hex"))) ||
      (file.mimetype === "image/webp" &&
        header.subarray(0, 4).toString() === "RIFF" &&
        header.subarray(8, 12).toString() === "WEBP") ||
      (["video/mp4", "video/quicktime"].includes(file.mimetype) &&
        header.subarray(4, 8).toString() === "ftyp") ||
      (file.mimetype === "video/webm" &&
        header.subarray(0, 4).equals(Buffer.from("1a45dfa3", "hex")));

    if (!hasSignature && !["text/plain", "text/csv"].includes(file.mimetype)) {
      throw new BadRequestException({
        code: "INVALID_FILE_CONTENT",
        details: {},
      });
    }
  }
}
