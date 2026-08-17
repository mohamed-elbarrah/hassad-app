import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import {
  API_ERROR_CODES,
  ApiException,
  errorCodeForStatus,
} from "../common/errors/api-error";
import {
  badRequest,
  conflict,
  forbidden,
  internal,
  notFound,
} from "../common/errors/domain-errors";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";

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

  it("creates domain exceptions with the expected status and details", () => {
    const helpers = [
      [
        badRequest("TASK_INVALID_STATUS", "Task status is invalid", {
          operation: "update",
        }),
        HttpStatus.BAD_REQUEST,
      ],
      [
        notFound("TASK_NOT_FOUND", "Task not found", { taskId: "task-1" }),
        HttpStatus.NOT_FOUND,
      ],
      [
        forbidden("CHAT_MESSAGE_EDIT_FORBIDDEN", "Message edit is forbidden", {
          messageId: "message-1",
        }),
        HttpStatus.FORBIDDEN,
      ],
      [
        conflict("USER_EMAIL_ALREADY_EXISTS", "Email is already in use", {
          field: "email",
        }),
        HttpStatus.CONFLICT,
      ],
      [
        internal("AI_PROVIDER_TEST_FAILED", "Provider test failed", {
          provider: "openai",
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      ],
    ] as const;

    for (const [exception, status] of helpers) {
      expect(exception).toBeInstanceOf(ApiException);
      expect(exception.getStatus()).toBe(status);
      expect(exception.getResponse()).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
        details: expect.any(Object),
      });
    }

    expect(
      notFound("TASK_NOT_FOUND", "Task not found", {
        taskId: "task-1",
      }).getResponse(),
    ).toEqual({
      code: "TASK_NOT_FOUND",
      message: "Task not found",
      details: { taskId: "task-1" },
    });

    expect(
      badRequest(
        "PAYMENT_GATEWAY_CONFIG_MISSING",
        "Gateway configuration is missing",
        {
          gatewayToken: "secret-value",
        },
      ).getResponse(),
    ).toEqual({
      code: "PAYMENT_GATEWAY_CONFIG_MISSING",
      message: "Gateway configuration is missing",
      details: { gatewayToken: "[REDACTED]" },
    });
  });

  it("returns only the documented envelope for unknown errors", () => {
    const json = vi.fn();
    const response = {
      status: vi.fn().mockReturnValue({ json }),
    };
    const request = {
      originalUrl: "/v1/tasks",
      url: "/v1/tasks",
      method: "GET",
      body: undefined,
      query: {},
      headers: {},
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    };
    const filter = new HttpExceptionFilter({
      logError: vi.fn(),
    } as never);

    filter.catch(new Error("database password leaked"), host as never);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: null,
      },
    });
  });

  it("uses VALIDATION_FAILED with structured details for validation arrays", () => {
    const json = vi.fn();
    const response = { status: vi.fn().mockReturnValue({ json }) };
    const request = {
      originalUrl: "/v1/auth/register",
      url: "/v1/auth/register",
      method: "POST",
      body: {},
      query: {},
      headers: {},
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    };
    const filter = new HttpExceptionFilter({ logError: vi.fn() } as never);

    filter.catch(
      new BadRequestException([
        "email must be an email",
        "password is too short",
      ]),
      {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => request,
        }),
      } as never,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_FAILED",
        message: "email must be an email; password is too short",
        details: ["email must be an email", "password is too short"],
      },
    });
  });

  it("keeps legacy Nest exceptions on stable status fallback codes", () => {
    const json = vi.fn();
    const response = { status: vi.fn().mockReturnValue({ json }) };
    const request = {
      originalUrl: "/v1/tasks/task-1",
      url: "/v1/tasks/task-1",
      method: "GET",
      body: undefined,
      query: {},
      headers: {},
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    };
    const filter = new HttpExceptionFilter({ logError: vi.fn() } as never);

    filter.catch(new NotFoundException("Task not found"), {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as never);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Task not found",
        details: null,
      },
    });
  });

  it("redacts sensitive details from legacy HTTP exceptions", () => {
    const json = vi.fn();
    const response = { status: vi.fn().mockReturnValue({ json }) };
    const request = {
      originalUrl: "/v1/payments",
      url: "/v1/payments",
      method: "POST",
      body: {},
      query: {},
      headers: {},
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    };
    const filter = new HttpExceptionFilter({ logError: vi.fn() } as never);

    filter.catch(
      new HttpException(
        {
          code: "PAYMENT_GATEWAY_CONFIG_MISSING",
          message: "Gateway configuration is missing",
          details: {
            "api-key": "secret-value",
            "refresh-token": "refresh-secret",
            "credit-card": "card-secret",
            gatewayId: "gateway-1",
          },
        },
        HttpStatus.BAD_REQUEST,
      ),
      {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => request,
        }),
      } as never,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: "HTTP_ERROR",
        message: "Gateway configuration is missing",
        details: {
          "api-key": "[REDACTED]",
          "refresh-token": "[REDACTED]",
          "credit-card": "[REDACTED]",
          gatewayId: "gateway-1",
        },
      },
    });
  });

  it("sanitizes logged request context and hides 5xx messages", () => {
    const json = vi.fn();
    const logError = vi.fn();
    const response = { status: vi.fn().mockReturnValue({ json }) };
    const request = {
      originalUrl: "/v1/payments?token=url-secret",
      url: "/v1/payments?token=url-secret",
      method: "POST",
      body: { nested: { password: "body-secret" } },
      query: { token: "query-secret", nested: { apiKey: "query-key" } },
      headers: {},
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    };
    const filter = new HttpExceptionFilter({ logError } as never);

    filter.catch(
      new HttpException(
        {
          message: "provider secret response",
          code: "PROVIDER_SECRET_LEAK",
          details: { apiKey: "provider-key" },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
      {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => request,
        }),
      } as never,
    );

    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: null,
      },
    });
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "[HTTP 500] Internal server error",
        error: undefined,
        context: expect.objectContaining({
          path: "/v1/payments",
          query: { token: "[REDACTED]", nested: { apiKey: "[REDACTED]" } },
          requestBody: { nested: { password: "[REDACTED]" } },
        }),
      }),
    );
  });

  it("does not persist primitive request bodies", () => {
    const json = vi.fn();
    const logError = vi.fn();
    const response = { status: vi.fn().mockReturnValue({ json }) };
    const request = {
      originalUrl: "/v1/upload",
      url: "/v1/upload",
      method: "POST",
      body: "raw-secret-body",
      query: {},
      headers: {},
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    };
    const filter = new HttpExceptionFilter({ logError } as never);

    filter.catch(new Error("internal failure"), {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as never);

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.not.objectContaining({
          requestBody: expect.anything(),
        }),
      }),
    );
  });
});
