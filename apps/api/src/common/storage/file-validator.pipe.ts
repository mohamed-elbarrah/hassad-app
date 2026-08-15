import { PipeTransform, Injectable } from "@nestjs/common";
import { ApiException } from "../errors/api-error";
import {
  StorageCategory,
  STORAGE_CONFIG,
  EXTENSION_MIME_MAP,
} from "./storage.constants";
import { extname } from "path";

export interface FileValidationOptions {
  category: StorageCategory;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions) {}

  transform(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new ApiException("FILE_REQUIRED", "File is required", 400);
    }

    const config = STORAGE_CONFIG[this.options.category];
    const maxSize = this.options.maxFileSize ?? config.maxFileSize;
    const allowedTypes =
      this.options.allowedMimeTypes ?? config.allowedMimeTypes;

    if (file.size > maxSize) {
      throw new ApiException(
        "FILE_TOO_LARGE",
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds the ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`,
        400,
        { size: file.size, maxSize },
      );
    }

    const ext = extname(file.originalname).toLowerCase();
    const declaredMime = file.mimetype;
    const expectedMime = EXTENSION_MIME_MAP[ext];

    if (
      !allowedTypes.includes(declaredMime) &&
      (!expectedMime || !allowedTypes.includes(expectedMime))
    ) {
      throw new ApiException(
        "FILE_TYPE_NOT_ALLOWED",
        `File type "${declaredMime}" is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        400,
        { declaredMime, allowedTypes },
      );
    }

    return file;
  }
}
