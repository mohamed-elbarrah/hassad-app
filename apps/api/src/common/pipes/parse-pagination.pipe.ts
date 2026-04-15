import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * ParsePaginationPipe — transforms raw query params into validated pagination values.
 * Defaults: page=1, limit=20. Max limit is capped at 100.
 */
@Injectable()
export class ParsePaginationPipe implements PipeTransform {
  transform(value: { page?: string | number; limit?: string | number }): PaginationParams {
    const page = Number(value?.page ?? 1);
    const limit = Number(value?.limit ?? 20);

    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be an integer between 1 and 100');
    }

    return { page, limit, skip: (page - 1) * limit };
  }
}
