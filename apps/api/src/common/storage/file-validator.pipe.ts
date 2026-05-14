import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { StorageCategory, STORAGE_CONFIG, EXTENSION_MIME_MAP } from './storage.constants';
import { extname } from 'path';

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
      throw new BadRequestException('File is required');
    }

    const config = STORAGE_CONFIG[this.options.category];
    const maxSize = this.options.maxFileSize ?? config.maxFileSize;
    const allowedTypes = this.options.allowedMimeTypes ?? config.allowedMimeTypes;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds the ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`,
      );
    }

    const ext = extname(file.originalname).toLowerCase();
    const declaredMime = file.mimetype;
    const expectedMime = EXTENSION_MIME_MAP[ext];

    if (!allowedTypes.includes(declaredMime) && (!expectedMime || !allowedTypes.includes(expectedMime))) {
      throw new BadRequestException(
        `File type "${declaredMime}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    return file;
  }
}