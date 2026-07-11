import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { RobustErrorLoggerService } from "../../modules/health/services/robust-error-logger.service";
import {
  ErrorCategory,
  ErrorLevel,
} from "../../modules/health/dto/health-check.dto";

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private errorLogger: RobustErrorLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    const extractedMessage =
      typeof message === "object" && message !== null && "message" in message
        ? (message as { message: string | string[] }).message
        : message;

    const normalizedMessage = Array.isArray(extractedMessage)
      ? extractedMessage.join("; ")
      : extractedMessage;

    const path = request.originalUrl ?? request.url;
    const method = request.method;
    const userId = (request as any).user?.id;

    // Capture request body for debugging (be careful with sensitive data)
    const requestBody = this.sanitizeRequestBody(request.body);
    const queryParams = request.query;

    // Build comprehensive context
    const context: Record<string, any> = {
      statusCode: status,
      path,
      method,
      userId,
      userAgent: request.get("user-agent"),
      ip: request.ip,
      query: queryParams,
      timestamp: new Date().toISOString(),
      // Include request ID for tracing
      requestId:
        request.headers["x-request-id"] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Include sanitized body for non-GET requests
    if (method !== "GET" && requestBody) {
      context.requestBody = requestBody;
    }

    // Determine severity and category
    const level = this.determineErrorLevel(status, exception);
    const category = this.categorizeError(path, exception);

    // Create error summary
    const summary =
      exception instanceof Error
        ? `${exception.name}: ${exception.message}`
        : String(normalizedMessage);

    // Log to console immediately
    if (level === ErrorLevel.ERROR) {
      this.logger.error(
        `${method} ${path} -> ${status} ${summary}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // ALWAYS persist to error logger (never lose data!)
    // Use void to not block response
    void this.errorLogger.logError({
      level,
      category,
      message: `[HTTP ${status}] ${summary}`,
      error: exception instanceof Error ? exception : undefined,
      context,
      service: this.getServiceName(path),
      endpoint: `${method} ${path}`,
      userId,
      metadata: {
        httpStatus: status,
        isHttpException: exception instanceof HttpException,
        exceptionName: exception instanceof Error ? exception.name : "Unknown",
      },
    });

    // Send response
    response.status(status).json({
      success: false,
      statusCode: status,
      message: normalizedMessage,
      timestamp: new Date().toISOString(),
      path,
      // Include request ID for client to report
      requestId: context.requestId,
    });
  }

  private determineErrorLevel(status: number, exception: unknown): ErrorLevel {
    if (status >= 500) return ErrorLevel.ERROR;
    if (status >= 400) {
      // 404s and auth failures are warnings, 400s might be client errors
      if (status === 404 || status === 401 || status === 403) {
        return ErrorLevel.WARN;
      }
      return ErrorLevel.ERROR;
    }
    // Unhandled exceptions are errors
    if (!(exception instanceof HttpException)) {
      return ErrorLevel.ERROR;
    }
    return ErrorLevel.INFO;
  }

  private categorizeError(path: string, exception: unknown): ErrorCategory {
    // Map paths to error categories
    if (
      path.includes("/payments") ||
      path.includes("/invoices") ||
      path.includes("/stripe")
    ) {
      return ErrorCategory.PAYMENT_GATEWAY;
    }
    if (
      path.includes("/storage") ||
      path.includes("/files") ||
      path.includes("/upload")
    ) {
      return ErrorCategory.STORAGE;
    }
    if (
      path.includes("/auth") ||
      path.includes("/login") ||
      path.includes("/register") ||
      path.includes("/password")
    ) {
      return ErrorCategory.AUTH;
    }
    if (path.includes("/ai/") || path.includes("/analyze")) {
      return ErrorCategory.AI_SERVICE;
    }
    if (
      path.includes("/email") ||
      path.includes("/notifications") ||
      path.includes("/smtp")
    ) {
      return ErrorCategory.EMAIL;
    }
    if (path.includes("/health") || path.includes("/admin/health")) {
      return ErrorCategory.DATABASE; // Health checks monitor DB
    }

    // Check exception type for database errors
    if (exception instanceof Error) {
      const msg = exception.message.toLowerCase();
      if (
        msg.includes("prisma") ||
        msg.includes("database") ||
        msg.includes("connection") ||
        msg.includes("timeout")
      ) {
        return ErrorCategory.DATABASE;
      }
      if (
        msg.includes("memory") ||
        msg.includes("heap") ||
        msg.includes("out of memory")
      ) {
        return ErrorCategory.MEMORY;
      }
      if (
        msg.includes("network") ||
        msg.includes("econnrefused") ||
        msg.includes("enotfound")
      ) {
        return ErrorCategory.NETWORK;
      }
    }

    return ErrorCategory.GENERAL;
  }

  private getServiceName(path: string): string {
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return segments[1].toUpperCase();
    }
    return "API";
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== "object") return body;

    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "authorization",
      "cookie",
      "credit_card",
      "cvv",
    ];
    const sanitized = { ...body };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}
