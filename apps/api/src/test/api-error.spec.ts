import { HttpStatus } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  API_ERROR_CODES,
  ApiException,
  errorCodeForStatus,
} from "../common/errors/api-error";

describe("API error contract", () => {
  it("maps standard HTTP statuses to stable fallback codes", () => {
    expect(errorCodeForStatus(HttpStatus.BAD_REQUEST)).toBe("HTTP_ERROR");
    expect(errorCodeForStatus(HttpStatus.UNAUTHORIZED)).toBe(
      API_ERROR_CODES.AUTHENTICATION_REQUIRED,
    );
    expect(errorCodeForStatus(HttpStatus.FORBIDDEN)).toBe(
      API_ERROR_CODES.PERMISSION_DENIED,
    );
    expect(errorCodeForStatus(HttpStatus.NOT_FOUND)).toBe(
      API_ERROR_CODES.RESOURCE_NOT_FOUND,
    );
    expect(errorCodeForStatus(HttpStatus.INTERNAL_SERVER_ERROR)).toBe(
      API_ERROR_CODES.INTERNAL_ERROR,
    );
  });

  it("stores a domain code, message, and details in the exception response", () => {
    const exception = new ApiException(
      "CONTRACT_NOT_SIGNED",
      "Contract must be signed before activation",
      HttpStatus.BAD_REQUEST,
      { currentStatus: "SENT" },
    );

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.getResponse()).toEqual({
      code: "CONTRACT_NOT_SIGNED",
      message: "Contract must be signed before activation",
      details: { currentStatus: "SENT" },
    });
  });
});
