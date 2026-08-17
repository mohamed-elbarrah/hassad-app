import { HttpStatus } from "@nestjs/common";
import { ApiErrorCode, ApiException } from "./api-error";

export function badRequest(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): ApiException {
  return new ApiException(code, message, HttpStatus.BAD_REQUEST, details);
}

export function notFound(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): ApiException {
  return new ApiException(code, message, HttpStatus.NOT_FOUND, details);
}

export function forbidden(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): ApiException {
  return new ApiException(code, message, HttpStatus.FORBIDDEN, details);
}

export function conflict(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): ApiException {
  return new ApiException(code, message, HttpStatus.CONFLICT, details);
}

export function internal(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): ApiException {
  return new ApiException(
    code,
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    details,
  );
}
