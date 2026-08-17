import { HttpException, HttpStatus } from "@nestjs/common";

export const API_ERROR_CODES = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  CONFLICT: "CONFLICT",
  HTTP_ERROR: "HTTP_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode =
  | (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]
  | (string & {});

const SENSITIVE_DETAIL_KEYS = [
  "accesskey",
  "apikey",
  "authorization",
  "cookie",
  "credential",
  "creditcard",
  "cvv",
  "encryptionkey",
  "password",
  "privatekey",
  "refreshtoken",
  "secret",
  "token",
];

export function sanitizeApiErrorDetails(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeApiErrorDetails);

  const sanitized: Record<string, unknown> = {};
  for (const [key, detail] of Object.entries(value)) {
    if (
      SENSITIVE_DETAIL_KEYS.some((sensitiveKey) =>
        key
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .includes(sensitiveKey),
      )
    ) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeApiErrorDetails(detail);
    }
  }

  return sanitized;
}

export class ApiException extends HttpException {
  constructor(
    code: ApiErrorCode,
    message: string,
    status: HttpStatus,
    details: unknown = null,
  ) {
    super({ code, message, details: sanitizeApiErrorDetails(details) }, status);
  }
}

export function errorCodeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return API_ERROR_CODES.HTTP_ERROR;
    case HttpStatus.UNAUTHORIZED:
      return API_ERROR_CODES.AUTHENTICATION_REQUIRED;
    case HttpStatus.FORBIDDEN:
      return API_ERROR_CODES.PERMISSION_DENIED;
    case HttpStatus.NOT_FOUND:
      return API_ERROR_CODES.RESOURCE_NOT_FOUND;
    case HttpStatus.CONFLICT:
      return API_ERROR_CODES.CONFLICT;
    default:
      return status >= 500
        ? API_ERROR_CODES.INTERNAL_ERROR
        : API_ERROR_CODES.HTTP_ERROR;
  }
}
